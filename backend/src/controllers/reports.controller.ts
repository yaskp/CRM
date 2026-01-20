
import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { sequelize } from '../database/connection'
import { QueryTypes } from 'sequelize'

export const getProjectConsumptionReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { project_id, start_date, end_date } = req.query

        if (!project_id) {
            return res.status(400).json({ success: false, message: 'Project ID is required' })
        }

        // 1. Manpower Costs (Calculated from DPR Manpower * Standard Rates?)
        // Standard Rates should ideally be in a DB table, for now assuming averages or derived if valid
        // Actually, construction costing usually takes: count * hajri * rate_per_type

        // 2. Material Consumption (From DPR Metrics directly: Steel, Concrete, Diesel)
        // Rate for these should come from weighted average purchase price?? 
        // OR just returning quantities for Finance to apply rates.
        // User asked: "cost of project shall be derived based on consumption, hajri and all"

        const consumption = await sequelize.query(`
            SELECT 
                dpr.report_date,
                -- Manpower Subtotals
                SUM(CASE WHEN mr.worker_type = 'steel_worker' THEN mr.count * CAST(mr.hajri AS DECIMAL) ELSE 0 END) as steel_worker_shifts,
                SUM(CASE WHEN mr.worker_type = 'concrete_worker' THEN mr.count * CAST(mr.hajri AS DECIMAL) ELSE 0 END) as concrete_worker_shifts,
                SUM(CASE WHEN mr.worker_type = 'department_worker' THEN mr.count * CAST(mr.hajri AS DECIMAL) ELSE 0 END) as dept_worker_shifts,
                SUM(CASE WHEN mr.worker_type = 'electrician' THEN mr.count * CAST(mr.hajri AS DECIMAL) ELSE 0 END) as electrician_shifts,
                SUM(CASE WHEN mr.worker_type = 'welder' THEN mr.count * CAST(mr.hajri AS DECIMAL) ELSE 0 END) as welder_shifts,

                -- Material Consumption (DPR Header)
                MAX(dpr.steel_quantity_kg) as steel_kg,
                MAX(dpr.concrete_quantity_cubic_meter) as concrete_m3,
                MAX(dpr.diesel_consumption_liters) as diesel_liters,
                MAX(dpr.polymer_consumption_bags) as polymer_bags

            FROM daily_progress_reports dpr
            LEFT JOIN manpower_reports mr ON mr.dpr_id = dpr.id
            WHERE dpr.project_id = :project_id
            ${start_date ? 'AND dpr.report_date >= :start_date' : ''}
            ${end_date ? 'AND dpr.report_date <= :end_date' : ''}
            GROUP BY dpr.id, dpr.report_date
            ORDER BY dpr.report_date DESC
        `, {
            replacements: { project_id, start_date, end_date },
            type: QueryTypes.SELECT
        })

        res.json({
            success: true,
            data: consumption
        })

    } catch (error) {
        next(error)
    }
}
