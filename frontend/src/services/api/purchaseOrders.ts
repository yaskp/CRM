import api from './axios'

export interface PurchaseOrder {
    id: number
    temp_number: string
    po_number?: string
    project_id?: number
    vendor_id: number
    total_amount: number
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected'
    warehouse_id?: number
    gst_type?: 'intra_state' | 'inter_state'
    cgst_amount?: number
    sgst_amount?: number
    igst_amount?: number
    company_state_code?: string
    vendor_state_code?: string
    delivery_type?: 'direct_to_site' | 'central_warehouse' | 'mixed'
    billing_unit_id?: number
    paid_amount?: number
    balance_amount?: number
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
    warehouse?: {
        id: number
        name: string
        code: string
    }
}

export interface CreatePurchaseOrderData {
    project_id?: number
    vendor_id: number
    total_amount: number
    items?: any[]
    expected_delivery_date?: string
    shipping_address?: string
    payment_terms?: string
    notes?: string
    warehouse_id?: number
    gst_type?: 'intra_state' | 'inter_state'
    delivery_type?: 'direct_to_site' | 'central_warehouse' | 'mixed'
    company_state_code?: string
    vendor_state_code?: string
    annexure_id?: number
    billing_unit_id?: number
}

export const purchaseOrderService = {
    getPurchaseOrders: async (params?: {
        vendor_id?: number;
        project_id?: number;
        status?: string;
        page?: number;
        limit?: number;
    }) => {
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
    },

    getPurchaseOrder: async (id: number) => {
        const response = await api.get(`/purchase-orders/${id}`)
        return response.data
    },

    updatePurchaseOrder: async (id: number, data: Partial<CreatePurchaseOrderData>) => {
        const response = await api.put(`/purchase-orders/${id}`, data)
        return response.data
    },

    downloadPDF: async (id: number) => {
        const response = await api.get(`/purchase-orders/${id}/pdf`, { responseType: 'blob' })
        return response.data
    },
}
