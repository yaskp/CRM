import Project from '../models/Project'
import { Op } from 'sequelize'

export const generateProjectCode = async (): Promise<string> => {
  const year = new Date().getFullYear()
  const prefix = `PRJ-${year}-`

  // Find the latest project code for this year
  const latestProject = await Project.findOne({
    where: {
      project_code: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['project_code', 'DESC']],
  })

  let sequence = 1
  if (latestProject) {
    const lastCode = latestProject.project_code
    const lastSequence = parseInt(lastCode.split('-')[2]) || 0
    sequence = lastSequence + 1
  }

  // Format: PRJ-2024-001
  const code = `${prefix}${sequence.toString().padStart(3, '0')}`
  return code
}

