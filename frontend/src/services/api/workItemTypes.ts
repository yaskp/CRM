
import api from './auth'

export const workItemTypeService = {
    getWorkItemTypes: async (params?: { search?: string; page?: number; limit?: number; parent_id?: number; only_parents?: boolean }) => {
        const response = await api.get('/work-item-types', { params })
        return response.data
    },

    createWorkItemType: async (data: { name: string; code?: string; description?: string; parent_id?: number }) => {
        const response = await api.post('/work-item-types', data)
        return response.data
    },

    updateWorkItemType: async (id: number, data: { name?: string; code?: string; description?: string; is_active?: boolean; parent_id?: number }) => {
        const response = await api.put(`/work-item-types/${id}`, data)
        return response.data
    },

    deleteWorkItemType: async (id: number) => {
        const response = await api.delete(`/work-item-types/${id}`)
        return response.data
    },
}
