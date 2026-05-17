import { defineStore } from 'pinia'
import { getMembers, getMemberById, createMember, updateMember, deleteMember } from '@/api/member'
import { getFamilyTree, getStatistics } from '@/api/tree'

export const useMemberStore = defineStore('member', {
  state: () => ({
    members: [],
    currentMember: null,
    familyTree: [],
    statistics: null,
    loading: false
  }),
  
  actions: {
    async fetchMembers(params) {
      this.loading = true
      try {
        const res = await getMembers(params)
        if (res.success) {
          this.members = res.data
        }
        return res
      } finally {
        this.loading = false
      }
    },
    
    async fetchMemberById(id) {
      this.loading = true
      try {
        const res = await getMemberById(id)
        if (res.success) {
          this.currentMember = res.data
        }
        return res
      } finally {
        this.loading = false
      }
    },
    
    async addMember(data) {
      return await createMember(data)
    },
    
    async editMember(id, data) {
      return await updateMember(id, data)
    },
    
    async removeMember(id) {
      return await deleteMember(id)
    },
    
    async fetchFamilyTree() {
      this.loading = true
      try {
        const res = await getFamilyTree()
        if (res.success) {
          this.familyTree = res.data
        }
        return res
      } finally {
        this.loading = false
      }
    },
    
    async fetchStatistics() {
      try {
        const res = await getStatistics()
        if (res.success) {
          this.statistics = res.data
        }
        return res
      } catch (error) {
        console.error('获取统计失败', error)
      }
    }
  }
})