
import axios from './axios'

export interface WorkTemplateItem {
    id?: number
    template_id?: number
    work_item_type_id: number
    item_type: 'material' | 'labour' | 'contract'
    unit?: string
    sort_order?: number
    workItemType?: any
}

export interface WorkTemplate {
    id?: number
    name: string
    description?: string
    is_active?: boolean
    items?: WorkTemplateItem[]
}

export const workTemplateService = {
    getTemplates: async () => {
        const response = await axios.get('/work-templates')
        return response.data
    },

    getTemplate: async (id: number) => {
        const response = await axios.get(`/work-templates/${id}`)
        return response.data
    },

    createTemplate: async (data: WorkTemplate) => {
        const response = await axios.post('/work-templates', data)
        return response.data
    },

    updateTemplate: async (id: number, data: WorkTemplate) => {
        const response = await axios.put(`/work-templates/${id}`, data)
        return response.data
    }
}
