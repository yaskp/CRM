import api from './auth'

export const workOrderService = {
  getWorkOrders: async (params?: {
    project_id?: number
    status?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/work-orders', { params })
    return response.data
  },

  getWorkOrder: async (id: number) => {
    const response = await api.get(`/work-orders/${id}`)
    return response.data
  },

  createWorkOrder: async (data: {
    project_id: number
    work_order_date: string
    items: Array<{
      item_type: string
      quantity: number
      rate: number
    }>
    discount_percentage?: number
    payment_terms?: string
    remarks?: string
  }) => {
    const response = await api.post('/work-orders', data)
    return response.data
  },

  updateWorkOrder: async (id: number, data: any) => {
    const response = await api.put(`/work-orders/${id}`, data)
    return response.data
  },
}

