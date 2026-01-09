import WorkOrder from '../models/WorkOrder'
import { Op } from 'sequelize'

export const generateWorkOrderNumber = async (): Promise<string> => {
  const year = new Date().getFullYear()
  const prefix = `WO-${year}-`

  const latestWO = await WorkOrder.findOne({
    where: {
      work_order_number: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['work_order_number', 'DESC']],
  })

  let sequence = 1
  if (latestWO) {
    const lastCode = latestWO.work_order_number
    const lastSequence = parseInt(lastCode.split('-')[2]) || 0
    sequence = lastSequence + 1
  }

  return `${prefix}${sequence.toString().padStart(3, '0')}`
}

