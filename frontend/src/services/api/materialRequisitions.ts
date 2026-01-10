import api from './auth'

export interface MaterialRequisition {
    id: number
    requisition_number: string
    project_id: number
    requested_by: number
    requisition_date: string
    required_date: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    status: 'draft' | 'pending' | 'approved' | 'partially_approved' | 'rejected' | 'cancelled'
    purpose: string
    remarks?: string
    approved_by?: number
    approved_at?: string
    rejection_reason?: string
    project?: any
    requester?: any
    approver?: any
    items?: MaterialRequisitionItem[]
}

export interface MaterialRequisitionItem {
    id?: number
    requisition_id?: number
    material_id: number
    requested_quantity: number
    approved_quantity?: number
    unit: string
    estimated_rate?: number
    estimated_amount?: number
    specification?: string
    remarks?: string
    status?: string
    material?: any
}

export const materialRequisitionService = {
    // Get all requisitions
    getRequisitions: async (params?: {
        project_id?: number
        status?: string
        priority?: string
        from_date?: string
        to_date?: string
    }) => {
        const response = await api.get('/requisitions', { params })
        return response.data
    },

    // Get requisition by ID
    getRequisitionById: async (id: number) => {
        const response = await api.get(`/requisitions/${id}`)
        return response.data
    },

    // Create requisition
    createRequisition: async (data: {
        project_id: number
        from_warehouse_id: number
        required_date?: string
        items: Array<{
            material_id: number
            requested_quantity: number
            unit: string
        }>
    }) => {
        const response = await api.post('/requisitions', data)
        return response.data
    },

    // Update requisition
    updateRequisition: async (id: number, data: any) => {
        const response = await api.put(`/requisitions/${id}`, data)
        return response.data
    },

    // Approve/Reject requisition
    approveRequisition: async (id: number, data: {
        action: 'approve' | 'reject'
        rejection_reason?: string
        items?: any[]
    }) => {
        const response = await api.post(`/requisitions/${id}/approve`, data)
        return response.data
    },

    // Cancel requisition
    cancelRequisition: async (id: number) => {
        const response = await api.post(`/requisitions/${id}/cancel`)
        return response.data
    },
}

export default materialRequisitionService
