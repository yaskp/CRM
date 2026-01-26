import api from './auth'

export const uploadService = {
    upload: async (file: File, folder: string = 'common') => {
        const formData = new FormData()
        formData.append('file', file)
        const response = await api.post(`/upload?folder=${folder}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return response.data
    }
}
