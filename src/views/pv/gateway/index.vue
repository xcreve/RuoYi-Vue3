<template>
  <div class="app-container pv-page">
    <div>
      <h1 class="pv-page-title">{{ $t('pv.gateway.title') }}</h1>
      <p class="pv-page-subtitle">{{ $t('pv.gateway.subtitle') }}</p>
    </div>

    <div class="pv-toolbar">
      <div class="pv-toolbar-grid">
        <div class="pv-toolbar-left">
          <el-input v-model="queryParams.gatewayName" :placeholder="$t('pv.gateway.query.gatewayName')" clearable style="width: 220px" @keyup.enter="handleQuery">
            <template #prefix><svg-icon icon-class="search" /></template>
          </el-input>
          <el-input v-model="queryParams.serialNumber" :placeholder="$t('pv.gateway.query.serialNumber')" clearable style="width: 220px" @keyup.enter="handleQuery" />
          <el-select v-model="queryParams.stationId" :placeholder="$t('pv.gateway.query.station')" clearable style="width: 180px" @change="handleQuery">
            <el-option v-for="item in stationOptions" :key="item.stationId" :label="item.stationName" :value="item.stationId" />
          </el-select>
        </div>
        <div class="pv-toolbar-right">
          <el-button @click="resetQuery">{{ $t('pv.common.buttons.reset') }}</el-button>
          <el-button v-if="canAdd" type="primary" @click="handleAdd">{{ $t('pv.gateway.buttons.add') }}</el-button>
        </div>
      </div>
    </div>

    <div class="pv-table-card">
      <el-table v-loading="loading" :data="gatewayList">
        <el-table-column :label="$t('pv.common.table.status')" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="dark">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="gatewayName" :label="$t('pv.gateway.table.gatewayName')" min-width="180" />
        <el-table-column prop="gatewayType" :label="$t('pv.gateway.table.type')" width="140" align="center" />
        <el-table-column prop="stationName" :label="$t('pv.gateway.table.station')" min-width="180" show-overflow-tooltip />
        <el-table-column prop="serialNumber" :label="$t('pv.gateway.table.serialNumber')" min-width="180" />
        <el-table-column prop="communicationType" :label="$t('pv.gateway.table.communicationType')" width="120" align="center" />
        <el-table-column prop="protocol" :label="$t('pv.gateway.table.protocol')" width="120" align="center" />
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

    <el-dialog v-model="open" :title="form.gatewayId ? $t('pv.gateway.dialog.editTitle') : $t('pv.gateway.dialog.addTitle')" width="680px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <div class="pv-detail-grid">
          <el-form-item :label="$t('pv.gateway.form.gatewayName')" prop="gatewayName">
            <el-input v-model="form.gatewayName" :placeholder="$t('pv.gateway.form.gatewayNamePlaceholder')" />
          </el-form-item>
          <el-form-item :label="$t('pv.gateway.form.gatewayType')" prop="gatewayType">
            <el-select v-model="form.gatewayType" :placeholder="$t('pv.gateway.form.gatewayTypePlaceholder')" style="width: 100%">
              <el-option label="DTU" value="DTU" />
              <el-option label="EdgeGateway" value="EdgeGateway" />
              <el-option label="SmartDongle" value="SmartDongle" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('pv.gateway.form.station')" prop="stationId">
            <el-select v-model="form.stationId" :placeholder="$t('pv.gateway.form.stationPlaceholder')" style="width: 100%">
              <el-option v-for="item in stationOptions" :key="item.stationId" :label="item.stationName" :value="item.stationId" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('pv.gateway.form.serialNumber')" prop="serialNumber">
            <el-input v-model="form.serialNumber" :placeholder="$t('pv.gateway.form.serialNumberPlaceholder')" />
          </el-form-item>
          <el-form-item :label="$t('pv.gateway.form.communicationType')" prop="communicationType">
            <el-select v-model="form.communicationType" :placeholder="$t('pv.gateway.form.communicationTypePlaceholder')" style="width: 100%" @change="handleCommunicationTypeChange">
              <el-option label="MQTT" value="MQTT" />
              <el-option label="Polling" value="Polling" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('pv.gateway.form.protocol')">
            <el-select v-model="form.protocol" :placeholder="$t('pv.gateway.form.protocolPlaceholder')" style="width: 100%" @change="handleProtocolChange">
              <el-option label="ModbusTCP" value="ModbusTCP" />
              <el-option label="ModbusRTU" value="ModbusRTU" />
              <el-option label="IEC60870" value="IEC60870" />
            </el-select>
          </el-form-item>
          <el-form-item :label="addressLabel">
            <el-input v-model="form.brokerUrl" :placeholder="addressPlaceholder" />
          </el-form-item>
          <el-form-item :label="mappingLabel">
            <el-input v-model="form.topic" :placeholder="mappingPlaceholder" />
          </el-form-item>
          <el-form-item :label="$t('pv.gateway.form.pollingInterval')">
            <el-input-number v-model="form.pollingIntervalSec" :min="10" :step="10" style="width: 100%" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="open = false">{{ $t('pv.common.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="submitForm">{{ $t('pv.common.buttons.save') }}</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailOpen" :title="$t('pv.gateway.drawer.title')" size="420px">
      <div v-if="currentRow" class="pv-detail-grid">
        <div class="pv-detail-item">
          <div class="pv-detail-label">{{ $t('pv.gateway.detail.gatewayName') }}</div>
          <div class="pv-detail-value">{{ currentRow.gatewayName }}</div>
        </div>
        <div class="pv-detail-item">
          <div class="pv-detail-label">{{ $t('pv.gateway.detail.station') }}</div>
          <div class="pv-detail-value">{{ currentRow.stationName || '-' }}</div>
        </div>
        <div class="pv-detail-item">
          <div class="pv-detail-label">{{ $t('pv.gateway.detail.serialNumber') }}</div>
          <div class="pv-detail-value">{{ currentRow.serialNumber }}</div>
        </div>
        <div class="pv-detail-item">
          <div class="pv-detail-label">{{ $t('pv.gateway.detail.communicationType') }}</div>
          <div class="pv-detail-value">{{ currentRow.communicationType }}</div>
        </div>
        <div class="pv-detail-item">
          <div class="pv-detail-label">{{ $t('pv.gateway.detail.protocol') }}</div>
          <div class="pv-detail-value">{{ currentRow.protocol || '-' }}</div>
        </div>
        <div class="pv-detail-item">
          <div class="pv-detail-label">{{ $t('pv.common.table.lastSeen') }}</div>
          <div class="pv-detail-value">{{ currentRow.lastSeen || '-' }}</div>
        </div>
        <div class="pv-detail-item">
          <div class="pv-detail-label">{{ $t('pv.gateway.detail.address') }}</div>
          <div class="pv-detail-value">{{ currentRow.brokerUrl || '-' }}</div>
        </div>
        <div class="pv-detail-item">
          <div class="pv-detail-label">{{ $t('pv.gateway.detail.mapping') }}</div>
          <div class="pv-detail-value">{{ currentRow.topic || '-' }}</div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import auth from '@/plugins/auth'
import { useI18n } from 'vue-i18n'
import { listGateway, addGateway, updateGateway, delGateway } from '@/api/pv/gateway'
import { listStation } from '@/api/pv/station'

const { proxy } = getCurrentInstance()
const { t } = useI18n()

const loading = ref(false)
const open = ref(false)
const detailOpen = ref(false)
const total = ref(0)
const gatewayList = ref([])
const stationOptions = ref([])
const currentRow = ref(null)
const formRef = ref(null)
const DEFAULT_MQTT_BROKER_URL = 'mqtt://broker.myems.local'
const DEFAULT_MODBUS_PROFILE = 'power=0:2:0.1;dailyYield=2:2:0.1;totalYield=4:2:0.1;voltage=6:1:0.1;current=7:1:0.01'

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  gatewayName: '',
  serialNumber: '',
  stationId: null
})

const form = reactive({
  gatewayId: null,
  gatewayName: '',
  gatewayType: 'DTU',
  stationId: null,
  serialNumber: '',
  communicationType: 'MQTT',
  protocol: 'ModbusTCP',
  brokerUrl: DEFAULT_MQTT_BROKER_URL,
  topic: '',
  pollingIntervalSec: 60
})

const rules = {
  gatewayName: [{ required: true, message: t('pv.gateway.validation.gatewayName'), trigger: 'blur' }],
  gatewayType: [{ required: true, message: t('pv.gateway.validation.gatewayType'), trigger: 'change' }],
  stationId: [{ required: true, message: t('pv.gateway.validation.station'), trigger: 'change' }],
  serialNumber: [{ required: true, message: t('pv.gateway.validation.serialNumber'), trigger: 'blur' }],
  communicationType: [{ required: true, message: t('pv.gateway.validation.communicationType'), trigger: 'change' }]
}

const canAdd = computed(() => auth.hasPermi('pv:gateway:add'))
const canEdit = computed(() => auth.hasPermi('pv:gateway:edit'))
const canRemove = computed(() => auth.hasPermi('pv:gateway:remove'))
const canView = computed(() => auth.hasPermi('pv:gateway:view'))
const isModbusTcpPolling = computed(() => form.communicationType === 'Polling' && form.protocol === 'ModbusTCP')
const addressLabel = computed(() => (isModbusTcpPolling.value ? t('pv.gateway.form.collectAddress') : t('pv.gateway.form.brokerUrl')))
const mappingLabel = computed(() => (isModbusTcpPolling.value ? t('pv.gateway.form.registerMapping') : t('pv.gateway.form.topic')))
const addressPlaceholder = computed(() =>
  isModbusTcpPolling.value ? t('pv.gateway.form.collectAddressPlaceholder') : t('pv.gateway.form.brokerUrlPlaceholder')
)
const mappingPlaceholder = computed(() =>
  isModbusTcpPolling.value ? t('pv.gateway.form.registerMappingPlaceholder') : t('pv.gateway.form.topicPlaceholder')
)

let pollTimer = null

async function getList() {
  loading.value = true
  try {
    const res = await listGateway(queryParams)
    gatewayList.value = res.rows || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

async function loadStations() {
  const res = await listStation({ pageNum: 1, pageSize: 200 })
  stationOptions.value = res.rows || []
}

function resetForm() {
  form.gatewayId = null
  form.gatewayName = ''
  form.gatewayType = 'DTU'
  form.stationId = null
  form.serialNumber = ''
  form.communicationType = 'MQTT'
  form.protocol = 'ModbusTCP'
  form.brokerUrl = DEFAULT_MQTT_BROKER_URL
  form.topic = ''
  form.pollingIntervalSec = 60
}

function handleCommunicationTypeChange(value) {
  if (value === 'Polling') {
    if (form.brokerUrl === DEFAULT_MQTT_BROKER_URL) {
      form.brokerUrl = ''
    }
    if (!form.topic) {
      form.topic = DEFAULT_MODBUS_PROFILE
    }
    return
  }
  if (!form.brokerUrl) {
    form.brokerUrl = DEFAULT_MQTT_BROKER_URL
  }
  if (form.topic === DEFAULT_MODBUS_PROFILE) {
    form.topic = ''
  }
}

function handleProtocolChange(value) {
  if (form.communicationType !== 'Polling') {
    return
  }
  if (value === 'ModbusTCP') {
    if (form.brokerUrl === DEFAULT_MQTT_BROKER_URL) {
      form.brokerUrl = ''
    }
    if (!form.topic) {
      form.topic = DEFAULT_MODBUS_PROFILE
    }
  }
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  queryParams.gatewayName = ''
  queryParams.serialNumber = ''
  queryParams.stationId = null
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
  await proxy.$modal.confirm(t('pv.gateway.messages.deleteConfirm', { name: row.gatewayName }))
  await delGateway(row.gatewayId)
  proxy.$modal.msgSuccess(t('pv.common.messages.deleteSuccess'))
  await getList()
}

function submitForm() {
  formRef.value.validate(async valid => {
    if (!valid) {
      return
    }
    if (form.gatewayId) {
      await updateGateway(form)
      proxy.$modal.msgSuccess(t('pv.common.messages.updateSuccess'))
    } else {
      await addGateway(form)
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

onMounted(async () => {
  await Promise.all([loadStations(), getList()])
  pollTimer = window.setInterval(getList, 60 * 1000)
})

onBeforeUnmount(() => {
  if (pollTimer) {
    window.clearInterval(pollTimer)
  }
})
</script>
