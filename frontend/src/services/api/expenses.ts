import api from './auth'

export interface CreateExpenseRequest {
  project_id: number
  expense_type: 'conveyance' | 'loose_purchase' | 'food' | 'two_wheeler' | 'other'
  amount: number
  description: string
  expense_date: string
  bill_type?: 'kaccha_bill' | 'pakka_bill' | 'petrol_bill' | 'ola_uber_screenshot' | 'not_required'
  input_method?: 'auto' | 'manual'
}

export const expenseService = {
  createExpense: async (data: CreateExpenseRequest, billFile?: File, selfieFile?: File) => {
    const formData = new FormData()
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString())
      }
    })

    if (billFile) {
      formData.append('bill', billFile)
    }

    if (selfieFile) {
      formData.append('selfie', selfieFile)
    }

    const response = await api.post('/expenses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getExpenses: async (params?: {
    project_id?: number
    status?: string
    expense_type?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/expenses', { params })
    return response.data
  },

  getExpense: async (id: number) => {
    const response = await api.get(`/expenses/${id}`)
    return response.data
  },

  approveExpense: async (id: number, level: number, comments?: string) => {
    const response = await api.put(`/expenses/${id}/approve`, { level, comments })
    return response.data
  },

  rejectExpense: async (id: number, comments?: string) => {
    const response = await api.put(`/expenses/${id}/reject`, { comments })
    return response.data
  },

  getPendingApprovals: async () => {
    const response = await api.get('/expenses/pending-approvals')
    return response.data
  },
}

