-- Fix Project Statuses Based on Existing Work Orders
-- Run this to sync project statuses with their work order statuses

-- Update projects that have ACTIVE work orders → status should be 'execution'
UPDATE projects p
SET status = 'execution', updated_at = NOW()
WHERE p.id IN (
    SELECT DISTINCT project_id 
    FROM work_orders 
    WHERE status = 'active'
)
AND p.status != 'execution';

-- Update projects that have APPROVED work orders (but no active ones) → status should be 'mobilization'
UPDATE projects p
SET status = 'mobilization', updated_at = NOW()
WHERE p.id IN (
    SELECT DISTINCT project_id 
    FROM work_orders 
    WHERE status = 'approved'
    AND project_id NOT IN (
        SELECT project_id FROM work_orders WHERE status = 'active'
    )
)
AND p.status != 'mobilization';

-- Update projects that have COMPLETED work orders (and no active/approved ones) → status should be 'completed'
UPDATE projects p
SET status = 'completed', updated_at = NOW()
WHERE p.id IN (
    SELECT DISTINCT project_id 
    FROM work_orders 
    WHERE status = 'completed'
    AND project_id NOT IN (
        SELECT project_id FROM work_orders WHERE status IN ('active', 'approved')
    )
)
AND p.status != 'completed';

-- Show the results
SELECT 
    p.id,
    p.project_code,
    p.name,
    p.status as project_status,
    wo.work_order_number,
    wo.status as work_order_status
FROM projects p
LEFT JOIN work_orders wo ON wo.project_id = p.id
ORDER BY p.id, wo.created_at DESC;
