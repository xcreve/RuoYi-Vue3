<template>
  <div class="app-container pv-page">
    <div>
      <h1 class="pv-page-title">{{ $t('pv.analysis.title') }}</h1>
      <p class="pv-page-subtitle">{{ $t('pv.analysis.subtitle') }}</p>
    </div>

    <div class="pv-toolbar">
      <div class="pv-toolbar-grid">
        <div class="pv-toolbar-left">
          <el-input v-model="searchText" :placeholder="$t('pv.analysis.query.searchStation')" clearable style="width: 240px" />
          <el-select v-model="queryParams.tagId" :placeholder="$t('pv.analysis.query.allTags')" clearable style="width: 180px" @change="handleQuery">
            <el-option v-for="item in tagOptions" :key="item.tagId" :label="item.tagName" :value="item.tagId" />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            :range-separator="$t('pv.analysis.query.rangeSeparator')"
            :start-placeholder="$t('pv.analysis.query.startDate')"
            :end-placeholder="$t('pv.analysis.query.endDate')"
            @change="handleDateChange"
          />
        </div>
        <div class="pv-toolbar-right">
          <el-button @click="setQuickDate('month')">{{ $t('pv.analysis.query.month') }}</el-button>
          <el-button @click="setQuickDate('year')">{{ $t('pv.analysis.query.year') }}</el-button>
          <el-button type="primary" plain @click="handleExport">{{ $t('pv.common.buttons.exportExcel') }}</el-button>
        </div>
      </div>
    </div>

    <div class="pv-table-card">
      <div class="pv-section-head">
        <div>
          <h3 class="pv-section-title">{{ $t('pv.analysis.section.title') }}</h3>
          <div class="pv-section-tip">{{ $t('pv.analysis.section.tip') }}</div>
        </div>
        <span class="pv-chip">{{ $t('pv.analysis.currentRows', { count: filteredRows.length }) }}</span>
      </div>

      <el-table :data="filteredRows" v-loading="loading" border stripe>
        <el-table-column prop="stationName" :label="$t('pv.analysis.table.stationName')" width="220" fixed="left" />
        <el-table-column prop="tagName" :label="$t('pv.analysis.table.tag')" width="140" />
        <el-table-column v-for="hour in 24" :key="hour - 1" :prop="`h${hour - 1}`" :label="$t('pv.analysis.table.hour', { hour: hour - 1 })" width="88" align="center" />
        <el-table-column prop="total" :label="$t('pv.analysis.table.total')" width="110" align="center" fixed="right" />
      </el-table>
      <div v-if="!loading && !filteredRows.length" class="pv-empty">{{ $t('pv.analysis.empty.noData') }}</div>
    </div>
  </div>
</template>

<script setup>
import { getHourlyYield, exportHourlyYield } from '@/api/pv/analysis'
import { listStationTag } from '@/api/pv/catalog'

const loading = ref(false)
const searchText = ref('')
const dateRange = ref([])
const rows = ref([])
const tagOptions = ref([])
const queryParams = reactive({
  startDate: '',
  endDate: '',
  tagId: null
})

const filteredRows = computed(() => {
  if (!searchText.value) {
    return rows.value
  }
  const keyword = searchText.value.toLowerCase()
  return rows.value.filter(item => (item.stationName || '').toLowerCase().includes(keyword))
})

async function loadTags() {
  const res = await listStationTag({ pageNum: 1, pageSize: 200 })
  tagOptions.value = res.rows || []
}

async function getList() {
  loading.value = true
  try {
    const res = await getHourlyYield(queryParams)
    rows.value = res.data || []
  } finally {
    loading.value = false
  }
}

function handleDateChange(value) {
  if (value && value.length === 2) {
    queryParams.startDate = value[0]
    queryParams.endDate = value[1]
  } else {
    queryParams.startDate = ''
    queryParams.endDate = ''
  }
  getList()
}

function handleQuery() {
  getList()
}

function setQuickDate(type) {
  const now = new Date()
  if (type === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    dateRange.value = [formatDate(start), formatDate(end)]
  } else {
    const start = new Date(now.getFullYear(), 0, 1)
    const end = new Date(now.getFullYear(), 11, 31)
    dateRange.value = [formatDate(start), formatDate(end)]
  }
  handleDateChange(dateRange.value)
}

function handleExport() {
  exportHourlyYield(queryParams)
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

onMounted(async () => {
  const today = formatDate(new Date())
  dateRange.value = [today, today]
  queryParams.startDate = today
  queryParams.endDate = today
  await Promise.all([loadTags(), getList()])
})
</script>
