import api from './axios'

export interface BudgetHead {
    id: number
    name: string
    code: string
    type: 'group' | 'item'
    parent_id?: number
}

export interface ProjectBudget {
    id: number
    project_id: number
    budget_head_id: number
    estimated_amount: number
    head?: BudgetHead
}

export interface BudgetAnalysis {
    head: BudgetHead
    estimated_amount: number
    spent_amount: number
    variance: number
    utilization: number
}

export const budgetService = {
    getBudgetHeads: async () => {
        const response = await api.get('/budgets/heads')
        return response.data
    },

    createBudgetHead: async (data: Partial<BudgetHead>) => {
        const response = await api.post('/budgets/heads', data)
        return response.data
    },

    getProjectBudget: async (projectId: number) => {
        const response = await api.get(`/budgets/projects/${projectId}`)
        return response.data
    },

    updateProjectBudget: async (projectId: number, budgets: { budget_head_id: number, estimated_amount: number }[]) => {
        const response = await api.post(`/budgets/projects/${projectId}`, { budgets })
        return response.data
    },

    getBudgetAnalysis: async (projectId: number) => {
        const response = await api.get(`/budgets/projects/${projectId}/analysis`)
        return response.data
    }
}
