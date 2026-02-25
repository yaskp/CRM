import api from './auth'

export const warehouseService = {
  getWarehouses: async (params?: { limit?: number; type?: string; project_id?: number }) => {
    const response = await api.get('/warehouses', { params })
    return response.data
  },

  getWarehouse: async (id: number) => {
    const response = await api.get(`/warehouses/${id}`)
    return response.data
  },

  createWarehouse: async (data: {
    name: string
    code: string
    location?: string
    company_id?: number
    is_common?: boolean
  }) => {
    const response = await api.post('/warehouses', data)
    return response.data
  },

  updateWarehouse: async (id: number, data: any) => {
    const response = await api.put(`/warehouses/${id}`, data)
    return response.data
  },

  getInventory: async (warehouseId: number) => {
    const response = await api.get(`/warehouses/${warehouseId}/inventory`)
    return response.data
  },
}

