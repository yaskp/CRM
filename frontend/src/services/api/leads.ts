import api from './auth'

export const leadService = {
  getLeads: async (params?: {
    status?: string
    search?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/leads', { params })
    return response.data
  },

  getLead: async (id: number) => {
    const response = await api.get(`/leads/${id}`)
    return response.data
  },

  createLead: async (data: {
    name: string
    company_name?: string
    phone?: string
    email?: string
    address?: string
    enquiry_date: string
    source?: string
    status?: string
    remarks?: string
  }) => {
    const response = await api.post('/leads', data)
    return response.data
  },

  updateLead: async (id: number, data: any) => {
    const response = await api.put(`/leads/${id}`, data)
    return response.data
  },

  convertToProject: async (id: number) => {
    const response = await api.post(`/leads/${id}/convert`)
    return response.data
  },
}

