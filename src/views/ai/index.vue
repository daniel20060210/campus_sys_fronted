<script setup lang="ts">
</script>

<template>
  <div class="ai-assistant-page">
    <div class="page-header">
      <h2>AI 助手</h2>
    </div>
    <div class="coming-soon">
      <el-empty description="AI 助手功能即将上线" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ai-assistant-page {
  padding: 20px;
}
.page-header {
  margin-bottom: 20px;
  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}
.coming-soon {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: #fff;
  border-radius: 8px;
}
</style>
