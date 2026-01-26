import { Request, Response } from 'express'
import { CompanyBranch } from '../models'

export const companyBranchController = {
    getBranches: async (req: Request, res: Response) => {
        try {
            const branches = await CompanyBranch.findAll({
                where: { is_active: true },
                order: [['branch_name', 'ASC']]
            })
            res.json({ success: true, branches })
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message })
        }
    },

    createBranch: async (req: Request, res: Response) => {
        try {
            const branch = await CompanyBranch.create(req.body)
            res.status(201).json({ success: true, branch })
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message })
        }
    },

    updateBranch: async (req: Request, res: Response) => {
        try {
            const { id } = req.params
            const branch = await CompanyBranch.findByPk(id)
            if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' })

            await branch.update(req.body)
            return res.json({ success: true, branch })
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message })
        }
    },

    deleteBranch: async (req: Request, res: Response) => {
        try {
            const { id } = req.params
            const branch = await CompanyBranch.findByPk(id)
            if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' })

            await branch.update({ is_active: false })
            return res.json({ success: true, message: 'Branch deactivated' })
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message })
        }
    }
}
