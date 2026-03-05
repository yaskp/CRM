
import { Request, Response, NextFunction } from 'express';
import WorkTemplate from '../models/WorkTemplate';
import WorkTemplateItem from '../models/WorkTemplateItem';
import WorkItemType from '../models/WorkItemType';
import { createError } from '../middleware/errorHandler';
import { sequelize } from '../database/connection';

import { getPagination, getPaginationData } from '../utils/pagination';
import { Op } from 'sequelize';

export const getWorkTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search, page, limit } = req.query;
        const { limit: l, offset, page: p } = getPagination({ page: page as any, limit: limit as any });

        const where: any = {};
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows: templates } = await WorkTemplate.findAndCountAll({
            where,
            include: [
                {
                    model: WorkTemplateItem,
                    as: 'items',
                    include: [{ model: WorkItemType, as: 'workItemType' }]
                },
                { model: WorkItemType, as: 'primaryWorkItemType' },
                { model: WorkItemType, as: 'subWorkItemType' }
            ],
            distinct: true,
            limit: l,
            offset,
            order: [['name', 'ASC']]
        });

        res.json({
            success: true,
            templates,
            pagination: getPaginationData(count, p, l)
        });
    } catch (error) {
        next(error);
    }
};

export const getWorkTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const template = await WorkTemplate.findByPk(id, {
            include: [
                {
                    model: WorkTemplateItem,
                    as: 'items',
                    include: [{ model: WorkItemType, as: 'workItemType' }]
                },
                { model: WorkItemType, as: 'primaryWorkItemType' },
                { model: WorkItemType, as: 'subWorkItemType' }
            ],
            order: [[{ model: WorkTemplateItem, as: 'items' }, 'sort_order', 'ASC']]
        });
        if (!template) throw createError('Template not found', 404);
        res.json({ success: true, template });
    } catch (error) {
        next(error);
    }
};

export const createWorkTemplate = async (req: Request, res: Response, next: NextFunction) => {
    const t = await sequelize.transaction();
    try {
        const { name, description, primary_work_item_type_id, sub_work_item_type_id, items } = req.body;
        const template = await WorkTemplate.create({
            name,
            description,
            primary_work_item_type_id,
            sub_work_item_type_id
        }, { transaction: t });

        if (items && Array.isArray(items)) {
            const templateItems = items.map((item: any, index: number) => ({
                template_id: template.id,
                work_item_type_id: item.work_item_type_id,
                parent_work_item_type_id: item.parent_work_item_type_id,
                item_type: item.item_type || 'labour',
                description: item.description,
                unit: item.unit,
                sort_order: item.sort_order || index
            }));
            await WorkTemplateItem.bulkCreate(templateItems, { transaction: t });
        }

        await t.commit();
        res.status(201).json({ success: true, template });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

export const updateWorkTemplate = async (req: Request, res: Response, next: NextFunction) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { name, description, primary_work_item_type_id, sub_work_item_type_id, items, is_active } = req.body;

        const template = await WorkTemplate.findByPk(id);
        if (!template) throw createError('Template not found', 404);

        await template.update({
            name,
            description,
            primary_work_item_type_id,
            sub_work_item_type_id,
            is_active
        }, { transaction: t });

        if (items && Array.isArray(items)) {
            // Re-sync items: simplicity -> delete and recreate
            await WorkTemplateItem.destroy({ where: { template_id: id }, transaction: t });

            const templateItems = items.map((item: any, index: number) => ({
                template_id: Number(id),
                work_item_type_id: item.work_item_type_id,
                parent_work_item_type_id: item.parent_work_item_type_id,
                item_type: item.item_type || 'labour',
                description: item.description,
                unit: item.unit,
                sort_order: item.sort_order || index
            }));
            await WorkTemplateItem.bulkCreate(templateItems, { transaction: t });
        }

        await t.commit();
        res.json({ success: true, template });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

export const importWorkTemplates = async (req: Request, res: Response, next: NextFunction) => {
    const t = await sequelize.transaction();
    try {
        const { items } = req.body; // Expecting flat list of rows

        if (!Array.isArray(items) || items.length === 0) {
            throw createError('No data provided for import', 400);
        }

        const stats = {
            created: 0,
            updated: 0,
            itemsAdded: 0,
            errors: [] as any[]
        };

        // Group by Template Name to handle multiple items per template
        const groupedMap = new Map<string, any[]>();

        for (const row of items) {
            if (!row.name) continue; // Skip if no template name
            const key = row.name.trim();
            if (!groupedMap.has(key)) {
                groupedMap.set(key, []);
            }
            groupedMap.get(key)!.push(row);
        }

        for (const [templateName, rows] of groupedMap) {
            try {
                // Check if template exists
                let template = await WorkTemplate.findOne({ where: { name: templateName }, transaction: t });
                let description = rows[0].description || '';

                if (!template) {
                    template = await WorkTemplate.create({
                        name: templateName,
                        description: description,
                        is_active: true
                    }, { transaction: t });
                    stats.created++;
                } else {
                    stats.updated++;
                }

                // Process Items
                for (const [index, row] of rows.entries()) {
                    if (row.work_item_code) {
                        const workItemType = await WorkItemType.findOne({
                            where: { code: row.work_item_code },
                            transaction: t
                        });

                        if (workItemType) {
                            await WorkTemplateItem.create({
                                template_id: template.id,
                                work_item_type_id: workItemType.id,
                                item_type: (row.item_type || 'labour').toLowerCase(),
                                description: row.item_description || workItemType.name,
                                unit: row.item_unit || workItemType.uom,
                                sort_order: index
                            }, { transaction: t });
                            stats.itemsAdded++;
                        }
                    }
                }

            } catch (err: any) {
                stats.errors.push({ name: templateName, error: err.message });
            }
        }

        await t.commit();
        res.json({
            success: true,
            message: `Import completed. Created ${stats.created} templates, updated ${stats.updated}, added ${stats.itemsAdded} items.`,
            stats
        });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};
