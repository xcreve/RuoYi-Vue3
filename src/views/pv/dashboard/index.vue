<template>
  <div class="app-container pv-page">
    <div>
      <h1 class="pv-page-title">{{ $t('pv.dashboard.title') }}</h1>
      <p class="pv-page-subtitle">
        {{ $t(wsConnected ? 'pv.dashboard.subtitle.connected' : 'pv.dashboard.subtitle.fallback') }}
      </p>
    </div>

    <div class="pv-metric-grid">
      <div class="pv-metric-card">
        <div class="pv-stat-label">{{ $t('pv.dashboard.metrics.currentPower.label') }}</div>
        <div class="pv-stat-value">{{ formatNumber(summary.currentPowerKw) }} kW</div>
        <div class="pv-stat-desc">{{ $t('pv.dashboard.metrics.currentPower.desc') }}</div>
      </div>
      <div class="pv-metric-card">
        <div class="pv-stat-label">{{ $t('pv.dashboard.metrics.dailyYield.label') }}</div>
        <div class="pv-stat-value">{{ formatNumber(summary.dailyYieldKwh) }} kWh</div>
        <div class="pv-stat-desc">{{ $t('pv.dashboard.metrics.dailyYield.desc') }}</div>
      </div>
      <div class="pv-metric-card">
        <div class="pv-stat-label">{{ $t('pv.dashboard.metrics.onlineInverters.label') }}</div>
        <div class="pv-stat-value">{{ summary.onlineInverters || 0 }}/{{ summary.totalInverters || 0 }}</div>
        <div class="pv-stat-desc">{{ $t('pv.dashboard.metrics.onlineInverters.desc') }}</div>
      </div>
      <div class="pv-metric-card">
        <div class="pv-stat-label">{{ $t('pv.dashboard.metrics.totalCapacity.label') }}</div>
        <div class="pv-stat-value">{{ formatNumber(summary.totalCapacityMw) }} MW</div>
        <div class="pv-stat-desc">{{ $t('pv.dashboard.metrics.totalCapacity.desc') }}</div>
      </div>
    </div>

    <div class="pv-two-col">
      <div class="pv-card">
        <div class="pv-section-head">
          <div>
            <h3 class="pv-section-title">{{ $t('pv.dashboard.sections.powerTrend.title') }}</h3>
            <div class="pv-section-tip">{{ $t('pv.dashboard.sections.powerTrend.tip') }}</div>
          </div>
          <div class="pv-toolbar-right">
            <span class="pv-chip">
              <span class="pv-dot"></span>
              {{ $t('pv.dashboard.chip.activeAlerts', { count: summary.activeAlerts || 0 }) }}
            </span>
            <el-button v-if="canSimulate" type="primary" @click="handleSimulate">{{ $t('pv.dashboard.buttons.simulate') }}</el-button>
          </div>
        </div>
        <div ref="powerChartRef" class="pv-chart"></div>
      </div>

      <div class="pv-card">
        <div class="pv-section-head">
          <div>
            <h3 class="pv-section-title">{{ $t('pv.dashboard.sections.distribution.title') }}</h3>
            <div class="pv-section-tip">{{ $t('pv.dashboard.sections.distribution.tip') }}</div>
          </div>
        </div>
        <div ref="barChartRef" class="pv-chart"></div>
      </div>
    </div>

    <div class="pv-table-card">
      <div class="pv-section-head">
        <div>
          <h3 class="pv-section-title">{{ $t('pv.dashboard.sections.activeAlerts.title') }}</h3>
          <div class="pv-section-tip">{{ $t('pv.dashboard.sections.activeAlerts.tip') }}</div>
        </div>
        <el-button v-if="canResolveAll && alertRows.length" plain @click="handleResolveAll">{{ $t('pv.common.buttons.resolveAll') }}</el-button>
      </div>
      <el-table :data="alertRows" v-loading="loading" class="pv-alert-table">
        <el-table-column :label="$t('pv.common.table.level')" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="tagType(row.level)" effect="dark">{{ levelLabel(row.level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" :label="$t('pv.common.table.content')" min-width="240" show-overflow-tooltip />
        <el-table-column prop="source" :label="$t('pv.common.table.source')" min-width="220" show-overflow-tooltip />
        <el-table-column :label="$t('pv.common.table.occurTime')" width="180" align="center">
          <template #default="{ row }">{{ row.occurTime || '-' }}</template>
        </el-table-column>
        <el-table-column :label="$t('pv.common.table.status')" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'warning' : 'success'" effect="plain">
              {{ $t(row.status === 'active' ? 'pv.common.status.active' : 'pv.common.status.resolved') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('pv.common.table.actions')" width="120" align="center">
          <template #default="{ row }">
            <el-button v-if="canResolve && row.status === 'active'" link type="primary" @click="handleResolve(row)">
              {{ $t('pv.common.buttons.markResolved') }}
            </el-button>
            <span v-else class="pv-section-tip">{{ $t('pv.common.states.readOnly') }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!loading && !alertRows.length" class="pv-empty">{{ $t('pv.dashboard.empty.alerts') }}</div>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { useI18n } from 'vue-i18n'
import auth from '@/plugins/auth'
import { getDashboardSummary, getPowerSeries, simulateDashboard } from '@/api/pv/dashboard'
import { listAlerts, resolveAlert, resolveAllAlerts } from '@/api/pv/alert'
import useSettingsStore from '@/store/modules/settings'
import { getToken } from '@/utils/auth'

const { proxy } = getCurrentInstance()
const { t } = useI18n()
const settingsStore = useSettingsStore()

const loading = ref(false)
const summary = ref({
  totalCapacityMw: 0,
  onlineInverters: 0,
  totalInverters: 0,
  currentPowerKw: 0,
  dailyYieldKwh: 0,
  activeAlerts: 0
})
const powerSeries = ref([])
const alertRows = ref([])
const powerChartRef = ref(null)
const barChartRef = ref(null)
const wsConnected = ref(false)

const canSimulate = computed(() => auth.hasPermi('pv:dashboard:simulate'))
const canResolve = computed(() => auth.hasPermi('pv:alert:resolve'))
const canResolveAll = computed(() => auth.hasPermi('pv:alert:resolveAll'))

let powerChart = null
let barChart = null
let pollTimer = null
let dashboardSocket = null
let reconnectTimer = null
let manualSocketClose = false

async function loadDashboard() {
  loading.value = true
  try {
    const [summaryRes, seriesRes, alertRes] = await Promise.all([
      getDashboardSummary(),
      getPowerSeries(),
      listAlerts({ pageNum: 1, pageSize: 6, status: 'active' })
    ])
    applyDashboardPayload({
      summary: summaryRes.data || {},
      powerSeries: seriesRes.data || [],
      alerts: alertRes.rows || []
    })
    await nextTick()
    renderCharts()
  } finally {
    loading.value = false
  }
}

function applyDashboardPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return
  }
  summary.value = payload.summary || {}
  powerSeries.value = Array.isArray(payload.powerSeries) ? payload.powerSeries : []
  alertRows.value = Array.isArray(payload.alerts) ? payload.alerts : []
}

async function handleSimulate() {
  await simulateDashboard()
  proxy.$modal.msgSuccess(t('pv.dashboard.messages.simulateSuccess'))
  await loadDashboard()
}

async function handleResolve(row) {
  await proxy.$modal.confirm(t('pv.dashboard.messages.resolveConfirm', { content: row.content }))
  await resolveAlert(row.alertId)
  proxy.$modal.msgSuccess(t('pv.dashboard.messages.resolveSuccess'))
  await loadDashboard()
}

async function handleResolveAll() {
  await proxy.$modal.confirm(t('pv.dashboard.messages.resolveAllConfirm'))
  await resolveAllAlerts()
  proxy.$modal.msgSuccess(t('pv.dashboard.messages.resolveAllSuccess'))
  await loadDashboard()
}

function renderCharts() {
  if (!powerChartRef.value || !barChartRef.value) {
    return
  }
  if (!powerChart) {
    powerChart = echarts.init(powerChartRef.value)
  }
  if (!barChart) {
    barChart = echarts.init(barChartRef.value)
  }

  const colors = getChartColors()
  const labels = powerSeries.value.map(item => (item.hour || '').slice(11, 16))
  const values = powerSeries.value.map(item => Number(item.avgPowerKw || 0))

  powerChart.setOption({
    animationDuration: 500,
    grid: { left: 28, right: 10, top: 24, bottom: 24, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: colors.axis } },
      axisLabel: { color: colors.label }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: colors.split } },
      axisLine: { show: false },
      axisLabel: { color: colors.label }
    },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: colors.accent },
        lineStyle: { width: 3, color: colors.accent },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: colors.areaTop },
            { offset: 1, color: colors.areaBottom }
          ])
        }
      }
    ]
  })

  barChart.setOption({
    animationDuration: 500,
    grid: { left: 24, right: 10, top: 24, bottom: 24, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: colors.axis } },
      axisLabel: { color: colors.label }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: colors.split } },
      axisLabel: { color: colors.label }
    },
    series: [
      {
        type: 'bar',
        data: values,
        barMaxWidth: 20,
        itemStyle: {
          borderRadius: [10, 10, 0, 0],
          color: colors.accent
        }
      }
    ]
  })
}

