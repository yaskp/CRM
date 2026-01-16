import api from './auth'

export const roleService = {
    getRoles: async () => {
        const response = await api.get('/roles')
        return response.data
    },

    getRole: async (id: number) => {
        const response = await api.get(`/roles/${id}`)
        return response.data
    },

    createRole: async (data: { name: string; permissions: string[] }) => {
        const response = await api.post('/roles', data)
        return response.data
    },

    updateRole: async (id: number, data: any) => {
        const response = await api.put(`/roles/${id}`, data)
        return response.data
    },

    deleteRole: async (id: number) => {
        const response = await api.delete(`/roles/${id}`)
        return response.data
    },

    getPermissions: async () => {
        const response = await api.get('/roles/permissions')
        return response.data
    },
}
