import api from './axios'

export interface ProjectBuilding {
    id: number
    project_id: number
    name: string
    building_code?: string
    description?: string
    floors?: ProjectFloor[]
}

export interface ProjectFloor {
    id: number
    building_id: number
    name: string
    floor_number?: number
    floor_type: 'basement' | 'ground' | 'parking' | 'typical' | 'terrace'
    zones?: ProjectZone[]
}

export interface ProjectZone {
    id: number
    floor_id: number
    name: string
    zone_type: 'flat' | 'office' | 'shop' | 'common_area' | 'parking_slot' | 'other'
    area_sqft?: number
}

export const projectHierarchyService = {
    getHierarchy: async (projectId: number) => {
        const response = await api.get(`/project-hierarchy/${projectId}`)
        return response.data
    },

    getBuildings: async (projectId?: number) => {
        const response = await api.get('/project-hierarchy/buildings', { params: { project_id: projectId } })
        return response.data
    },

    createBuilding: async (data: Partial<ProjectBuilding>) => {
        const response = await api.post('/project-hierarchy/buildings', data)
        return response.data
    },

    getFloors: async (buildingId?: number) => {
        const response = await api.get('/project-hierarchy/floors', { params: { building_id: buildingId } })
        return response.data
    },

    createFloor: async (data: Partial<ProjectFloor>) => {
        const response = await api.post('/project-hierarchy/floors', data)
        return response.data
    },

    getZones: async (floorId?: number) => {
        const response = await api.get('/project-hierarchy/zones', { params: { floor_id: floorId } })
        return response.data
    },

    createZone: async (data: Partial<ProjectZone>) => {
        const response = await api.post('/project-hierarchy/zones', data)
        return response.data
    }
}
