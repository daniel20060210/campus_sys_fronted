import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSchoolFilterStore = defineStore('schoolFilter', () => {
  const userInfo = JSON.parse(localStorage.getItem('admin_user') || 'null')
  const isCampusAdmin = userInfo?.role === 2
  // 校级管理员固定为本校，超管默认空（全部）
  const selectedSchoolIds = ref<number[]>(
    isCampusAdmin && userInfo?.campusId ? [userInfo.campusId] : []
  )

  function setSchoolIds(ids: number[]) {
    if (isCampusAdmin) return // 校级管理员不允许修改
    selectedSchoolIds.value = ids
  }

  return { selectedSchoolIds, setSchoolIds, isCampusAdmin }
})
