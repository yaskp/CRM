import api from './auth'

export interface InventoryItem {
    id: number
    warehouse_id: number
    material_id: number
    quantity: number
    reserved_quantity: number
    material?: {
        id: number
        name: string
        material_code: string
        unit: string
    }
}

export interface GetInventoryParams {
    warehouse_id?: number
    project_id?: number
    search?: string
    low_stock?: boolean
    page?: number
    limit?: number
}

export const inventoryService = {
    getInventory: async (params?: GetInventoryParams) => {
        const response = await api.get('/inventory', { params })
        return response.data
    },
    getStockStatement: async (params: { warehouse_id?: number, project_id?: number, search?: string }) => {
        const response = await api.get('/inventory/statement', { params })
        return response.data
    }
}
