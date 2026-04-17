<template>
  <div class="app-container pv-page">
    <div>
      <h1 class="pv-page-title">{{ $t('pv.alert.title') }}</h1>
      <p class="pv-page-subtitle">{{ $t('pv.alert.subtitle') }}</p>
    </div>

    <div class="pv-toolbar">
      <div class="pv-toolbar-grid">
        <div class="pv-toolbar-left">
          <el-input v-model="queryParams.content" :placeholder="$t('pv.alert.query.searchPlaceholder')" clearable style="width: 280px" @keyup.enter="handleQuery">
            <template #prefix><svg-icon icon-class="search" /></template>
          </el-input>
          <el-select v-model="queryParams.level" :placeholder="$t('pv.alert.query.levelPlaceholder')" clearable style="width: 140px" @change="handleQuery">
            <el-option :label="$t('pv.common.level.critical')" value="critical" />
            <el-option :label="$t('pv.common.level.warning')" value="warning" />
            <el-option :label="$t('pv.common.level.info')" value="info" />
          </el-select>
          <el-select v-model="queryParams.status" :placeholder="$t('pv.alert.query.statusPlaceholder')" clearable style="width: 140px" @change="handleQuery">
            <el-option :label="$t('pv.common.status.active')" value="active" />
            <el-option :label="$t('pv.common.status.resolved')" value="resolved" />
          </el-select>
        </div>
        <div class="pv-toolbar-right">
          <el-button @click="resetQuery">{{ $t('pv.common.buttons.reset') }}</el-button>
          <el-button v-if="canResolveAll" plain @click="handleResolveAll">{{ $t('pv.common.buttons.resolveAll') }}</el-button>
        </div>
      </div>
    </div>

    <div class="pv-table-card">
      <el-table v-loading="loading" :data="alertList">
        <el-table-column :label="$t('pv.common.table.level')" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="tagType(row.level)" effect="dark">{{ levelLabel(row.level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" :label="$t('pv.common.table.content')" min-width="260" show-overflow-tooltip />
        <el-table-column prop="source" :label="$t('pv.common.table.source')" min-width="220" show-overflow-tooltip />
        <el-table-column :label="$t('pv.common.table.occurTime')" width="180" align="center">
          <template #default="{ row }">{{ row.occurTime || '-' }}</template>
        </el-table-column>
        <el-table-column :label="$t('pv.common.table.status')" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'warning' : 'success'" effect="plain">
              {{ $t(row.status === 'active' ? 'pv.common.status.active' : 'pv.common.status.resolved') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('pv.alert.columns.processingInfo')" min-width="200" align="center">
          <template #default="{ row }">
            <div v-if="row.status === 'resolved'" class="resolved-meta">
              <span>{{ row.resolvedBy || '-' }}</span>
              <span>{{ row.resolvedAt || '-' }}</span>
            </div>
            <span v-else class="pv-section-tip">{{ $t('pv.common.states.pending') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('pv.common.table.actions')" width="130" align="center">
          <template #default="{ row }">
            <el-button v-if="canResolve && row.status === 'active'" link type="primary" @click="handleResolve(row)">{{ $t('pv.common.buttons.markResolved') }}</el-button>
            <span v-else class="pv-section-tip">{{ $t('pv.common.states.readOnly') }}</span>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </div>
  </div>
</template>

<script setup>
import auth from '@/plugins/auth'
import { useI18n } from 'vue-i18n'
import { listAlerts, resolveAlert, resolveAllAlerts } from '@/api/pv/alert'

const { proxy } = getCurrentInstance()
const { t } = useI18n()

const loading = ref(false)
const total = ref(0)
const alertList = ref([])
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  content: '',
  source: '',
  level: '',
  status: ''
})

const canResolve = computed(() => auth.hasPermi('pv:alert:resolve'))
const canResolveAll = computed(() => auth.hasPermi('pv:alert:resolveAll'))

let pollTimer = null

async function getList() {
  loading.value = true
  try {
    const res = await listAlerts(queryParams)
    alertList.value = res.rows || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  queryParams.content = ''
  queryParams.source = ''
  queryParams.level = ''
  queryParams.status = ''
  handleQuery()
}

async function handleResolve(row) {
  await proxy.$modal.confirm(t('pv.alert.messages.resolveConfirm', { content: row.content }))
  await resolveAlert(row.alertId)
  proxy.$modal.msgSuccess(t('pv.alert.messages.resolveSuccess'))
  await getList()
}

async function handleResolveAll() {
  await proxy.$modal.confirm(t('pv.alert.messages.resolveAllConfirm'))
  await resolveAllAlerts()
  proxy.$modal.msgSuccess(t('pv.alert.messages.resolveAllSuccess'))
  await getList()
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

onMounted(async () => {
  await getList()
  pollTimer = window.setInterval(getList, 60 * 1000)
})

onBeforeUnmount(() => {
  if (pollTimer) {
    window.clearInterval(pollTimer)
  }
})
</script>

<style lang="scss" scoped>
.resolved-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--pv-text-soft);
  font-size: 12px;
}
</style>
