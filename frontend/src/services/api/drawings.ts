import api from './auth'

export interface CreateDrawingRequest {
  project_id: number
  drawing_number?: string
  drawing_name?: string
  drawing_type?: string
  description?: string
}

export interface MarkPanelRequest {
  panel_identifier: string
  coordinates_json?: any
  panel_type?: string
  length?: number
  width?: number
  design_depth?: number
  top_rl?: number
  bottom_rl?: number
  reinforcement_ton?: number
  no_of_anchors?: number
  anchor_length?: number
  anchor_capacity?: number
  concrete_design_qty?: number
  grabbing_qty?: number
  stop_end_area?: number
  guide_wall_rm?: number
  ramming_qty?: number
  anchor_layers?: {
    layer_name?: string
    no_of_anchors?: number
    anchor_length?: number
    anchor_capacity?: number
  }[]
}

export interface UpdatePanelProgressRequest {
  progress_date: string
  progress_percentage?: number
  status: 'not_started' | 'in_progress' | 'completed'
  work_stage?: string
  remarks?: string
}

export const drawingService = {
  uploadDrawing: async (data: CreateDrawingRequest, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString())
      }
    })

    const response = await api.post('/drawings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getDrawings: async (params?: {
    project_id?: number
    drawing_type?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/drawings', { params })
    return response.data
  },

  getDrawing: async (id: number) => {
    const response = await api.get(`/drawings/${id}`)
    return response.data
  },

  markPanel: async (drawingId: number, data: MarkPanelRequest) => {
    const response = await api.post(`/drawings/${drawingId}/panels`, data)
    return response.data
  },

  bulkCreatePanels: async (drawingId: number, panels: any[]) => {
    const response = await api.post(`/drawings/${drawingId}/panels/bulk`, { panels })
    return response.data
  },

  getPanels: async (drawingId: number) => {
    const response = await api.get(`/drawings/${drawingId}/panels`)
    return response.data
  },

  updatePanelProgress: async (panelId: number, data: UpdatePanelProgressRequest) => {
    const response = await api.put(`/drawings/panels/${panelId}/progress`, data)
    return response.data
  },

  updatePanel: async (panelId: number, data: Partial<MarkPanelRequest>) => {
    const response = await api.put(`/drawings/panels/${panelId}`, data)
    return response.data
  },

  bulkUpdatePanels: async (panelIds: number[], updates: Partial<MarkPanelRequest>) => {
    const response = await api.put(`/drawings/panels/bulk`, { panelIds, updates })
    return response.data
  },

  deletePanel: async (panelId: number) => {
    const response = await api.delete(`/drawings/panels/${panelId}`)
    return response.data
  },

  bulkDeletePanels: async (panelIds: number[]) => {
    const response = await api.delete('/drawings/panels/bulk', { data: { panelIds } })
    return response.data
  },
}

