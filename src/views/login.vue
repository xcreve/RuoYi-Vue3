<template>
  <div class="login-page">
    <div class="login-page__hero">
      <div class="login-page__intro">
        <div class="login-page__badge">
          <svg-icon icon-class="sunny" />
          <span>MyEMS-PV</span>
        </div>
        <h1>{{ title }}</h1>
        <p>基于若依权限体系重建的分布式光伏电站管理系统。</p>
        <div class="login-page__metrics">
          <div class="metric-card">
            <span class="metric-card__label">监控范围</span>
            <strong class="metric-card__value">监控大屏 / 设备 / 告警 / 分析</strong>
          </div>
          <div class="metric-card">
            <span class="metric-card__label">运维模式</span>
            <strong class="metric-card__value">暗色橙色主题 + 若依动态菜单</strong>
          </div>
        </div>
      </div>

      <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
        <div class="login-form__header">
          <div class="login-form__icon">
            <svg-icon icon-class="sunny" />
          </div>
          <div>
            <h3 class="title">登录系统</h3>
            <p class="subtitle">使用若依账号进入 MyEMS 业务域</p>
          </div>
        </div>

        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            type="text"
            size="large"
            auto-complete="off"
            placeholder="请输入账号"
          >
            <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            size="large"
            auto-complete="off"
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          >
            <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
          </el-input>
        </el-form-item>
        <el-form-item prop="code" v-if="captchaEnabled" class="captcha-item">
          <el-input
            v-model="loginForm.code"
            size="large"
            auto-complete="off"
            placeholder="请输入验证码"
            @keyup.enter="handleLogin"
          >
            <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
          </el-input>
          <button type="button" class="login-code" @click="getCode">
            <img :src="codeUrl" class="login-code-img"/>
          </button>
        </el-form-item>

        <div class="login-form__options">
          <el-checkbox v-model="loginForm.rememberMe">记住密码</el-checkbox>
          <span class="login-form__hint">默认管理员: `admin / admin123`</span>
        </div>

        <el-form-item class="login-form__submit">
          <el-button :loading="loading" size="large" type="primary" class="submit-button" @click.prevent="handleLogin">
            <span v-if="!loading">登 录</span>
            <span v-else>登 录 中...</span>
          </el-button>
        </el-form-item>

        <div class="login-form__footer">
          <span>{{ footerContent }}</span>
          <router-link v-if="register" class="link-type" :to="'/register'">立即注册</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { getCodeImg } from "@/api/login"
import Cookies from "js-cookie"
import { encrypt, decrypt } from "@/utils/jsencrypt"
import useUserStore from '@/store/modules/user'
import defaultSettings from '@/settings'

const title = import.meta.env.VITE_APP_TITLE
const footerContent = defaultSettings.footerContent
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance()

const loginForm = ref({
  username: "admin",
  password: "admin123",
  rememberMe: false,
  code: "",
  uuid: ""
})

const loginRules = {
  username: [{ required: true, trigger: "blur", message: "请输入您的账号" }],
  password: [{ required: true, trigger: "blur", message: "请输入您的密码" }],
  code: [{ required: true, trigger: "change", message: "请输入验证码" }]
}

const codeUrl = ref("")
const loading = ref(false)
// 验证码开关
const captchaEnabled = ref(true)
// 注册开关
const register = ref(false)
const redirect = ref(undefined)

watch(route, (newRoute) => {
    redirect.value = newRoute.query && newRoute.query.redirect
}, { immediate: true })

function handleLogin() {
  proxy.$refs.loginRef.validate(valid => {
    if (valid) {
      loading.value = true
      // 勾选了需要记住密码设置在 cookie 中设置记住用户名和密码
      if (loginForm.value.rememberMe) {
        Cookies.set("username", loginForm.value.username, { expires: 30 })
        Cookies.set("password", encrypt(loginForm.value.password), { expires: 30 })
        Cookies.set("rememberMe", loginForm.value.rememberMe, { expires: 30 })
      } else {
        // 否则移除
        Cookies.remove("username")
        Cookies.remove("password")
        Cookies.remove("rememberMe")
      }
      // 调用action的登录方法
      userStore.login(loginForm.value).then(() => {
        const query = route.query
        const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
          if (cur !== "redirect") {
            acc[cur] = query[cur]
          }
          return acc
        }, {})
        router.push({ path: redirect.value || "/", query: otherQueryParams })
      }).catch(() => {
        loading.value = false
        // 重新获取验证码
        if (captchaEnabled.value) {
          getCode()
        }
      })
    }
  })
}

