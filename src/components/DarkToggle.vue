<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Sunny, Moon } from '@element-plus/icons-vue'

const isDark = ref(false)
const SCHEME_KEY = 'campus-color-scheme'

const getScheme = () => localStorage.getItem(SCHEME_KEY) || 'light'
const setScheme = (v: string) => localStorage.setItem(SCHEME_KEY, v)

const applyDark = (dark: boolean) => {
  document.documentElement.classList.toggle('dark', dark)
  isDark.value = dark
}

const toggle = async (event: MouseEvent) => {
  const toDark = !isDark.value

  if (typeof (document as any).startViewTransition === 'function') {
    const x = event.clientX
    const y = event.clientY
    const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

    const transition = (document as any).startViewTransition(() => {
      applyDark(toDark)
      setScheme(toDark ? 'dark' : 'light')
    })

    await transition.ready
    document.documentElement.animate(
      {
        clipPath: toDark
          ? [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]
          : [`circle(${endRadius}px at ${x}px ${y}px)`, `circle(0px at ${x}px ${y}px)`],
      },
      {
        duration: 600,
        easing: 'ease-in',
        pseudoElement: toDark ? '::view-transition-new(root)' : '::view-transition-old(root)',
      }
    )
  } else {
    applyDark(toDark)
    setScheme(toDark ? 'dark' : 'light')
  }
}

onMounted(() => {
  applyDark(getScheme() === 'dark')
})
</script>

<template>
  <div class="dark-toggle" :title="isDark ? '切换日间模式' : '切换夜间模式'" @click="toggle">
    <el-icon class="toggle-icon" :class="{ 'is-dark': isDark }">
      <Moon v-if="isDark" />
      <Sunny v-else />
    </el-icon>
  </div>
</template>

<style lang="scss">
::view-transition-old(root),
::view-transition-new(root) {
  mix-blend-mode: normal;
  animation: none;
}
::view-transition-old(root) { z-index: 999; }
::view-transition-new(root) { z-index: 1; }
.dark::view-transition-old(root) { z-index: 1; }
.dark::view-transition-new(root) { z-index: 999; }
</style>

<style lang="scss" scoped>
.dark-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: 8px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
  &:hover { background: var(--el-fill-color-light); }
}
.toggle-icon {
  font-size: 18px;
  color: #606266;
  transition: transform 0.4s;
  &:hover { transform: rotate(30deg); }
  &.is-dark { color: #ffd700; &:hover { transform: scale(1.2); } }
}
</style>
