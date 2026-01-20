import api from './axios'

export interface PurchaseOrder {
    id: number
    temp_number: string
    po_number?: string
    project_id: number
    vendor_id: number
    total_amount: number
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected'
    created_at: string
    project?: {
        name: string
        project_code: string
    }
    vendor?: {
        name: string
    }
    creator?: {
        name: string
    }
}

export interface CreatePurchaseOrderData {
    project_id: number
    vendor_id: number
    total_amount: number
    items?: any[]
    expected_delivery_date?: string
    shipping_address?: string
    payment_terms?: string
    notes?: string
}

export const purchaseOrderService = {
    getPurchaseOrders: async (params?: { vendor_id?: number; status?: string }) => {
        const response = await api.get('/purchase-orders', { params })
        return response.data
    },

    createPurchaseOrder: async (data: CreatePurchaseOrderData) => {
        const response = await api.post('/purchase-orders', data)
        return response.data
    },

    approvePurchaseOrder: async (id: number) => {
        const response = await api.post(`/purchase-orders/${id}/approve`)
        return response.data
    },

    rejectPurchaseOrder: async (id: number) => {
        const response = await api.post(`/purchase-orders/${id}/reject`)
        return response.data
    }
}
