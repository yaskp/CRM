import api from './auth'

export const quotationService = {
  getQuotations: async (params?: {
    lead_id?: number
    status?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/quotations', { params })
    return response.data
  },

  getQuotation: async (id: number) => {
    const response = await api.get(`/quotations/${id}`)
    return response.data
  },

  createQuotation: async (data: {
    lead_id: number
    version?: number
    valid_till?: string
    items: Array<{
      description: string
      quantity: number
      unit: string
      rate: number
    }>
    discount_percentage?: number
    payment_terms?: string
    remarks?: string
  }) => {
    const response = await api.post('/quotations', data)
    return response.data
  },

  updateQuotation: async (id: number, data: any) => {
    const response = await api.put(`/quotations/${id}`, data)
    return response.data
  },

  getQuotationsByLead: async (leadId: number) => {
    const response = await api.get(`/quotations/lead/${leadId}`)
    return response.data
  },

  generatePDF: async (id: number) => {
    const response = await api.post(`/quotations/${id}/generate-pdf`, {}, {
      responseType: 'blob',
    })
    return response.data
  },
}

