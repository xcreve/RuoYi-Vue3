<template>
  <div class="app-container pv-page">
    <div>
      <h1 class="pv-page-title">{{ $t('pv.inverter.title') }}</h1>
      <p class="pv-page-subtitle">{{ $t('pv.inverter.subtitle') }}</p>
    </div>

    <div class="pv-toolbar">
      <div class="pv-toolbar-grid">
        <div class="pv-toolbar-left">
          <el-input v-model="queryParams.serialNumber" :placeholder="$t('pv.inverter.query.serialNumber')" clearable style="width: 220px" @keyup.enter="handleQuery">
            <template #prefix><svg-icon icon-class="search" /></template>
          </el-input>
          <el-input v-model="queryParams.inverterNumber" :placeholder="$t('pv.inverter.query.inverterNumber')" clearable style="width: 180px" @keyup.enter="handleQuery" />
          <el-select v-model="queryParams.gatewayId" :placeholder="$t('pv.inverter.query.gateway')" clearable style="width: 180px" @change="handleQuery">
            <el-option v-for="item in gatewayOptions" :key="item.gatewayId" :label="item.gatewayName" :value="item.gatewayId" />
          </el-select>
        </div>
        <div class="pv-toolbar-right">
          <el-button @click="resetQuery">{{ $t('pv.common.buttons.reset') }}</el-button>
          <el-button v-if="canAdd" type="primary" @click="handleAdd">{{ $t('pv.inverter.buttons.add') }}</el-button>
        </div>
      </div>
    </div>

    <div class="pv-table-card">
      <el-table v-loading="loading" :data="inverterList">
        <el-table-column :label="$t('pv.common.table.status')" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="dark">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inverterNumber" :label="$t('pv.inverter.table.number')" width="120" align="center" />
        <el-table-column prop="serialNumber" :label="$t('pv.inverter.table.serialNumber')" min-width="180" />
        <el-table-column :label="$t('pv.inverter.table.brandModel')" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ [row.brand, row.modelName].filter(Boolean).join(' / ') || '-' }}</template>
        </el-table-column>
        <el-table-column prop="gatewayName" :label="$t('pv.inverter.table.gateway')" min-width="180" show-overflow-tooltip />
        <el-table-column :label="$t('pv.inverter.table.currentPower')" width="130" align="center">
          <template #default="{ row }">{{ formatNumber(row.currentPower) }}</template>
        </el-table-column>
        <el-table-column :label="$t('pv.inverter.table.dailyYield')" width="150" align="center">
          <template #default="{ row }">{{ formatNumber(row.dailyYield) }}</template>
        </el-table-column>
        <el-table-column prop="lastSeen" :label="$t('pv.common.table.lastSeen')" width="180" align="center" />
        <el-table-column :label="$t('pv.common.table.actions')" width="220" align="center">
          <template #default="{ row }">
            <el-button v-if="canView" link type="primary" @click="handleView(row)">{{ $t('pv.common.buttons.detail') }}</el-button>
            <el-button v-if="canEdit" link type="primary" @click="handleEdit(row)">{{ $t('pv.common.buttons.edit') }}</el-button>
            <el-button v-if="canRemove" link type="danger" @click="handleDelete(row)">{{ $t('pv.common.buttons.delete') }}</el-button>
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

    <el-dialog v-model="open" :title="form.inverterId ? $t('pv.inverter.dialog.editTitle') : $t('pv.inverter.dialog.addTitle')" width="620px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item :label="$t('pv.inverter.form.gateway')" prop="gatewayId">
          <el-select v-model="form.gatewayId" :placeholder="$t('pv.inverter.form.gatewayPlaceholder')" style="width: 100%">
            <el-option v-for="item in gatewayOptions" :key="item.gatewayId" :label="item.gatewayName" :value="item.gatewayId" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('pv.inverter.form.model')" prop="modelId">
          <el-select v-model="form.modelId" :placeholder="$t('pv.inverter.form.modelPlaceholder')" style="width: 100%">
            <el-option v-for="item in modelOptions" :key="item.modelId" :label="`${item.brand} / ${item.modelName}`" :value="item.modelId" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('pv.inverter.form.inverterNumber')">
          <el-input v-model="form.inverterNumber" :placeholder="$t('pv.inverter.form.inverterNumberPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('pv.inverter.form.serialNumber')" prop="serialNumber">
          <el-input v-model="form.serialNumber" :placeholder="$t('pv.inverter.form.serialNumberPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="open = false">{{ $t('pv.common.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="submitForm">{{ $t('pv.common.buttons.save') }}</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailOpen" :title="$t('pv.inverter.drawer.title')" size="420px">
      <div v-if="currentRow" class="pv-detail-grid">
        <div class="pv-detail-item">
          <div class="pv-detail-label">{{ $t('pv.inverter.detail.inverterNumber') }}</div>
          <div class="pv-detail-value">{{ currentRow.inverterNumber || '-' }}</div>
        </div>
        <div class="pv-detail-item">
          <div class="pv-detail-label">{{ $t('pv.inverter.detail.serialNumber') }}</div>
          <div class="pv-detail-value">{{ currentRow.serialNumber }}</div>
        </div>
        <div class="pv-detail-item">
          <div class="pv-detail-label">{{ $t('pv.inverter.detail.brand') }}</div>
          <div class="pv-detail-value">{{ currentRow.brand || '-' }}</div>
        </div>
        <div class="pv-detail-item">
          <div class="pv-detail-label">{{ $t('pv.inverter.detail.model') }}</div>
          <div class="pv-detail-value">{{ currentRow.modelName || '-' }}</div>
        </div>
        <div class="pv-detail-item">
          <div class="pv-detail-label">{{ $t('pv.inverter.detail.gateway') }}</div>
          <div class="pv-detail-value">{{ currentRow.gatewayName || '-' }}</div>
        </div>
        <div class="pv-detail-item">
          <div class="pv-detail-label">{{ $t('pv.common.table.status') }}</div>
          <div class="pv-detail-value">{{ statusLabel(currentRow.status) }}</div>
        </div>
        <div class="pv-detail-item">
          <div class="pv-detail-label">{{ $t('pv.inverter.detail.currentPower') }}</div>
          <div class="pv-detail-value">{{ formatNumber(currentRow.currentPower) }} kW</div>
        </div>
        <div class="pv-detail-item">
          <div class="pv-detail-label">{{ $t('pv.inverter.detail.dailyYield') }}</div>
          <div class="pv-detail-value">{{ formatNumber(currentRow.dailyYield) }} kWh</div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import auth from '@/plugins/auth'
