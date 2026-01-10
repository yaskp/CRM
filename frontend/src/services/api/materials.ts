import api from './auth'

export const materialService = {
  getMaterials: async (params?: {
    search?: string
    category?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/materials', { params })
    return response.data
  },

  getMaterial: async (id: number) => {
    const response = await api.get(`/materials/${id}`)
    return response.data
  },

  createMaterial: async (data: {
    name: string
    material_code?: string
    category?: string
    unit: string
    description?: string
  }) => {
    const response = await api.post('/materials', data)
    return response.data
  },

  updateMaterial: async (id: number, data: any) => {
    const response = await api.put(`/materials/${id}`, data)
    return response.data
  },

  deleteMaterial: async (id: number) => {
    const response = await api.delete(`/materials/${id}`)
    return response.data
  },
}

