
import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { sequelize } from '../database/connection'
import { QueryTypes } from 'sequelize'

export const getProjectConsumptionReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { project_id, start_date, end_date, work_item_type_id } = req.query

        if (!project_id) {
            return res.status(400).json({ success: false, message: 'Project ID is required' })
        }

        // Expanded Query: Capturing Material Consumption AND Progress Achievement (including D-Wall specialized logs)
        const consumption = await sequelize.query(`
            SELECT 
                st.transaction_date as report_date,
                wit.name as work_type_name,
                sti.work_item_type_id,
                
                -- Achievement Calculation
                -- Priority 1: D-Wall Specialized Logs (SQM)
                -- Priority 2: Generic Quantity (where material_id is NULL)
                COALESCE(
                    NULLIF(GREATEST(IFNULL(st.concreting_sqm, 0), IFNULL(st.grabbing_sqm, 0)), 0),
                    SUM(CASE WHEN m.id IS NULL THEN sti.quantity ELSE 0 END)
                ) as achievement_qty,
                
                CASE 
                    WHEN GREATEST(IFNULL(st.concreting_sqm, 0), IFNULL(st.grabbing_sqm, 0)) > 0 THEN 'm²'
                    ELSE MAX(CASE WHEN m.id IS NULL THEN sti.unit ELSE NULL END)
                END as achievement_unit,

                -- Material Consumption
                SUM(CASE 
                    WHEN LOWER(m.name) LIKE '%steel%' 
                      OR LOWER(m.name) LIKE '%reinf%' 
                      OR LOWER(m.name) LIKE '%tmt%' 
                      OR LOWER(m.name) LIKE '%fe 500%'
                      OR m.material_code LIKE '%STL%' 
                    THEN sti.quantity ELSE 0 END) as steel_kg,
                
                SUM(CASE 
                    WHEN LOWER(m.name) LIKE '%concrete%' 
                      OR LOWER(m.name) LIKE '%rmc%' 
                      OR LOWER(m.name) LIKE '%m10%' 
                      OR LOWER(m.name) LIKE '%m15%' 
                      OR LOWER(m.name) LIKE '%m20%' 
                      OR LOWER(m.name) LIKE '%m25%' 
                      OR LOWER(m.name) LIKE '%m30%'
                      OR m.material_code LIKE '%CONC%' 
                    THEN sti.quantity ELSE 0 END) as concrete_m3,
                
                SUM(CASE 
                    WHEN LOWER(m.name) LIKE '%diesel%' 
                      OR LOWER(m.name) LIKE '%hsd%' 
                      OR LOWER(m.name) LIKE '%fuel%' 
                      OR m.material_code LIKE '%DSL%' 
                    THEN sti.quantity ELSE 0 END) as diesel_liters,

                SUM(CASE WHEN LOWER(m.name) LIKE '%cement%' THEN sti.quantity ELSE 0 END) as cement_bags,
                
                -- Support D-Wall specific parameters in response
                MAX(st.grabbing_depth) as dwall_grabbing_depth,
                MAX(st.concreting_depth) as dwall_concreting_depth,
                MAX(st.cage_id_ref) as dwall_cage_id,
                
                -- Manpower info
                st.manpower_data,
                st.remarks,
                st.id as transaction_id,
                GROUP_CONCAT(DISTINCT dp.panel_identifier SEPARATOR ', ') as panel_names,

                -- Capture ALL other materials as a summary string
                GROUP_CONCAT(
                    CASE 
                        WHEN m.id IS NOT NULL 
                         AND LOWER(m.name) NOT LIKE '%steel%' 
                         AND LOWER(m.name) NOT LIKE '%reinf%' 
                         AND LOWER(m.name) NOT LIKE '%tmt%' 
                         AND LOWER(m.name) NOT LIKE '%fe 500%'
                         AND LOWER(m.name) NOT LIKE '%concrete%' 
                         AND LOWER(m.name) NOT LIKE '%rmc%'
                         AND LOWER(m.name) NOT LIKE '%m10%' 
                         AND LOWER(m.name) NOT LIKE '%m15%' 
                         AND LOWER(m.name) NOT LIKE '%m20%' 
                         AND LOWER(m.name) NOT LIKE '%m25%' 
                         AND LOWER(m.name) NOT LIKE '%m30%'
                         AND LOWER(m.name) NOT LIKE '%diesel%'
                         AND LOWER(m.name) NOT LIKE '%hsd%'
                         AND LOWER(m.name) NOT LIKE '%cement%'
                         AND m.material_code NOT LIKE '%STL%'
                         AND m.material_code NOT LIKE '%CONC%'
                         AND m.material_code NOT LIKE '%DSL%'
                        THEN CONCAT(m.name, ': ', sti.quantity, ' ', IFNULL(sti.unit, ''))
                        ELSE NULL 
                    END 
                    SEPARATOR ', '
                ) as summary_other_materials
                
            FROM store_transactions st
            JOIN store_transaction_items sti ON sti.transaction_id = st.id
            LEFT JOIN work_item_types wit ON sti.work_item_type_id = wit.id
            LEFT JOIN materials m ON sti.material_id = m.id
            LEFT JOIN drawing_panels dp ON (st.drawing_panel_id = dp.id OR sti.drawing_panel_id = dp.id)
            WHERE st.project_id = :project_id 
              AND st.transaction_type = 'CONSUMPTION'
              AND st.status = 'approved'
            ${start_date ? 'AND st.transaction_date >= :start_date' : ''}
            ${end_date ? 'AND st.transaction_date <= :end_date' : ''}
            ${work_item_type_id ? 'AND sti.work_item_type_id = :work_item_type_id' : ''}
            GROUP BY st.id, st.transaction_date, wit.name, sti.work_item_type_id
            ORDER BY st.transaction_date DESC
        `, {
            replacements: { project_id, start_date, end_date, work_item_type_id },
            type: QueryTypes.SELECT
        })

        // Process manpower_data JSON in Node.js
        const processedData = consumption.map((row: any) => {
            let steel_shifts = 0;
            let concrete_shifts = 0;
            let total_shifts = 0;

            if (row.manpower_data) {
                try {
                    const manpower = typeof row.manpower_data === 'string' ? JSON.parse(row.manpower_data) : row.manpower_data;
                    if (Array.isArray(manpower)) {
                        manpower.forEach((m: any) => {
                            const count = Number(m.count) || 0;
                            const hajri = (m.hajri !== undefined && m.hajri !== null) ? Number(m.hajri) : 1;
                            total_shifts += (count * hajri);

                            const type = (m.worker_type || '').toLowerCase();
                            if (type.includes('steel') || type.includes('fixer') || type.includes('bender') || type.includes('reinf')) {
                                steel_shifts += (count * hajri);
                            }
                            if (type.includes('concrete') || type.includes('mason') || type.includes('rmc') || type.includes('casting') || type.includes('pour')) {
                                concrete_shifts += (count * hajri);
                            }
                        });
                    }
                } catch (e) { }
            }

            return {
                ...row,
                steel_worker_shifts: steel_shifts.toFixed(2),
                concrete_worker_shifts: concrete_shifts.toFixed(2),
                total_manpower_shifts: total_shifts.toFixed(2),
                achievement_qty: row.achievement_qty ? Number(row.achievement_qty).toFixed(2) : '0'
            };
        });

        return res.json({
            success: true,
            data: processedData
        })

    } catch (error) {
        return next(error)
    }
}
