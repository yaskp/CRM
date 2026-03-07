import api from './auth'

export const userService = {
    getUsers: async (params?: {
        search?: string
        role?: string
        page?: number
        limit?: number
    }) => {
        const response = await api.get('/users', { params })
        return response.data
    },

    getUser: async (id: number) => {
        const response = await api.get(`/users/${id}`)
        return response.data
    },

    createUser: async (data: any) => {
        const response = await api.post('/users', data)
        return response.data
    },

    updateUser: async (id: number, data: any) => {
        const response = await api.put(`/users/${id}`, data)
        return response.data
    },

    deleteUser: async (id: number) => {
        const response = await api.delete(`/users/${id}`)
        return response.data
    },

    resetPassword: async (id: number, data: { newPassword: string }) => {
        const response = await api.post(`/users/${id}/reset-password`, data)
        return response.data
    },

    changePassword: async (data: { currentPassword: string; newPassword: string }) => {
        const response = await api.post('/users/change-password', data)
        return response.data
    },
}
