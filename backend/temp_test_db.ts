import { sequelize } from './src/database/connection'
import { WorkTemplate, WorkTemplateItem, WorkItemType } from './src/models/index'

async function check() {
    await sequelize.authenticate()

    // Check templates
    const templates = await WorkTemplate.findAll({
        include: [
            {
                model: WorkTemplateItem,
                as: 'items',
                include: [{ model: WorkItemType, as: 'workItemType' }]
            }
        ]
    })

    console.log("Templates Count:", templates.length)
    if (templates.length > 0) {
        const t1 = templates[0].toJSON()
        console.log("Template:", t1.name)
        console.log("First template items sample:", JSON.stringify(t1.items?.map((i: any) => ({
            id: i.id,
            work_item_type_id: i.work_item_type_id,
            parent_work_item_type_id: i.parent_work_item_type_id,
            workItemType_name: i.workItemType?.name,
            workItemType_parent: i.workItemType?.parent_id
        })), null, 2))
    }

    process.exit(0)
}
check()
