<template>
  <div class="dev-container">
    <el-empty description="正在开发中">
      <template #image>
        <el-icon class="dev-icon"><Tools /></el-icon>
      </template>
    </el-empty>
  </div>
</template>

<style scoped>
.dev-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}
.dev-icon {
  font-size: 80px;
  color: #c0c4cc;
}
</style>
