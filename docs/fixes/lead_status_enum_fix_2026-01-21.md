# Lead Status Fix - Summary

## Issue
When updating lead ID 3 with status "contacted", the API returned an error:
```
"Data truncated for column 'status' at row 1"
```

## Root Cause
The value `"contacted"` was not included in the database ENUM definition for the `leads.status` column.

### Original ENUM Values
```sql
ENUM('new', 'quoted', 'follow_up', 'converted', 'lost')
```

## Solution Applied

### 1. Database Migration
**File:** `D:\CRM\database\migrations\009_add_contacted_status_to_leads.sql`

Added "contacted" to the ENUM values:
```sql
ALTER TABLE leads 
MODIFY COLUMN status ENUM('new', 'contacted', 'quoted', 'follow_up', 'converted', 'lost') DEFAULT 'new';
```

**Status:** ✅ Migration executed successfully

### 2. Backend Model Update
**File:** `D:\CRM\backend\src\models\Lead.ts`

Updated TypeScript interface and Sequelize model:
```typescript
// Interface
status: 'new' | 'contacted' | 'quoted' | 'follow_up' | 'converted' | 'lost'

// Sequelize Model
type: DataTypes.ENUM('new', 'contacted', 'quoted', 'follow_up', 'converted', 'lost')
```

### 3. Frontend Form Update
**File:** `D:\CRM\frontend\src\pages\leads\LeadForm.tsx`

Updated status dropdown options to match database schema:
- ✅ New
- ✅ Contacted (already existed in UI, now supported in backend)
- ✅ Quoted (replaced "Qualified")
- ✅ Follow Up (added)
- ✅ Converted
- ✅ Lost

## Final Status ENUM Values
```
'new', 'contacted', 'quoted', 'follow_up', 'converted', 'lost'
```

## Testing
Your original payload should now work:
```json
{
    "name": "Test Lead1",
    "company_name": "Rajhans",
    "phone": "7418529630",
    "email": "d@g.co",
    "address": "ram chowk, ghoddod road,surat -395006",
    "project_id": null,
    "enquiry_date": "2026-01-21",
    "source": "other",
    "soil_report_url": null,
    "layout_url": null,
    "section_url": null,
    "status": "contacted",
    "remarks": "Check page working"
}
```

**Endpoint:** `PUT http://localhost:5000/api/leads/3`

## Files Modified
1. ✅ `D:\CRM\database\migrations\009_add_contacted_status_to_leads.sql` (created)
2. ✅ `D:\CRM\database\migrations\run-add-contacted-status.js` (created)
3. ✅ `D:\CRM\backend\src\models\Lead.ts` (updated)
4. ✅ `D:\CRM\frontend\src\pages\leads\LeadForm.tsx` (updated)

## Next Steps
- Test the API endpoint with the payload above
- Verify the frontend form displays all status options correctly
- Check that existing leads with old status values still work properly
