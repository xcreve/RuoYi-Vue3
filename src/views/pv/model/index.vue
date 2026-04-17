<template>
  <div class="app-container pv-page">
    <div>
      <h1 class="pv-page-title">{{ $t('pv.model.title') }}</h1>
      <p class="pv-page-subtitle">{{ $t('pv.model.subtitle') }}</p>
    </div>

    <div class="pv-toolbar">
      <div class="pv-toolbar-grid">
        <div class="pv-toolbar-left">
          <el-input v-model="queryParams.brand" :placeholder="$t('pv.model.query.brand')" clearable style="width: 180px" @keyup.enter="handleQuery">
            <template #prefix><svg-icon icon-class="search" /></template>
          </el-input>
          <el-input v-model="queryParams.modelName" :placeholder="$t('pv.model.query.modelName')" clearable style="width: 220px" @keyup.enter="handleQuery" />
        </div>
        <div class="pv-toolbar-right">
          <el-button @click="resetQuery">{{ $t('pv.common.buttons.reset') }}</el-button>
          <el-button v-if="canAdd" type="primary" @click="handleAdd">{{ $t('pv.model.buttons.add') }}</el-button>
        </div>
      </div>
    </div>

    <div class="pv-table-card">
      <el-table v-loading="loading" :data="modelList">
        <el-table-column prop="brand" :label="$t('pv.model.table.brand')" width="160" />
        <el-table-column prop="modelName" :label="$t('pv.model.table.modelName')" width="220" />
        <el-table-column prop="mqttProtocol" :label="$t('pv.model.table.mqttProtocol')" min-width="260" show-overflow-tooltip />
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

    <el-dialog v-model="open" :title="form.modelId ? $t('pv.model.dialog.editTitle') : $t('pv.model.dialog.addTitle')" width="620px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item :label="$t('pv.model.form.brand')" prop="brand">
          <el-input v-model="form.brand" :placeholder="$t('pv.model.form.brandPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('pv.model.form.modelName')" prop="modelName">
          <el-input v-model="form.modelName" :placeholder="$t('pv.model.form.modelNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('pv.model.form.mqttProtocol')">
          <el-input v-model="form.mqttProtocol" type="textarea" :rows="5" :placeholder="$t('pv.model.form.mqttProtocolPlaceholder')" />
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
import { listModel, addModel, updateModel, delModel } from '@/api/pv/catalog'

const { proxy } = getCurrentInstance()
const { t } = useI18n()

const loading = ref(false)
const open = ref(false)
const total = ref(0)
const modelList = ref([])
const formRef = ref(null)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  brand: '',
  modelName: ''
})

const form = reactive({
  modelId: null,
  brand: '',
  modelName: '',
  mqttProtocol: ''
})

const rules = {
  brand: [{ required: true, message: t('pv.model.validation.brand'), trigger: 'blur' }],
  modelName: [{ required: true, message: t('pv.model.validation.modelName'), trigger: 'blur' }]
}

const canAdd = computed(() => auth.hasPermi('pv:model:add'))
const canEdit = computed(() => auth.hasPermi('pv:model:edit'))
const canRemove = computed(() => auth.hasPermi('pv:model:remove'))

async function getList() {
  loading.value = true
  try {
    const res = await listModel(queryParams)
    modelList.value = res.rows || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.modelId = null
  form.brand = ''
  form.modelName = ''
  form.mqttProtocol = ''
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  queryParams.brand = ''
  queryParams.modelName = ''
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
  await proxy.$modal.confirm(t('pv.model.messages.deleteConfirm', { name: `${row.brand} ${row.modelName}`.trim() }))
  await delModel(row.modelId)
  proxy.$modal.msgSuccess(t('pv.common.messages.deleteSuccess'))
  await getList()
}

function submitForm() {
  formRef.value.validate(async valid => {
    if (!valid) {
      return
    }
    if (form.modelId) {
      await updateModel(form)
      proxy.$modal.msgSuccess(t('pv.common.messages.updateSuccess'))
    } else {
      await addModel(form)
      proxy.$modal.msgSuccess(t('pv.common.messages.createSuccess'))
    }
    open.value = false
    getList()
  })
}

onMounted(getList)
</script>
