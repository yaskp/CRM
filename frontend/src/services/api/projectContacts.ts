import api from './auth'

export interface ProjectContact {
    id?: number
    project_id: number
    contact_type: 'site' | 'office' | 'decision_maker' | 'accounts'
    name: string
    phone?: string
    email?: string
    designation?: string
}

export const projectContactService = {
    getProjectContacts: async (projectId: number) => {
        const response = await api.get(`/project-contacts/${projectId}`)
        return response.data
    },

    createProjectContact: async (projectId: number, data: Partial<ProjectContact>) => {
        const response = await api.post(`/project-contacts/${projectId}`, data)
        return response.data
    },

    updateProjectContact: async (id: number, data: Partial<ProjectContact>) => {
        const response = await api.put(`/project-contacts/${id}`, data)
        return response.data
    },

    deleteProjectContact: async (id: number) => {
        const response = await api.delete(`/project-contacts/${id}`)
        return response.data
    },
}
