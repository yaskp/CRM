import api from './auth'

export interface CreateBarBendingScheduleRequest {
  project_id: number
  panel_number?: string
  schedule_number?: string
  drawing_reference?: string
  steel_quantity_kg?: number
}

export interface UpdateBarBendingScheduleRequest {
  panel_number?: string
  schedule_number?: string
  drawing_reference?: string
  steel_quantity_kg?: number
  status?: 'draft' | 'approved' | 'in_progress' | 'completed'
}

export const barBendingScheduleService = {
  getBarBendingSchedules: async (params?: {
    project_id?: number
    status?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/bar-bending-schedules', { params })
    return response.data
  },

  getBarBendingSchedule: async (id: number) => {
    const response = await api.get(`/bar-bending-schedules/${id}`)
    return response.data
  },

  createBarBendingSchedule: async (data: CreateBarBendingScheduleRequest) => {
    const response = await api.post('/bar-bending-schedules', data)
    return response.data
  },

  updateBarBendingSchedule: async (id: number, data: UpdateBarBendingScheduleRequest) => {
    const response = await api.put(`/bar-bending-schedules/${id}`, data)
    return response.data
  },

  getBarBendingSchedulesByProject: async (projectId: number) => {
    const response = await api.get(`/bar-bending-schedules/project/${projectId}`)
    return response.data
  },

  getDrawingPanelsForProject: async (projectId: number) => {
    const response = await api.get(`/bar-bending-schedules/project/${projectId}/panels`)
    return response.data
  },
}

