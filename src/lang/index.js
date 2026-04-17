import { createI18n } from 'vue-i18n'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import zhPv from './zh-CN/pv.json'
import enPv from './en-US/pv.json'

const DEFAULT_LOCALE = 'zh-CN'
const STORAGE_KEY = 'app-locale'

const messages = {
  'zh-CN': {
    pv: zhPv
  },
  'en-US': {
    pv: enPv
  }
}

export function getAppLocale() {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE
  }
  const savedLocale = window.localStorage.getItem(STORAGE_KEY)
  return messages[savedLocale] ? savedLocale : DEFAULT_LOCALE
}

export function getElementLocale(locale) {
  return {
    'zh-CN': zhCn,
    'en-US': en
  }[locale] || zhCn
}

const i18n = createI18n({
  legacy: false,
  locale: getAppLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  globalInjection: true,
  messages
})

export default i18n
