
import api from './auth'

export const unitService = {
    getUnits: async (params?: { search?: string; page?: number; limit?: number }) => {
        const response = await api.get('/units', { params })
        return response.data
    },

    createUnit: async (data: { name: string; code: string }) => {
        const response = await api.post('/units', data)
        return response.data
    },

    updateUnit: async (id: number, data: { name?: string; code?: string; is_active?: boolean }) => {
        const response = await api.put(`/units/${id}`, data)
        return response.data
    },

    deleteUnit: async (id: number) => {
        const response = await api.delete(`/units/${id}`)
        return response.data
    },
}
