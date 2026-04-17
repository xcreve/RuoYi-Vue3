<template>
  <div class="app-container pv-page">
    <div>
      <h1 class="pv-page-title">{{ $t('pv.stationTag.title') }}</h1>
      <p class="pv-page-subtitle">{{ $t('pv.stationTag.subtitle') }}</p>
    </div>

    <div class="pv-toolbar">
      <div class="pv-toolbar-grid">
        <div class="pv-toolbar-left">
          <el-input v-model="queryParams.tagName" :placeholder="$t('pv.stationTag.query.tagName')" clearable style="width: 240px" @keyup.enter="handleQuery">
            <template #prefix><svg-icon icon-class="search" /></template>
          </el-input>
        </div>
        <div class="pv-toolbar-right">
          <el-button @click="resetQuery">{{ $t('pv.common.buttons.reset') }}</el-button>
          <el-button v-if="canAdd" type="primary" @click="handleAdd">{{ $t('pv.stationTag.buttons.add') }}</el-button>
        </div>
      </div>
    </div>

    <div class="pv-table-card">
      <el-table v-loading="loading" :data="tagList">
        <el-table-column prop="tagName" :label="$t('pv.stationTag.table.tagName')" min-width="180" />
        <el-table-column prop="description" :label="$t('pv.stationTag.table.description')" min-width="240" show-overflow-tooltip />
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

    <el-dialog v-model="open" :title="form.tagId ? $t('pv.stationTag.dialog.editTitle') : $t('pv.stationTag.dialog.addTitle')" width="520px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item :label="$t('pv.stationTag.form.tagName')" prop="tagName">
          <el-input v-model="form.tagName" :placeholder="$t('pv.stationTag.form.tagNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('pv.stationTag.form.description')" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" :placeholder="$t('pv.stationTag.form.descriptionPlaceholder')" />
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
import { listStationTag, addStationTag, updateStationTag, delStationTag } from '@/api/pv/catalog'

const { proxy } = getCurrentInstance()
const { t } = useI18n()

const loading = ref(false)
const open = ref(false)
const total = ref(0)
const tagList = ref([])
const formRef = ref(null)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  tagName: ''
})

const form = reactive({
  tagId: null,
  tagName: '',
  description: ''
})

const rules = {
  tagName: [{ required: true, message: t('pv.stationTag.validation.tagName'), trigger: 'blur' }]
}

const canAdd = computed(() => auth.hasPermi('pv:stationTag:add'))
const canEdit = computed(() => auth.hasPermi('pv:stationTag:edit'))
const canRemove = computed(() => auth.hasPermi('pv:stationTag:remove'))

async function getList() {
  loading.value = true
  try {
    const res = await listStationTag(queryParams)
    tagList.value = res.rows || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.tagId = null
  form.tagName = ''
  form.description = ''
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  queryParams.tagName = ''
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
  await proxy.$modal.confirm(t('pv.stationTag.messages.deleteConfirm', { name: row.tagName }))
  await delStationTag(row.tagId)
  proxy.$modal.msgSuccess(t('pv.common.messages.deleteSuccess'))
  await getList()
}

function submitForm() {
  formRef.value.validate(async valid => {
    if (!valid) {
      return
    }
    if (form.tagId) {
      await updateStationTag(form)
      proxy.$modal.msgSuccess(t('pv.common.messages.updateSuccess'))
    } else {
      await addStationTag(form)
      proxy.$modal.msgSuccess(t('pv.common.messages.createSuccess'))
    }
    open.value = false
    getList()
  })
}

onMounted(getList)
</script>