function getCode() {
  getCodeImg().then(res => {
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled
    if (captchaEnabled.value) {
      codeUrl.value = "data:image/gif;base64," + res.img
      loginForm.value.uuid = res.uuid
    }
  })
}

function getCookie() {
  const username = Cookies.get("username")
  const password = Cookies.get("password")
  const rememberMe = Cookies.get("rememberMe")
  loginForm.value = {
    username: username === undefined ? loginForm.value.username : username,
    password: password === undefined ? loginForm.value.password : decrypt(password),
    rememberMe: rememberMe === undefined ? false : Boolean(rememberMe)
  }
}

getCode()
getCookie()
</script>

<style lang='scss' scoped>
.login-page {
  min-height: 100vh;
  padding: 32px;
  background:
    radial-gradient(circle at left top, rgba(249, 115, 22, 0.18), transparent 28%),
    radial-gradient(circle at right bottom, rgba(251, 146, 60, 0.12), transparent 30%),
    linear-gradient(135deg, #0b0d11 0%, #131720 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-page__hero {
  width: min(1180px, 100%);
  display: grid;
  grid-template-columns: 1.15fr 460px;
  gap: 28px;
  align-items: stretch;
}

.login-page__intro,
.login-form {
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(16, 18, 24, 0.82);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(20px);
}

.login-page__intro {
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  h1 {
    margin: 22px 0 14px;
    font-size: 42px;
    line-height: 1.08;
    color: #fff;
  }

  p {
    margin: 0;
    max-width: 560px;
    font-size: 16px;
    line-height: 1.75;
    color: rgba(255, 255, 255, 0.72);
  }
}

.login-page__badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.12);
  border: 1px solid rgba(249, 115, 22, 0.24);
  color: #fb923c;
  font-size: 13px;
  font-weight: 700;
}

.login-page__metrics {
  display: grid;
  gap: 14px;
  margin-top: 36px;
}

.metric-card {
  padding: 18px 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.metric-card__label {
  display: block;
  color: rgba(255, 255, 255, 0.52);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.metric-card__value {
  display: block;
  margin-top: 10px;
  color: #fff;
  font-size: 18px;
  line-height: 1.5;
}

.login-form {
  padding: 32px 30px 26px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-input__wrapper) {
    min-height: 50px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.04);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  :deep(.el-input__inner) {
    color: #fff;
  }
}

.login-form__header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}

.login-form__icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #fff;
  font-size: 24px;
}

.title {
  margin: 0;
  font-size: 28px;
  color: #fff;
}

.subtitle {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.58);
  font-size: 13px;
}

.input-icon {
  width: 16px;
  color: rgba(255, 255, 255, 0.48);
}

.captcha-item {
  :deep(.el-form-item__content) {
    display: grid;
    grid-template-columns: 1fr 120px;
    gap: 12px;
  }
}

.login-code {
  padding: 0;
  border: 0;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
}

.login-code-img {
  width: 100%;
  height: 50px;
  display: block;
  object-fit: cover;
}

.login-form__options,
.login-form__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.login-form__options {
  margin-bottom: 22px;
}

.login-form__hint,
.login-form__footer {
  color: rgba(255, 255, 255, 0.52);
  font-size: 12px;
}

.login-form__submit {
  margin-bottom: 14px;
}

.submit-button {
  width: 100%;
  height: 52px;
  border-radius: 16px;
  border: none;
  font-weight: 700;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  box-shadow: 0 18px 40px rgba(249, 115, 22, 0.24);
}

.link-type {
  color: #fb923c;
}

@media (max-width: 1024px) {
  .login-page__hero {
    grid-template-columns: 1fr;
  }

  .login-page__intro {
    display: none;
  }

  .login-form {
    width: min(460px, 100%);
    margin: 0 auto;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 18px;
  }

  .login-form {
    padding: 28px 22px 22px;
  }

  .captcha-item :deep(.el-form-item__content) {
    grid-template-columns: 1fr;
  }

  .login-form__options,
  .login-form__footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
