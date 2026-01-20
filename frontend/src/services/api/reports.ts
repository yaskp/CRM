
import axios from './axios'

export const reportsService = {
    getProjectConsumption: async (params: { project_id: number; start_date?: string; end_date?: string }) => {
        const response = await axios.get('/reports/project-consumption', { params })
        return response.data
    },
}
