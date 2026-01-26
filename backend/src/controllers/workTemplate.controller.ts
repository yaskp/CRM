
import { Request, Response, NextFunction } from 'express';
import WorkTemplate from '../models/WorkTemplate';
import WorkTemplateItem from '../models/WorkTemplateItem';
import WorkItemType from '../models/WorkItemType';
import { createError } from '../middleware/errorHandler';
import { sequelize } from '../database/connection';

export const getWorkTemplates = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const templates = await WorkTemplate.findAll({
            include: [
                {
                    model: WorkTemplateItem,
                    as: 'items',
                    include: [{ model: WorkItemType, as: 'workItemType' }]
                }
            ],
            order: [[{ model: WorkTemplateItem, as: 'items' }, 'sort_order', 'ASC']]
        });
        res.json({ success: true, templates });
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
                }
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
        const { name, description, items } = req.body;

        const template = await WorkTemplate.create({ name, description }, { transaction: t });

        if (items && Array.isArray(items)) {
            const templateItems = items.map((item: any, index: number) => ({
                template_id: template.id,
                work_item_type_id: item.work_item_type_id,
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
        const { name, description, items, is_active } = req.body;

        const template = await WorkTemplate.findByPk(id);
        if (!template) throw createError('Template not found', 404);

        await template.update({ name, description, is_active }, { transaction: t });

        if (items && Array.isArray(items)) {
            // Re-sync items: simplicity -> delete and recreate
            await WorkTemplateItem.destroy({ where: { template_id: id }, transaction: t });

            const templateItems = items.map((item: any, index: number) => ({
                template_id: Number(id),
                work_item_type_id: item.work_item_type_id,
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
