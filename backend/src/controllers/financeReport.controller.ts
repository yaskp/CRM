import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import PurchaseOrder from '../models/PurchaseOrder'
import WorkOrder from '../models/WorkOrder'
import Vendor from '../models/Vendor'
import PaymentAllocation from '../models/PaymentAllocation'
import Project from '../models/Project'
import { Op } from 'sequelize'

export const getVendorAgingReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const vendors = await Vendor.findAll({
            attributes: ['id', 'name'],
            include: [
                {
                    model: PurchaseOrder,
                    as: 'purchaseOrders',
                    attributes: ['id', 'po_number', 'total_amount', 'created_at', 'status'],
                    where: { status: 'approved' },
                    required: false,
                    include: [
                        { model: Project, as: 'project', attributes: ['id', 'name'] },
                        { model: PaymentAllocation, as: 'paymentAllocations', attributes: ['allocated_amount', 'tds_allocated', 'retention_allocated'] }
                    ]
                },
                {
                    model: WorkOrder,
                    as: 'workOrders',
                    attributes: ['id', 'work_order_number', 'final_amount', 'total_amount', 'created_at', 'status'],
                    where: { status: { [Op.in]: ['approved', 'active', 'completed'] } },
                    required: false,
                    include: [
                        { model: Project, as: 'project', attributes: ['id', 'name'] },
                        { model: PaymentAllocation, as: 'paymentAllocations', attributes: ['allocated_amount', 'tds_allocated', 'retention_allocated'] }
                    ]
                }
            ]
        })

        const report = vendors.map(vendor => {
            let totalAmount = 0
            let totalPaid = 0
            const orders: any[] = []

                // Process POs
                ; (vendor as any).purchaseOrders?.forEach((po: any) => {
                    const settled = po.paymentAllocations?.reduce((sum: number, a: any) =>
                        sum + Number(a.allocated_amount || 0) + Number(a.tds_allocated || 0) + Number(a.retention_allocated || 0), 0) || 0

                    const amount = Number(po.total_amount)
                    totalAmount += amount
                    totalPaid += settled

                    if (amount - settled > 1) { // Only show if substantial balance
                        orders.push({
                            type: 'PO',
                            id: po.id,
                            number: po.po_number,
                            date: po.created_at,
                            project: po.project?.name,
                            total: amount,
                            paid: settled,
                            balance: amount - settled,
                            days: Math.floor((new Date().getTime() - new Date(po.created_at).getTime()) / (1000 * 60 * 60 * 24))
                        })
                    }
                })

                // Process WOs
                ; (vendor as any).workOrders?.forEach((wo: any) => {
                    const settled = wo.paymentAllocations?.reduce((sum: number, a: any) =>
                        sum + Number(a.allocated_amount || 0) + Number(a.tds_allocated || 0) + Number(a.retention_allocated || 0), 0) || 0

                    const amount = Number(wo.final_amount || wo.total_amount)
                    totalAmount += amount
                    totalPaid += settled

                    if (amount - settled > 1) {
                        orders.push({
                            type: 'WO',
                            id: wo.id,
                            number: wo.work_order_number || `WO#${wo.id}`,
                            date: wo.created_at,
                            project: wo.project?.name,
                            total: amount,
                            paid: settled,
                            balance: amount - settled,
                            days: Math.floor((new Date().getTime() - new Date(wo.created_at).getTime()) / (1000 * 60 * 60 * 24))
                        })
                    }
                })

            return {
                id: vendor.id,
                name: vendor.name,
                code: `VEN-${vendor.id}`,
                total_outstanding: totalAmount - totalPaid,
                orders: orders.sort((a, b) => b.days - a.days)
            }
        }).filter(v => v.total_outstanding > 0)
            .sort((a, b) => b.total_outstanding - a.total_outstanding)

        res.json({
            success: true,
            report
        })
    } catch (error) {
        next(error)
    }
}
