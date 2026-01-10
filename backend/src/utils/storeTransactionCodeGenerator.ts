import StoreTransaction from '../models/StoreTransaction'
import { Op } from 'sequelize'

export const generateTransactionNumber = async (type: 'GRN' | 'STN' | 'SRN' | 'CONSUMPTION'): Promise<string> => {
  const year = new Date().getFullYear()
  const prefix = `${type}-${year}-`

  const latestTransaction = await StoreTransaction.findOne({
    where: {
      transaction_number: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['transaction_number', 'DESC']],
  })

  let sequence = 1
  if (latestTransaction) {
    const lastCode = latestTransaction.transaction_number
    const lastSequence = parseInt(lastCode.split('-')[2]) || 0
    sequence = lastSequence + 1
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`
}

