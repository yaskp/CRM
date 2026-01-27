import { sequelize } from './src/database/connection'
import { Project, ProjectBuilding, ProjectFloor, ProjectZone, WorkItemType, ProjectBOQ, ProjectBOQItem } from './src/models'

const run = async () => {
    try {
        const projectId = 3

        console.log('--- PROJECT ---')
        const proj = await Project.findByPk(projectId)
        console.log(proj?.toJSON())

        console.log('\n--- BUILDINGS (L1) ---')
        const buildings = await ProjectBuilding.findAll({ where: { project_id: projectId } })
        console.log(JSON.stringify(buildings, null, 2))

        if (buildings.length > 0) {
            console.log('\n--- FLOORS (L2) for first building ---')
            const floors = await ProjectFloor.findAll({ where: { building_id: buildings[0].id } })
            console.log(JSON.stringify(floors, null, 2))
        }

        console.log('\n--- WORK ITEM TYPES ---')
        const wits = await WorkItemType.findAll()
        console.log(JSON.stringify(wits.map(w => ({ id: w.id, name: w.name })), null, 2))

        console.log('\n--- BOQ ---')
        const boq = await ProjectBOQ.findOne({
            where: { project_id: projectId, status: 'approved' },
            include: [{ model: ProjectBOQItem, as: 'items' }]
        })
        if (boq) {
            console.log('BOQ Found:', boq.title)
            console.log('Items:', boq.items?.length)
            console.log('Work Types in BOQ:', [...new Set(boq.items?.map((i: any) => i.work_item_type_id))])
        } else {
            console.log('No Approved BOQ found')
        }

    } catch (e) {
        console.error(e)
    } finally {
        await sequelize.close()
    }
}

run()
