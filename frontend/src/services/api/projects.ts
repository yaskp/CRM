import api from './auth'

export const projectService = {
  getProjects: async (params?: {
    status?: string
    search?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/projects', { params })
    return response.data
  },

  getProject: async (id: number) => {
    const response = await api.get(`/projects/${id}`)
    return response.data
  },

  createProject: async (data: {
    name: string
    location?: string
    city?: string
    state?: string
    client_ho_address?: string
    company_id?: number
  }) => {
    const response = await api.post('/projects', data)
    return response.data
  },

  updateProject: async (id: number, data: {
    name?: string
    location?: string
    city?: string
    state?: string
    client_ho_address?: string
    status?: string
  }) => {
    const response = await api.put(`/projects/${id}`, data)
    return response.data
  },

  deleteProject: async (id: number) => {
    const response = await api.delete(`/projects/${id}`)
    return response.data
  },

  updateProjectStatus: async (id: number, status: string) => {
    const response = await api.put(`/projects/${id}/status`, { status })
    return response.data
  },
}

