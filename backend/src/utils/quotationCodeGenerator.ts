import Quotation from '../models/Quotation'
import { Op } from 'sequelize'

export const generateQuotationNumber = async (): Promise<string> => {
  const year = new Date().getFullYear()
  const prefix = `QUO-${year}-`

  const latestQuotation = await Quotation.findOne({
    where: {
      quotation_number: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['quotation_number', 'DESC']],
  })

  let sequence = 1
  if (latestQuotation) {
    const lastCode = latestQuotation.quotation_number
    const lastSequence = parseInt(lastCode.split('-')[2]) || 0
    sequence = lastSequence + 1
  }

  return `${prefix}${sequence.toString().padStart(3, '0')}`
}

