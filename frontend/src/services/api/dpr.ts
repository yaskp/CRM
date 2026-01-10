import api from './auth'

export interface ManpowerEntry {
  worker_type: 'steel_worker' | 'concrete_worker' | 'department_worker' | 'electrician' | 'welder'
  count: number
  hajri: '1' | '1.5' | '2'
}

export interface CreateDPRRequest {
  project_id: number
  report_date: string
  site_location?: string
  panel_number?: string
  guide_wall_running_meter?: number
  steel_quantity_kg?: number
  concrete_quantity_cubic_meter?: number
  polymer_consumption_bags?: number
  diesel_consumption_liters?: number
  weather_conditions?: string
  remarks?: string
  manpower?: ManpowerEntry[]
}

export const dprService = {
  createDPR: async (data: CreateDPRRequest) => {
    const response = await api.post('/reports/dpr', data)
    return response.data
  },

  getDPRs: async (params?: {
    project_id?: number
    start_date?: string
    end_date?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/reports/dpr', { params })
    return response.data
  },

  getDPR: async (id: number) => {
    const response = await api.get(`/reports/dpr/${id}`)
    return response.data
  },

  updateDPR: async (id: number, data: Partial<CreateDPRRequest>) => {
    const response = await api.put(`/reports/dpr/${id}`, data)
    return response.data
  },

  getDPRsByProject: async (projectId: number) => {
    const response = await api.get(`/reports/dpr/project/${projectId}`)
    return response.data
  },
}

