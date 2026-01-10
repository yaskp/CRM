import api from './auth'

export interface CreateEquipmentRequest {
  equipment_code: string
  name: string
  equipment_type: 'crane' | 'jcb' | 'rig' | 'grabbing_rig' | 'steel_bending_machine' | 'steel_cutting_machine' | 'water_tank' | 'pump' | 'other'
  manufacturer?: string
  model?: string
  registration_number?: string
  is_rental: boolean
  owner_vendor_id?: number
}

export interface CreateRentalRequest {
  project_id: number
  equipment_id: number
  vendor_id: number
  start_date: string
  end_date?: string
  rate_per_day?: number
  rate_per_sq_meter?: number
}

export interface CreateBreakdownRequest {
  rental_id: number
  breakdown_date: string
  breakdown_time?: string
  resolution_date?: string
  resolution_time?: string
  breakdown_reason?: string
}

export const equipmentService = {
  // Equipment Master
  createEquipment: async (data: CreateEquipmentRequest) => {
    const response = await api.post('/equipment', data)
    return response.data
  },

  getEquipment: async (params?: {
    search?: string
    equipment_type?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/equipment', { params })
    return response.data
  },

  // Rentals
  createRental: async (data: CreateRentalRequest) => {
    const response = await api.post('/equipment/rentals', data)
    return response.data
  },

  getRentals: async (params?: {
    project_id?: number
    status?: 'active' | 'completed' | 'terminated'
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/equipment/rentals', { params })
    return response.data
  },

  // Breakdowns
  reportBreakdown: async (data: CreateBreakdownRequest) => {
    const response = await api.post('/equipment/breakdowns', data)
    return response.data
  },

  getBreakdownsByRental: async (rentalId: number) => {
    const response = await api.get(`/equipment/rentals/${rentalId}/breakdowns`)
    return response.data
  },
}

