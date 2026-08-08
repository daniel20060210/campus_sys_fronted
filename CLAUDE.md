# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Vue 3 + TypeScript 管理端，对应后端 CampusSys。使用 Element Plus 组件库、Pinia 状态管理、Vue Router。

## 学校筛选权限约定

管理端顶部有学校筛选框，所有列表/数据页面均需遵守以下规则：

- **超级管理员**（`userInfo.role === 1`）：顶部显示多选学校筛选框，可选任意学校，空选表示全部学校。筛选状态存储在 `useSchoolFilterStore().selectedSchoolIds`（`number[]`）。
- **校级管理员**（`userInfo.role === 2`）：不显示筛选框。`schoolFilterStore.selectedSchoolIds` 在 store 初始化时自动固定为本校 `campusId`，不可修改。

**页面接入筛选的标准写法：**
```typescript
import { useSchoolFilterStore } from '@/stores'
const schoolFilterStore = useSchoolFilterStore()

// 在 fetchData 中传入筛选参数
const params: any = { page: page.value, size: size.value }
if (schoolFilterStore.selectedSchoolIds.length > 0) {
  params.campusIds = schoolFilterStore.selectedSchoolIds
}

// 监听筛选变化自动刷新
watch(() => schoolFilterStore.selectedSchoolIds, fetchData, { deep: true })
```

## API 约定

- 所有 API 函数在 `src/api/` 下按模块分文件，统一从 `src/api/index.ts` 导出
- 请求工具在 `src/utils/request.ts`，提供 `get / post / put / del` 方法
- 接口路径不含 `/api/v1` 前缀（由 request 工具统一添加）

## 目录结构

```
src/
├── api/          # 接口函数（按模块分文件）
├── views/        # 页面组件
├── stores/       # Pinia 状态（user, schoolFilter, config）
├── components/   # 公共组件
├── utils/        # 工具函数（request.ts 等）
└── types/        # TypeScript 类型定义
```
