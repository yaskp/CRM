import api from './auth'

export interface BOQItem {
    id: number
    boq_id: number
    material_id: number
    work_item_type_id?: number
    building_id?: number
    floor_id?: number
    zone_id?: number
    quantity: number
    unit?: string
    estimated_rate: number
    estimated_amount: number
    ordered_quantity: number
    consumed_quantity: number
    remarks?: string
    material?: any
    workItemType?: any
    building?: any
    floor?: any
    zone?: any
}

export interface BOQ {
    id: number
    project_id: number
    title: string
    version: number
    status: 'draft' | 'approved' | 'revised' | 'obsolete'
    total_estimated_amount: number
    created_by: number
    approved_by?: number
    approved_at?: string
    created_at: string
    items?: BOQItem[]
    creator?: any
    approver?: any
}

export const boqService = {
    createBOQ: async (data: Partial<BOQ> & { items: Partial<BOQItem>[] }) => {
        const response = await api.post('/boqs', data)
        return response.data
    },

    getProjectBOQs: async (projectId: number) => {
        const response = await api.get(`/boqs/project/${projectId}`)
        return response.data
    },

    getBOQDetails: async (id: number) => {
        const response = await api.get(`/boqs/${id}`)
        return response.data
    },

    approveBOQ: async (id: number) => {
        const response = await api.post(`/boqs/${id}/approve`)
        return response.data
    },

    syncFromQuotation: async (projectId: number) => {
        const response = await api.post(`/boqs/project/${projectId}/sync`)
        return response.data
    }
}