import { useI18n } from 'vue-i18n'
import { listInverter, addInverter, updateInverter, delInverter } from '@/api/pv/inverter'
import { listGateway } from '@/api/pv/gateway'
import { listModel } from '@/api/pv/catalog'

const { proxy } = getCurrentInstance()
const { t } = useI18n()

const loading = ref(false)
const open = ref(false)
const detailOpen = ref(false)
const total = ref(0)
const inverterList = ref([])
const gatewayOptions = ref([])
const modelOptions = ref([])
const currentRow = ref(null)
const formRef = ref(null)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  serialNumber: '',
  inverterNumber: '',
  gatewayId: null
})

const form = reactive({
  inverterId: null,
  gatewayId: null,
  modelId: null,
  inverterNumber: '',
  serialNumber: ''
})

const rules = {
  gatewayId: [{ required: true, message: t('pv.inverter.validation.gateway'), trigger: 'change' }],
  modelId: [{ required: true, message: t('pv.inverter.validation.model'), trigger: 'change' }],
  serialNumber: [{ required: true, message: t('pv.inverter.validation.serialNumber'), trigger: 'blur' }]
}

const canAdd = computed(() => auth.hasPermi('pv:inverter:add'))
const canEdit = computed(() => auth.hasPermi('pv:inverter:edit'))
const canRemove = computed(() => auth.hasPermi('pv:inverter:remove'))
const canView = computed(() => auth.hasPermi('pv:inverter:view'))

let pollTimer = null

async function getList() {
  loading.value = true
  try {
    const res = await listInverter(queryParams)
    inverterList.value = res.rows || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

async function loadGatewayOptions() {
  const res = await listGateway({ pageNum: 1, pageSize: 200 })
  gatewayOptions.value = res.rows || []
}

async function loadModelOptions() {
  const res = await listModel({ pageNum: 1, pageSize: 200 })
  modelOptions.value = res.rows || []
}

function resetForm() {
  form.inverterId = null
  form.gatewayId = null
  form.modelId = null
  form.inverterNumber = ''
  form.serialNumber = ''
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  queryParams.serialNumber = ''
  queryParams.inverterNumber = ''
  queryParams.gatewayId = null
  handleQuery()
}

function handleAdd() {
  resetForm()
  open.value = true
}

function handleEdit(row) {
  resetForm()
  Object.assign(form, row)
  open.value = true
}

function handleView(row) {
  currentRow.value = row
  detailOpen.value = true
}

async function handleDelete(row) {
  await proxy.$modal.confirm(t('pv.inverter.messages.deleteConfirm', { serialNumber: row.serialNumber }))
  await delInverter(row.inverterId)
  proxy.$modal.msgSuccess(t('pv.common.messages.deleteSuccess'))
  await getList()
}

function submitForm() {
  formRef.value.validate(async valid => {
    if (!valid) {
      return
    }
    if (form.inverterId) {
      await updateInverter(form)
      proxy.$modal.msgSuccess(t('pv.common.messages.updateSuccess'))
    } else {
      await addInverter(form)
      proxy.$modal.msgSuccess(t('pv.common.messages.createSuccess'))
    }
    open.value = false
    getList()
  })
}

function statusLabel(status) {
  const statusKey = {
    online: 'pv.common.status.online',
    offline: 'pv.common.status.offline',
    fault: 'pv.common.status.fault'
  }[status]
  return statusKey ? t(statusKey) : status
}

function statusType(status) {
  return {
    online: 'success',
    offline: 'info',
    fault: 'danger'
  }[status] || 'info'
}

function formatNumber(value) {
  return Number(value || 0).toFixed(2)
}

onMounted(async () => {
  await Promise.all([loadGatewayOptions(), loadModelOptions(), getList()])
  pollTimer = window.setInterval(getList, 60 * 1000)
})

onBeforeUnmount(() => {
  if (pollTimer) {
    window.clearInterval(pollTimer)
  }
})
</script>
