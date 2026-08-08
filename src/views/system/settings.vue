<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores'
import { updateAdminPassword, createAdmin, getAllSchools, addSchool, updateAiApiKey, getAiApiKey } from '@/api'

const userStore = useUserStore()
const isSuperAdmin = userStore.userInfo?.role === 1

// 修改密码
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdLoading = ref(false)
const handleChangePassword = async () => {
  if (!pwdForm.value.oldPassword || !pwdForm.value.newPassword) {
    ElMessage.warning('请填写完整')
    return
  }
  if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) {
    ElMessage.warning('两次密码不一致')
    return
  }
  if (!/^[a-zA-Z0-9]{8,16}$/.test(pwdForm.value.newPassword)) {
    ElMessage.warning('新密码须为 8-16 位数字或字母')
    return
  }
  pwdLoading.value = true
  try {
    await updateAdminPassword({ oldPassword: pwdForm.value.oldPassword, newPassword: pwdForm.value.newPassword })
    ElMessage.success('密码修改成功，请重新登录')
    userStore.logout()
    window.location.href = '/login'
  } catch (e: any) {
    ElMessage.error(e?.message || '修改失败')
  } finally {
    pwdLoading.value = false
  }
}

// 创建校级管理员（仅超管）
const schools = ref<any[]>([])
const createForm = ref({ username: '', password: '', campusId: undefined as number | undefined })
const createLoading = ref(false)

if (isSuperAdmin) {
  getAllSchools().then(r => { schools.value = r.data || [] })
}

const handleCreateAdmin = async () => {
  if (!createForm.value.username || !createForm.value.password || !createForm.value.campusId) {
    ElMessage.warning('请填写完整')
    return
  }
  if (!/^[a-zA-Z0-9]{8,16}$/.test(createForm.value.password)) {
    ElMessage.warning('密码须为 8-16 位数字或字母')
    return
  }
  createLoading.value = true
  try {
    await createAdmin({ username: createForm.value.username, password: createForm.value.password, campusId: createForm.value.campusId! })
    ElMessage.success('创建成功')
    createForm.value = { username: '', password: '', campusId: undefined }
  } catch (e: any) {
    ElMessage.error(e?.message || '创建失败')
  } finally {
    createLoading.value = false
  }
}

// 新增学校（仅超管）
const schoolForm = ref({ name: '', code: '', province: '', city: '' })
const schoolLoading = ref(false)
const handleAddSchool = async () => {
  if (!schoolForm.value.name.trim() || !schoolForm.value.code.trim()) {
    ElMessage.warning('学校名称和编码必填')
    return
  }
  schoolLoading.value = true
  try {
    await addSchool(schoolForm.value)
    ElMessage.success('学校添加成功')
    schoolForm.value = { name: '', code: '', province: '', city: '' }
    getAllSchools().then(r => { schools.value = r.data || [] })
  } catch (e: any) {
    ElMessage.error(e?.message || '添加失败')
  } finally {
    schoolLoading.value = false
  }
}

// 修改 AI API Key（仅超管）
const apiKeyForm = ref({ apiKey: '' })
const apiKeyLoading = ref(false)
const currentApiKey = ref('')

if (isSuperAdmin) {
  onMounted(() => {
    getAiApiKey().then(r => { currentApiKey.value = r.data || '' })
  })
}

const handleUpdateApiKey = async () => {
  if (!apiKeyForm.value.apiKey.trim()) {
    ElMessage.warning('请输入 API Key')
    return
  }
  apiKeyLoading.value = true
  try {
    await updateAiApiKey(apiKeyForm.value.apiKey.trim())
    ElMessage.success('API Key 更新成功')
    currentApiKey.value = await getAiApiKey().then(r => r.data || '')
    apiKeyForm.value = { apiKey: '' }
  } catch (e: any) {
    ElMessage.error(e?.message || '更新失败')
  } finally {
    apiKeyLoading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">系统配置</h2>
    </div>

    <el-card shadow="never" style="margin-bottom:16px">
      <div class="section-title">修改密码</div>
      <el-form label-width="100px" style="max-width:480px">
        <el-form-item label="旧密码">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="8-16位数字或字母" />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="pwdLoading" @click="handleChangePassword">确认修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="isSuperAdmin" shadow="never">
      <div class="section-title">创建校级管理员</div>
      <el-form label-width="100px" style="max-width:480px">
        <el-form-item label="账号">
          <el-input v-model="createForm.username" placeholder="登录账号" />
        </el-form-item>
        <el-form-item label="初始密码">
          <el-input v-model="createForm.password" type="password" show-password placeholder="8-16位数字或字母" />
        </el-form-item>
        <el-form-item label="所属高校">
          <el-select v-model="createForm.campusId" placeholder="请选择高校" style="width:100%">
            <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="createLoading" @click="handleCreateAdmin">创建</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card v-if="isSuperAdmin" shadow="never" style="margin-top:16px">
      <div class="section-title">新增学校</div>
      <el-form label-width="100px" style="max-width:480px">
        <el-form-item label="学校名称">
          <el-input v-model="schoolForm.name" placeholder="如：东南大学" />
        </el-form-item>
        <el-form-item label="学校编码">
          <el-input v-model="schoolForm.code" placeholder="如：SEU" />
        </el-form-item>
        <el-form-item label="省份">
          <el-input v-model="schoolForm.province" placeholder="如：江苏" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="schoolForm.city" placeholder="如：南京" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="schoolLoading" @click="handleAddSchool">添加</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card v-if="isSuperAdmin" shadow="never" style="margin-top:16px">
      <div class="section-title">AI API Key</div>
      <el-form label-width="100px" style="max-width:480px">
        <el-form-item v-if="currentApiKey" label="当前 Key">
          <span style="font-family:monospace;color:var(--el-text-color-secondary)">{{ currentApiKey }}</span>
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="apiKeyForm.apiKey" placeholder="输入新的 API Key" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="apiKeyLoading" @click="handleUpdateApiKey">更新</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-title { margin: 0; font-size: 20px; font-weight: 600; }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--el-border-color-light); }
</style>
