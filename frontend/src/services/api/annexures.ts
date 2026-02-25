import api from './auth'

export interface Annexure {
    id: number
    name: string
    description?: string
    clauses: string[]
    client_scope?: string
    contractor_scope?: string
    payment_terms?: string
    delivery_terms?: string
    quality_terms?: string
    warranty_terms?: string
    penalty_clause?: string
    scope_matrix?: any[]
    type: 'client_scope' | 'contractor_scope' | 'payment_terms' | 'general_terms' | 'purchase_order' | 'scope_matrix'
    is_active: boolean
    created_at: string
}

export const annexureService = {
    getAnnexures: async (params?: { page?: number; limit?: number; search?: string }) => {
        const response = await api.get('/annexures', { params })
        return response.data
    },

    getAnnexure: async (id: number) => {
        const response = await api.get(`/annexures/${id}`)
        return response.data
    },

    createAnnexure: async (data: Partial<Annexure>) => {
        const response = await api.post('/annexures', data)
        return response.data
    },

    updateAnnexure: async (id: number, data: Partial<Annexure>) => {
        const response = await api.put(`/annexures/${id}`, data)
        return response.data
    },

    deleteAnnexure: async (id: number) => {
        const response = await api.delete(`/annexures/${id}`)
        return response.data
    }
}