function getChartColors() {
  const styles = getComputedStyle(document.documentElement)
  return {
    accent: styles.getPropertyValue('--pv-accent').trim() || '#f97316',
    areaTop: 'rgba(249, 115, 22, 0.32)',
    areaBottom: 'rgba(249, 115, 22, 0.02)',
    label: styles.getPropertyValue('--pv-text-muted').trim() || '#6b7280',
    axis: styles.getPropertyValue('--pv-border-strong').trim() || 'rgba(249, 115, 22, 0.24)',
    split: styles.getPropertyValue('--pv-border').trim() || 'rgba(255,255,255,0.08)'
  }
}

function levelLabel(level) {
  const levelKey = {
    critical: 'pv.common.level.critical',
    warning: 'pv.common.level.warning',
    info: 'pv.common.level.info'
  }[level]
  return levelKey ? t(levelKey) : level
}

function tagType(level) {
  return {
    critical: 'danger',
    warning: 'warning',
    info: 'info'
  }[level] || 'info'
}

function formatNumber(value) {
  return Number(value || 0).toFixed(2)
}

function handleResize() {
  powerChart?.resize()
  barChart?.resize()
}

function startPolling() {
  if (!pollTimer) {
    pollTimer = window.setInterval(loadDashboard, 60 * 1000)
  }
}

function stopPolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    window.clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function buildDashboardSocketUrl() {
  const token = getToken()
  if (!token) {
    return null
  }

  const baseApi = import.meta.env.VITE_APP_BASE_API || ''
  if (/^https?:\/\//.test(baseApi)) {
    const url = new URL(baseApi)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = `${url.pathname.replace(/\/$/, '')}/ws/pv/dashboard`
    url.searchParams.set('token', token)
    return url.toString()
  }

  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const normalizedBase = baseApi
    ? `${baseApi.startsWith('/') ? baseApi : `/${baseApi}`}`.replace(/\/$/, '')
    : ''
  return `${wsProtocol}//${window.location.host}${normalizedBase}/ws/pv/dashboard?token=${encodeURIComponent(token)}`
}

function scheduleSocketReconnect() {
  if (manualSocketClose || reconnectTimer) {
    return
  }
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null
    connectDashboardSocket()
  }, 5000)
}

function connectDashboardSocket() {
  const socketUrl = buildDashboardSocketUrl()
  if (!socketUrl) {
    startPolling()
    return
  }

  clearReconnectTimer()
  dashboardSocket = new WebSocket(socketUrl)
  dashboardSocket.onopen = () => {
    wsConnected.value = true
    stopPolling()
  }
  dashboardSocket.onmessage = async (event) => {
    try {
      applyDashboardPayload(JSON.parse(event.data))
      await nextTick()
      renderCharts()
    } catch (error) {
      console.warn('PV dashboard websocket message parse failed', error)
    }
  }
  dashboardSocket.onerror = () => {
    wsConnected.value = false
  }
  dashboardSocket.onclose = () => {
    dashboardSocket = null
    wsConnected.value = false
    startPolling()
    if (!manualSocketClose) {
      loadDashboard()
      scheduleSocketReconnect()
    }
  }
}

function closeDashboardSocket() {
  clearReconnectTimer()
  if (dashboardSocket) {
    dashboardSocket.close()
    dashboardSocket = null
  }
  wsConnected.value = false
}

watch(() => settingsStore.isDark, () => nextTick(() => renderCharts()))

onMounted(async () => {
  await loadDashboard()
  startPolling()
  connectDashboardSocket()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  manualSocketClose = true
  stopPolling()
  closeDashboardSocket()
  window.removeEventListener('resize', handleResize)
  powerChart?.dispose()
  barChart?.dispose()
})
</script>
