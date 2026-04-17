<template>
  <div class="app-container pv-page">
    <div>
      <h1 class="pv-page-title">{{ $t('pv.station.title') }}</h1>
      <p class="pv-page-subtitle">{{ $t('pv.station.subtitle') }}</p>
    </div>

    <div class="pv-toolbar">
      <div class="pv-toolbar-grid">
        <div class="pv-toolbar-left">
          <el-input v-model="queryParams.stationName" :placeholder="$t('pv.station.query.stationName')" clearable style="width: 240px" @keyup.enter="handleQuery">
            <template #prefix><svg-icon icon-class="search" /></template>
          </el-input>
          <el-select v-model="queryParams.tagId" :placeholder="$t('pv.station.query.allTags')" clearable style="width: 180px" @change="handleQuery">
            <el-option v-for="item in tagOptions" :key="item.tagId" :label="item.tagName" :value="item.tagId" />
          </el-select>
        </div>
        <div class="pv-toolbar-right">
          <el-button @click="resetQuery">{{ $t('pv.common.buttons.reset') }}</el-button>
          <el-button v-if="canAdd" type="primary" @click="handleAdd">{{ $t('pv.station.buttons.add') }}</el-button>
        </div>
      </div>
    </div>

    <div class="pv-table-card">
      <el-table v-loading="loading" :data="stationList">
        <el-table-column prop="stationName" :label="$t('pv.station.table.stationName')" min-width="220" />
        <el-table-column prop="location" :label="$t('pv.station.table.location')" min-width="240" show-overflow-tooltip />
        <el-table-column prop="tagName" :label="$t('pv.station.table.tag')" width="160" align="center" />
        <el-table-column :label="$t('pv.station.table.capacity')" width="140" align="center">
          <template #default="{ row }">{{ formatNumber(row.capacityMw) }}</template>
        </el-table-column>
        <el-table-column prop="createTime" :label="$t('pv.common.table.createTime')" width="180" align="center" />
        <el-table-column :label="$t('pv.common.table.actions')" width="160" align="center">
          <template #default="{ row }">
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

    <el-dialog v-model="open" :title="form.stationId ? $t('pv.station.dialog.editTitle') : $t('pv.station.dialog.addTitle')" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item :label="$t('pv.station.form.stationName')" prop="stationName">
          <el-input v-model="form.stationName" :placeholder="$t('pv.station.form.stationNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('pv.station.form.location')">
          <el-input v-model="form.location" :placeholder="$t('pv.station.form.locationPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('pv.station.form.tag')">
          <el-select v-model="form.tagId" :placeholder="$t('pv.station.form.tagPlaceholder')" clearable style="width: 100%">
            <el-option v-for="item in tagOptions" :key="item.tagId" :label="item.tagName" :value="item.tagId" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('pv.station.form.capacity')" prop="capacityMw">
          <el-input-number v-model="form.capacityMw" :min="0" :precision="2" :step="0.1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="open = false">{{ $t('pv.common.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="submitForm">{{ $t('pv.common.buttons.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import auth from '@/plugins/auth'
import { useI18n } from 'vue-i18n'
import { listStation, addStation, updateStation, delStation } from '@/api/pv/station'
import { listStationTag } from '@/api/pv/catalog'

const { proxy } = getCurrentInstance()
const { t } = useI18n()

const loading = ref(false)
const open = ref(false)
const total = ref(0)
const stationList = ref([])
const tagOptions = ref([])
const formRef = ref(null)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  stationName: '',
  tagId: null
})

const form = reactive({
  stationId: null,
  stationName: '',
  location: '',
  tagId: null,
  capacityMw: 0
})

const rules = {
  stationName: [{ required: true, message: t('pv.station.validation.stationName'), trigger: 'blur' }]
}

const canAdd = computed(() => auth.hasPermi('pv:station:add'))
const canEdit = computed(() => auth.hasPermi('pv:station:edit'))
const canRemove = computed(() => auth.hasPermi('pv:station:remove'))

async function getList() {
  loading.value = true
  try {
    const res = await listStation(queryParams)
    stationList.value = res.rows || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

async function loadTags() {
  const res = await listStationTag({ pageNum: 1, pageSize: 200 })
  tagOptions.value = res.rows || []
}

function resetForm() {
  form.stationId = null
  form.stationName = ''
  form.location = ''
  form.tagId = null
  form.capacityMw = 0
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  queryParams.stationName = ''
  queryParams.tagId = null
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

async function handleDelete(row) {
  await proxy.$modal.confirm(t('pv.station.messages.deleteConfirm', { name: row.stationName }))
  await delStation(row.stationId)
  proxy.$modal.msgSuccess(t('pv.common.messages.deleteSuccess'))
  await getList()
}

function submitForm() {
  formRef.value.validate(async valid => {
    if (!valid) {
      return
    }
    if (form.stationId) {
      await updateStation(form)
      proxy.$modal.msgSuccess(t('pv.common.messages.updateSuccess'))
    } else {
      await addStation(form)
      proxy.$modal.msgSuccess(t('pv.common.messages.createSuccess'))
    }
    open.value = false
    getList()
  })
}

function formatNumber(value) {
  return Number(value || 0).toFixed(2)
}

onMounted(async () => {
  await Promise.all([loadTags(), getList()])
})
</script>
