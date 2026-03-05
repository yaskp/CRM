import { Request, Response } from 'express'
import Annexure from '../models/Annexure'
import { Op } from 'sequelize'
import { getPagination, getPaginationData } from '../utils/pagination'

export const annexureController = {
    // Get all active annexures
    getAnnexures: async (req: Request, res: Response) => {
        try {
            const { search, page, limit } = req.query;
            const { limit: l, offset, page: p } = getPagination({ page: page as any, limit: limit as any });

            const where: any = { is_active: true };
            if (search) {
                where[Op.or] = [
                    { name: { [Op.like]: `%${search}%` } },
                    { description: { [Op.like]: `%${search}%` } },
                    { type: { [Op.like]: `%${search}%` } }
                ];
            }

            const { count, rows: annexures } = await Annexure.findAndCountAll({
                where,
                limit: l,
                offset,
                order: [['created_at', 'DESC']]
            });

            const formattedAnnexures = annexures.map(ann => {
                const plain = ann.toJSON() as any;
                let category_name = 'General Terms';
                switch (plain.type) {
                    case 'contractor_scope': category_name = 'VHSHRI Scope'; break;
                    case 'client_scope': category_name = 'Client Scope'; break;
                    case 'payment_terms': category_name = 'Payment Terms'; break;
                    case 'general_terms': category_name = 'Terms & Conditions'; break;
                    case 'purchase_order': category_name = 'Purchase Order Terms'; break;
                    case 'scope_matrix': category_name = 'Scope Matrix'; break;
                }
                return { ...plain, category_name };
            });

            res.json({
                success: true,
                annexures: formattedAnnexures,
                pagination: getPaginationData(count, p, l)
            });
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
                res.status(404).json({ message: 'Annexure not found' })
                return
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
                name, description, clauses, type, client_scope, contractor_scope, scope_matrix,
                payment_terms, delivery_terms, quality_terms, warranty_terms, penalty_clause
            } = req.body

            const annexure = await Annexure.create({
                name,
                description,
                clauses,
                type: ['client_scope', 'contractor_scope', 'payment_terms', 'general_terms', 'purchase_order', 'scope_matrix'].includes(type) ? type : 'general_terms',
                client_scope,
                contractor_scope,
                scope_matrix,
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
                name, description, clauses, type, client_scope, contractor_scope, scope_matrix,
                payment_terms, delivery_terms, quality_terms, warranty_terms, penalty_clause
            } = req.body
            const annexure = await Annexure.findByPk(id)

            if (!annexure) {
                res.status(404).json({ message: 'Annexure not found' })
                return
            }

            await annexure.update({
                name,
                description,
                clauses,
                type,
                client_scope,
                contractor_scope,
                scope_matrix,
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
                res.status(404).json({ message: 'Annexure not found' })
                return
            }

            await annexure.update({ is_active: false })

            res.json({ message: 'Annexure deleted successfully' })
        } catch (error) {
            console.error('Error deleting annexure:', error)
            res.status(500).json({ message: 'Internal server error' })
        }
    },

    importAnnexures: async (req: Request, res: Response) => {
        try {
            const { items } = req.body;

            if (!Array.isArray(items) || items.length === 0) {
                res.status(400).json({ message: 'No items provided for import' });
                return;
            }

            const results = {
                success: [] as any[],
                updated: [] as any[],
                errors: [] as any[]
            };

            for (const item of items) {
                try {
                    const { name, type, clauses, description } = item;

                    if (!name) throw new Error('Name is required');

                    // Parse clauses safely
                    let parsedClauses: string[] = [];
                    if (typeof clauses === 'string') {
                        // Split by newline or pipe, handling potential wrapping quotes
                        parsedClauses = clauses.split(/[\n|]/).map((c: string) => c.trim()).filter((c: string) => c.length > 0);
                    } else if (Array.isArray(clauses)) {
                        parsedClauses = clauses;
                    }

                    // Check if exists
                    const existingAnnexure = await Annexure.findOne({ where: { name } });

                    // Map generic names to DB enums
                    const typeMap: any = {
                        'vhshri scope': 'contractor_scope',
                        'contractor scope': 'contractor_scope',
                        'client scope': 'client_scope',
                        'payment terms': 'payment_terms',
                        'terms & conditions': 'general_terms',
                        'general terms': 'general_terms',
                        'purchase order': 'purchase_order',
                        'purchase order terms': 'purchase_order'
                    };
                    const normalizedType = type ? typeMap[type.toLowerCase().trim()] || type : 'general_terms';

                    if (existingAnnexure) {
                        // Update existing
                        // Merge clauses: combine existing + new, remove duplicates
                        const existingClauses = existingAnnexure.clauses || [];
                        const mergedClauses = [...new Set([...existingClauses, ...parsedClauses])];

                        await existingAnnexure.update({
                            description: description || existingAnnexure.description,
                            type: normalizedType,
                            clauses: mergedClauses,
                            is_active: true // Reactivate if it was deleted
                        });
                        results.updated.push(existingAnnexure);
                    } else {
                        // Create new
                        const annexure = await Annexure.create({
                            name,
                            description,
                            type: normalizedType,
                            clauses: parsedClauses,
                            is_active: true
                        });
                        results.success.push(annexure);
                    }

                } catch (error: any) {
                    results.errors.push({ item, error: error.message });
                }
            }

            res.json({
                success: true,
                message: `Import completed: ${results.success.length} created, ${results.updated.length} updated, ${results.errors.length} failed`,
                data: results
            });
        } catch (error) {
            console.error('Error importing annexures:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
