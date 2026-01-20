import api from './auth'

export const clientService = {
    getClients: async (params?: {
        search?: string
        status?: string
        client_type?: string
        page?: number
        limit?: number
    }) => {
        const response = await api.get('/clients', { params })
        return response.data
    },

    getClient: async (id: number) => {
        const response = await api.get(`/clients/${id}`)
        return response.data
    },

    createClient: async (data: {
        company_name: string
        contact_person?: string
        email?: string
        phone?: string
        address?: string
        city?: string
        state?: string
        pincode?: string
        gstin?: string
        pan?: string
        payment_terms?: string
        credit_limit?: number
        client_type?: string
        status?: string
    }) => {
        const response = await api.post('/clients', data)
        return response.data
    },

    updateClient: async (id: number, data: {
        company_name?: string
        contact_person?: string
        email?: string
        phone?: string
        address?: string
        city?: string
        state?: string
        pincode?: string
        gstin?: string
        pan?: string
        payment_terms?: string
        credit_limit?: number
        client_type?: string
        status?: string
    }) => {
        const response = await api.put(`/clients/${id}`, data)
        return response.data
    },

    deleteClient: async (id: number) => {
        const response = await api.delete(`/clients/${id}`)
        return response.data
    },

    getClientProjects: async (id: number) => {
        const response = await api.get(`/clients/${id}/projects`)
        return response.data
    },
}
