# Project Status Verification

## Test the API to verify project statuses were updated

### Check Projects
```bash
GET http://localhost:5000/api/projects?status=&search=&page=1&limit=10
```

### Expected Results:

#### PRJ-2026-001 (Test Milan)
- **Before:** `lead`
- **After:** `mobilization` (has WO-2026-001 with status `approved`)

#### PRJ-2026-002 (L2 Project)
- **Before:** `confirmed`
- **After:** `execution` (has WO-2026-002 & WO-2026-003 with status `active`)

#### PRJ-2026-003 (Test Lead1 Project)
- **Before:** `lead`
- **After:** `execution` (has WO-2026-004 with status `active`)

---

## If Migration Didn't Work

Run this SQL manually in your database:

```sql
-- Fix PRJ-2026-003 (has active work order)
UPDATE projects 
SET status = 'execution', updated_at = NOW()
WHERE id = 3;

-- Fix PRJ-2026-002 (has active work orders)
UPDATE projects 
SET status = 'execution', updated_at = NOW()
WHERE id = 2;

-- Fix PRJ-2026-001 (has approved work order)
UPDATE projects 
SET status = 'mobilization', updated_at = NOW()
WHERE id = 1;
```

---

## Alternative: Use API to Update Work Order Status

Since the automation is now in place, you can trigger it by updating the work order status:

```bash
# For PRJ-2026-003 (WO-2026-004)
PUT http://localhost:5000/api/work-orders/4
Content-Type: application/json

{
    "status": "active"
}
```

This will trigger the automation and update the project status to `execution`.

---

## Verify After Fix

```bash
GET http://localhost:5000/api/projects/3
```

Should show:
```json
{
    "id": 3,
    "project_code": "PRJ-2026-003",
    "name": "Test Lead1 (Project)",
    "status": "execution",  // ← Should be updated
    ...
}
```
