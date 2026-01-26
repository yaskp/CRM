-- MANUAL FIX: Update project statuses based on current work order statuses
-- Run this in your MySQL database

-- PRJ-2026-003: Has WO-2026-004 (active) → should be 'execution'
UPDATE projects 
SET status = 'execution', updated_at = NOW()
WHERE id = 3 AND status != 'execution';

-- PRJ-2026-002: Has WO-2026-002 & WO-2026-003 (both active) → should be 'execution'  
UPDATE projects 
SET status = 'execution', updated_at = NOW()
WHERE id = 2 AND status != 'execution';

-- PRJ-2026-001: Has WO-2026-001 (approved) → should be 'mobilization'
UPDATE projects 
SET status = 'mobilization', updated_at = NOW()
WHERE id = 1 AND status != 'mobilization';

-- Verify the changes
SELECT 
    p.id,
    p.project_code,
    p.name,
    p.status as project_status,
    wo.work_order_number,
    wo.status as wo_status
FROM projects p
LEFT JOIN work_orders wo ON wo.project_id = p.id
ORDER BY p.id, wo.id;
