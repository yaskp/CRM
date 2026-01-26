import api from './auth'

export interface GRNItem {
  material_id: number
  quantity: number
  unit_price?: number
  batch_number?: string
  expiry_date?: string
}

export interface STNItem {
  material_id: number
  quantity: number
  batch_number?: string
}

export interface SRNItem {
  material_id: number
  quantity: number
  batch_number?: string
  remarks?: string
}

export interface CreateGRNRequest {
  warehouse_id?: number
  destination_type?: 'warehouse' | 'project'
  destination_id?: number

  received_from_type?: string
  received_from_id?: number
  reference_number?: string
  po_id?: number

  transaction_date: string
  items: GRNItem[]
  remarks?: string
  truck_number?: string
  driver_name?: string
  driver_phone?: string
  cgst_amount?: number
  sgst_amount?: number
  igst_amount?: number
}

export interface CreateSTNRequest {
  warehouse_id?: number // Legacy support
  to_warehouse_id?: number // Legacy support
  from_type?: 'warehouse' | 'project'
  to_type?: 'warehouse' | 'project'
  from_id?: number
  to_id?: number
  transaction_date: string
  items: STNItem[]
  remarks?: string
}

export interface CreateSRNRequest {
  warehouse_id?: number
  project_id?: number

  source_type?: 'project' | 'warehouse'
  destination_type?: 'warehouse' | 'vendor'
  source_id?: number
  destination_id?: number
  purchase_order_id?: number | null

  transaction_date: string
  items: SRNItem[]
  remarks?: string
}

export const storeTransactionService = {
  // GRN
  createGRN: async (data: CreateGRNRequest) => {
    const response = await api.post('/store/grn', data)
    return response.data
  },

  // STN
  createSTN: async (data: CreateSTNRequest) => {
    const response = await api.post('/store/stn', data)
    return response.data
  },

  // SRN
  createSRN: async (data: CreateSRNRequest) => {
    const response = await api.post('/store/srn', data)
    return response.data
  },

  // CONSUMPTION
  createConsumption: async (data: any) => {
    const response = await api.post('/store/consumption', data)
    return response.data
  },

  // Get all transactions
  getTransactions: async (params?: {
    type?: 'GRN' | 'STN' | 'SRN' | 'CONSUMPTION'
    status?: 'draft' | 'approved' | 'rejected'
    warehouse_id?: number
    page?: number
    limit?: number
    search?: string
  }) => {
    const response = await api.get('/store', { params })
    return response.data
  },

  // Get transaction by ID
  getTransaction: async (id: number) => {
    const response = await api.get(`/store/${id}`)
    return response.data
  },

  // Approve transaction
  approveTransaction: async (id: number) => {
    const response = await api.put(`/store/${id}/approve`)
    return response.data
  },

  // Reject transaction
  rejectTransaction: async (id: number, remarks?: string) => {
    const response = await api.put(`/store/${id}/reject`, { remarks })
    return response.data
  },
  getWorkerCategories: async () => {
    const response = await api.get('/store/worker-categories')
    return response.data
  },
}

