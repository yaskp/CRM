import api from './auth'

export const masterService = {
    getBranches: async () => {
        const response = await api.get('/master/branches')
        return response.data
    },

    createBranch: async (data: any) => {
        const response = await api.post('/master/branches', data)
        return response.data
    },

    updateBranch: async (id: number, data: any) => {
        const response = await api.put(`/master/branches/${id}`, data)
        return response.data
    },

    deleteBranch: async (id: number) => {
        const response = await api.delete(`/master/branches/${id}`)
        return response.data
    },

    getStates: async () => {
        const response = await api.get('/master/states')
        return response.data
    }
}
