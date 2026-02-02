import axios from './axios'

export const financeService = {
    getTransactions: async (params: any) => {
        const response = await axios.get('/finance', { params })
        return response.data
    },

    getTransaction: async (id: number) => {
        const response = await axios.get(`/finance/${id}`)
        return response.data
    },

    createTransaction: async (data: any) => {
        const response = await axios.post('/finance', data)
        return response.data
    },

    getVendorAgingReport: async () => {
        const response = await axios.get('/reports/finance/vendor-aging')
        return response.data
    }
}
