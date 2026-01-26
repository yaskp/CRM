-- Quick verification query to check project statuses
SELECT 
    p.id,
    p.project_code,
    p.name,
    p.status as project_status,
    GROUP_CONCAT(CONCAT(wo.work_order_number, ' (', wo.status, ')') ORDER BY wo.created_at DESC SEPARATOR ', ') as work_orders
FROM projects p
LEFT JOIN work_orders wo ON wo.project_id = p.id
GROUP BY p.id, p.project_code, p.name, p.status
ORDER BY p.id;
