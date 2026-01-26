import { Request, Response } from 'express'
import Annexure from '../models/Annexure'

export const annexureController = {
    // Get all active annexures
    getAnnexures: async (_req: Request, res: Response) => {
        try {
            const annexures = await Annexure.findAll({
                where: { is_active: true },
                order: [['created_at', 'DESC']]
            })

            const formattedAnnexures = annexures.map(ann => {
                const plain = ann.toJSON() as any;
                let category_name = 'General Terms';
                switch (plain.type) {
                    case 'contractor_scope': category_name = 'VHSHRI Scope'; break;
                    case 'client_scope': category_name = 'Client Scope'; break;
                    case 'payment_terms': category_name = 'Payment Terms'; break;
                    case 'general_terms': category_name = 'Terms & Conditions'; break;
                    case 'purchase_order': category_name = 'Purchase Order Terms'; break;
                }
                return { ...plain, category_name };
            });

            res.json({ annexures: formattedAnnexures })
        } catch (error) {
            console.error('Error fetching annexures:', error)
            res.status(500).json({ message: 'Internal server error' })
        }
    },

    // Get single annexure
    getAnnexure: async (req: Request, res: Response) => {
        try {
            const { id } = req.params
            const annexure = await Annexure.findByPk(id)

            if (!annexure) {
                return res.status(404).json({ message: 'Annexure not found' })
            }

            res.json({ annexure })
        } catch (error) {
            console.error('Error fetching annexure:', error)
            res.status(500).json({ message: 'Internal server error' })
        }
    },

    // Create new annexure
    createAnnexure: async (req: Request, res: Response) => {
        try {
            const {
                name, description, clauses, type, client_scope, contractor_scope,
                payment_terms, delivery_terms, quality_terms, warranty_terms, penalty_clause
            } = req.body

            const annexure = await Annexure.create({
                name,
                description,
                clauses,
                clauses,
                type: ['client_scope', 'contractor_scope', 'payment_terms', 'general_terms', 'purchase_order'].includes(type) ? type : 'general_terms',
                client_scope,
                contractor_scope,
                payment_terms,
                delivery_terms,
                quality_terms,
                warranty_terms,
                penalty_clause,
                is_active: true
            })

            res.status(201).json({ annexure, message: 'Annexure created successfully' })
        } catch (error) {
            console.error('Error creating annexure:', error)
            res.status(500).json({ message: 'Internal server error' })
        }
    },

    // Update annexure
    updateAnnexure: async (req: Request, res: Response) => {
        try {
            const { id } = req.params
            const {
                name, description, clauses, type, client_scope, contractor_scope,
                payment_terms, delivery_terms, quality_terms, warranty_terms, penalty_clause
            } = req.body

            const annexure = await Annexure.findByPk(id)

            if (!annexure) {
                return res.status(404).json({ message: 'Annexure not found' })
            }

            await annexure.update({
                name,
                description,
                clauses,
                type,
                client_scope,
                contractor_scope,
                payment_terms,
                delivery_terms,
                quality_terms,
                warranty_terms,
                penalty_clause
            })

            res.json({ annexure, message: 'Annexure updated successfully' })
        } catch (error) {
            console.error('Error updating annexure:', error)
            res.status(500).json({ message: 'Internal server error' })
        }
    },

    // Delete annexure (soft delete)
    deleteAnnexure: async (req: Request, res: Response) => {
        try {
            const { id } = req.params
            const annexure = await Annexure.findByPk(id)

            if (!annexure) {
                return res.status(404).json({ message: 'Annexure not found' })
            }

            await annexure.update({ is_active: false })

            res.json({ message: 'Annexure deleted successfully' })
        } catch (error) {
            console.error('Error deleting annexure:', error)
            res.status(500).json({ message: 'Internal server error' })
        }
    }
}
