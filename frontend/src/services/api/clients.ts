import api from './auth'

export const clientService = {
    // Client Groups
    getClientGroups: async () => {
        const response = await api.get('/clients/groups')
        return response.data
    },

    createClientGroup: async (data: {
        group_name: string
        group_type: 'corporate' | 'sme' | 'government' | 'individual' | 'retail'
        description?: string
    }) => {
        const response = await api.post('/clients/groups', data)
        return response.data
    },

    updateClientGroup: async (id: number, data: {
        group_name?: string
        group_type?: 'corporate' | 'sme' | 'government' | 'individual' | 'retail'
        description?: string
    }) => {
        const response = await api.put(`/clients/groups/${id}`, data)
        return response.data
    },

    deleteClientGroup: async (id: number) => {
        const response = await api.delete(`/clients/groups/${id}`)
        return response.data
    },

    // Clients
    getClients: async (params?: {
        search?: string
        status?: string
        client_type?: string
        client_group_id?: number
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
        client_group_id?: number
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
        contacts?: Array<{
            contact_name: string
            designation?: string
            email?: string
            phone?: string
            is_primary?: boolean
        }>
    }) => {
        const response = await api.post('/clients', data)
        return response.data
    },

    updateClient: async (id: number, data: {
        company_name?: string
        client_group_id?: number
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
        contacts?: Array<{
            contact_name: string
            designation?: string
            email?: string
            phone?: string
            is_primary?: boolean
        }>
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
