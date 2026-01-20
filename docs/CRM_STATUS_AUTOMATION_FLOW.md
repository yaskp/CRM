# CRM Status Automation Flow

## Overview
This document outlines the automated status flow implemented in the CRM system, following industry-standard practices from Salesforce, HubSpot, Zoho, and construction-specific CRMs like Procore and Buildertrend.

## Automated Status Triggers

### 1. **Quotation Creation → Lead & Project Status Update**

**Trigger**: When a new Quotation is created

**Automated Actions**:
- ✅ Lead Status → `quoted`
- ✅ Project Status → `quotation` (if lead is linked to a project)

**Business Logic**:
```
IF quotation.created THEN
  UPDATE lead SET status = 'quoted' WHERE id = quotation.lead_id
  IF lead.project_id IS NOT NULL THEN
    UPDATE project SET status = 'quotation' WHERE id = lead.project_id
  END IF
END IF
```

**Implementation**: `backend/src/controllers/quotation.controller.ts` - `createQuotation()`

---

### 2. **Quotation Status: SENT → Lead & Project Status Update**

**Trigger**: When Quotation status is changed to `sent`

**Automated Actions**:
- ✅ Lead Status → `quoted`
- ✅ Project Status → `quotation` (if lead is linked to a project)

**Business Logic**:
```
IF quotation.status = 'sent' THEN
  UPDATE lead SET status = 'quoted' WHERE id = quotation.lead_id
  IF lead.project_id IS NOT NULL THEN
    UPDATE project SET status = 'quotation' WHERE id = lead.project_id
  END IF
END IF
```

**Implementation**: `backend/src/controllers/quotation.controller.ts` - `updateQuotation()`

---

### 3. **Quotation Status: ACCEPTED → Lead & Project Status Update** ⭐

**Trigger**: When Quotation status is changed to `accepted`

**Automated Actions**:
- ✅ Lead Status → `converted` (Deal Won!)
- ✅ Project Status → `confirmed` (Project is now active)

**Business Logic**:
```
IF quotation.status = 'accepted' THEN
  UPDATE lead SET status = 'converted' WHERE id = quotation.lead_id
  IF lead.project_id IS NOT NULL THEN
    UPDATE project SET status = 'confirmed' WHERE id = lead.project_id
  END IF
END IF
```

**Implementation**: `backend/src/controllers/quotation.controller.ts` - `updateQuotation()`

**This is the KEY automation** - When a client accepts your quote, the entire pipeline automatically updates to reflect the won deal.

---

## Status Definitions

### Lead Statuses
| Status | Meaning | Trigger |
|--------|---------|---------|
| `new` | Fresh inquiry | Lead created |
| `quoted` | Proposal sent | Quotation created/sent |
| `follow_up` | Awaiting response | Manual |
| `converted` | Deal won | Quotation accepted |
| `lost` | Deal lost | Manual |

### Quotation Statuses
| Status | Meaning | Trigger |
|--------|---------|---------|
| `draft` | Being prepared | Quotation created |
| `sent` | Sent to client | Manual update |
| `accepted` | Client approved | Manual update |
| `rejected` | Client declined | Manual update |
| `expired` | Validity expired | Manual/Automated |

### Project Statuses
| Status | Meaning | Trigger |
|--------|---------|---------|
| `lead` | Prospecting phase | Project created |
| `quotation` | Proposal sent | Quotation created/sent |
| `confirmed` | Deal won, ready to start | Quotation accepted |
| `design` | Design phase | Manual |
| `mobilization` | Site setup | Manual |
| `execution` | Construction ongoing | Manual |
| `completed` | Project finished | Manual |
| `on_hold` | Paused | Manual |
| `cancelled` | Cancelled | Manual |

### Work Order Statuses
| Status | Meaning | Trigger |
|--------|---------|---------|
| `draft` | Being prepared | Work order created |
| `approved` | Approved by PM | Manual |
| `active` | Work in progress | Manual |
| `completed` | Work finished | Manual |
| `cancelled` | Cancelled | Manual |

---

## Standard CRM Comparison

### Salesforce Construction Cloud
- ✅ Opportunity Stage → Account Status (Similar to our Quotation → Lead)
- ✅ Quote Acceptance → Project Creation (Similar to our Quotation Accepted → Project Confirmed)
- ✅ Work Order → Subcontractor Assignment (Matches our vendor_id field)

### Procore
- ✅ Bid → Project Conversion (Similar to our Lead → Project)
- ✅ Contract Approval → Project Activation (Similar to our Quotation Accepted → Confirmed)
- ✅ Subcontract Work Orders (Matches our Work Order with vendor selection)

### Buildertrend
- ✅ Lead → Estimate → Job (Similar to our Lead → Quotation → Project)
- ✅ Estimate Acceptance → Job Activation (Matches our automation)
- ✅ Internal vs External Work Orders (Matches our toggle feature)

---

## User Actions Required

### Manual Status Updates
The following statuses require manual intervention:
1. **Quotation**: `rejected`, `expired`
2. **Lead**: `follow_up`, `lost`
3. **Project**: `design`, `mobilization`, `execution`, `completed`, `on_hold`, `cancelled`
4. **Work Order**: All status changes (draft → approved → active → completed)

### Automated Status Updates
The following happen automatically:
1. ✅ **Lead** → `quoted` (when quotation created/sent)
2. ✅ **Lead** → `converted` (when quotation accepted)
3. ✅ **Project** → `quotation` (when quotation created/sent)
4. ✅ **Project** → `confirmed` (when quotation accepted)

---

## Testing the Flow

### Test Scenario 1: New Lead to Won Deal
1. Create a Lead → Status: `new`
2. Create a Project from Lead → Project Status: `lead`
3. Create a Quotation for the Lead → **Automated**: Lead Status: `quoted`, Project Status: `quotation`
4. Update Quotation Status to `sent` → **Automated**: Confirms Lead: `quoted`, Project: `quotation`
5. Update Quotation Status to `accepted` → **Automated**: Lead: `converted`, Project: `confirmed` ✅

### Test Scenario 2: Direct Quotation
1. Create a Lead → Status: `new`
2. Create a Quotation → **Automated**: Lead Status: `quoted`
3. Accept Quotation → **Automated**: Lead Status: `converted` ✅

---

## Implementation Files

### Backend
- `backend/src/controllers/quotation.controller.ts` - Main automation logic
- `backend/src/models/Lead.ts` - Lead status enum
- `backend/src/models/Quotation.ts` - Quotation status enum
- `backend/src/models/Project.ts` - Project status enum
- `backend/src/models/WorkOrder.ts` - Work order status enum (with vendor support)

### Frontend
- `frontend/src/pages/quotations/QuotationList.tsx` - Status update modal
- `frontend/src/pages/quotations/QuotationForm.tsx` - Status dropdown
- `frontend/src/pages/projects/ProjectDetails.tsx` - Status update modal
- `frontend/src/pages/workOrders/WorkOrderForm.tsx` - Vendor selection toggle
- `frontend/src/pages/workOrders/WorkOrderList.tsx` - Status update modal

---

## Compliance with Industry Standards

✅ **Salesforce-style**: Opportunity → Account status propagation  
✅ **HubSpot-style**: Deal stage → Contact lifecycle automation  
✅ **Procore-style**: Bid → Project → Subcontract workflow  
✅ **Buildertrend-style**: Lead → Estimate → Job conversion  

**Your CRM is now fully compliant with construction industry standards!** 🎉
