import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface UiConfig {
  primaryColor: string
  navTheme: 'dark' | 'light'
  darkMode: boolean
  showBreadcrumb: boolean
  showTagsView: boolean
  fixedHeader: boolean
  sidebarLogo: boolean
  pageAnimation: boolean
  tableSize: 'default' | 'small' | 'mini'
}

const STORAGE_KEY = 'admin_ui_config'

const defaults: UiConfig = {
  primaryColor: '#409eff',
  navTheme: 'dark',
  darkMode: false,
  showBreadcrumb: true,
  showTagsView: false,
  fixedHeader: true,
  sidebarLogo: true,
  pageAnimation: true,
  tableSize: 'default',
}

function loadFromStorage(): UiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaults, ...JSON.parse(raw) }
  } catch {}
  return { ...defaults }
}

function applyDarkMode(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
}

function applyPrimaryColor(color: string) {
  const el = document.documentElement
  el.style.setProperty('--el-color-primary', color)
  // 生成 light 系列色阶
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }
  const mix = (c: number, ratio: number) => Math.round(c + (255 - c) * ratio)
  try {
    const { r, g, b } = hexToRgb(color.length === 7 ? color : '#409eff')
    for (let i = 1; i <= 9; i++) {
      const ratio = i / 10
      el.style.setProperty(
        `--el-color-primary-light-${i}`,
        `rgb(${mix(r, ratio)},${mix(g, ratio)},${mix(b, ratio)})`
      )
    }
    // dark
    const darkMix = (c: number, ratio: number) => Math.round(c * (1 - ratio))
    el.style.setProperty(
      '--el-color-primary-dark-2',
      `rgb(${darkMix(r, 0.2)},${darkMix(g, 0.2)},${darkMix(b, 0.2)})`
    )
  } catch {}
}

export const useConfigStore = defineStore('config', () => {
  const config = ref<UiConfig>(loadFromStorage())

  // 初始化时应用颜色和暗黑模式
  applyPrimaryColor(config.value.primaryColor)
  applyDarkMode(config.value.darkMode)

  watch(
    () => config.value.primaryColor,
    (color) => applyPrimaryColor(color)
  )

  watch(
    () => config.value.darkMode,
    (dark) => applyDarkMode(dark)
  )

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
  }

  function reset() {
    config.value = { ...defaults }
    applyPrimaryColor(defaults.primaryColor)
    applyDarkMode(defaults.darkMode)
    localStorage.removeItem(STORAGE_KEY)
  }

  return { config, save, reset }
})
