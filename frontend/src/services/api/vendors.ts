import api from './auth'

export const vendorService = {
    // Get all vendors
    // Get all vendors
    getVendors: async (filters?: {
        vendor_type?: string
        is_active?: boolean
        search?: string
        page?: number
        limit?: number
    }) => {
        const response = await api.get('/vendors', { params: filters })
        return response.data
    },

    // Get vendor by ID
    getVendorById: async (id: number) => {
        const response = await api.get(`/vendors/${id}`)
        return response.data
    },

    // Create vendor
    createVendor: async (data: {
        name: string
        vendor_type: string
        contact_person?: string
        phone?: string
        email?: string
        address?: string
        gst_number?: string
        pan_number?: string
        bank_details?: string
        is_msme?: boolean
        msme_number?: string
        msme_category?: string
        contacts?: any[]
    }) => {
        const response = await api.post('/vendors', data)
        return response.data
    },

    // Update vendor
    updateVendor: async (id: number, data: any) => {
        const response = await api.put(`/vendors/${id}`, data)
        return response.data
    },

    // Delete vendor
    deleteVendor: async (id: number) => {
        const response = await api.delete(`/vendors/${id}`)
        return response.data
    },

    // Assign vendor to project
    assignVendorToProject: async (data: {
        vendor_id: number
        project_id: number
        vendor_type: string
        rate?: number
        rate_unit?: string
        start_date?: string
    }) => {
        const response = await api.post('/project-vendors', data)
        return response.data
    },

    // Get project vendors
    getProjectVendors: async (projectId: number) => {
        const response = await api.get(`/projects/${projectId}/vendors`)
        return response.data
    },
}

