# Standard CRM Workflow - Status Automation

## Current Implementation Analysis

### ✅ What's Working

#### 1. Quotation Creation
When a quotation is created:
- **Lead Status**: Updated to `'quoted'`
- **Project Status**: Updated to `'quotation'` (if project exists)

#### 2. Quotation Status Update
When quotation status changes to:
- **'sent'**: 
  - Lead Status → `'quoted'`
  - Project Status → `'quotation'`
- **'accepted'**:
  - Lead Status → `'converted'`
  - Project Status → `'confirmed'`

### ❌ What's Missing

#### Work Order Creation
Currently, when a work order is created, **NO automatic status updates occur**.

## Standard CRM Workflow

```
Lead (new) 
  ↓
Create Quotation → Lead: 'quoted', Project: 'quotation'
  ↓
Quotation Sent → Lead: 'quoted', Project: 'quotation'
  ↓
Quotation Accepted → Lead: 'converted', Project: 'confirmed'
  ↓
Create Work Order (Approved) → Project: 'mobilization'
  ↓
Work Order Active → Project: 'execution'
  ↓
Work Order Completed → Project: 'completed'
```

## Required Changes

### Work Order Controller
Need to add automatic project status updates:

1. **When Work Order is Created**:
   - If status is 'draft' → Project stays 'confirmed'
   - If status is 'approved' → Project → 'mobilization'

2. **When Work Order Status Changes**:
   - 'approved' → Project → 'mobilization'
   - 'active' → Project → 'execution'
   - 'completed' → Project → 'completed'

## Project Status Flow
```
lead → quotation → confirmed → design → mobilization → execution → completed → on_hold
```

## Implementation Priority
🔴 **HIGH**: Add work order status automation to match standard CRM workflow
