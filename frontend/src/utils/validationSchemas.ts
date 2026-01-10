import { z } from 'zod'

// Indian phone validation
const phoneRegex = /^[6-9]\d{9}$/
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/

export const phoneSchema = z.string().refine(
  (val) => !val || phoneRegex.test(val.replace(/[\s-]/g, '')),
  { message: 'Please enter a valid 10-digit Indian mobile number' }
).optional()

export const gstSchema = z.string().refine(
  (val) => !val || gstRegex.test(val.toUpperCase()),
  { message: 'Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)' }
).optional()

export const panSchema = z.string().refine(
  (val) => !val || panRegex.test(val.toUpperCase()),
  { message: 'Please enter a valid PAN number (e.g., ABCDE1234F)' }
).optional()

// Store Transaction Schemas
export const grnItemSchema = z.object({
  material_id: z.number().min(1, 'Material is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit_price: z.number().nonnegative('Unit price cannot be negative').optional(),
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
})

export const grnSchema = z.object({
  warehouse_id: z.number().min(1, 'Warehouse is required'),
  transaction_date: z.string().min(1, 'Transaction date is required'),
  items: z.array(grnItemSchema).min(1, 'At least one item is required'),
  remarks: z.string().optional(),
})

export const stnSchema = z.object({
  warehouse_id: z.number().min(1, 'Source warehouse is required'),
  to_warehouse_id: z.number().min(1, 'Destination warehouse is required'),
  transaction_date: z.string().min(1, 'Transaction date is required'),
  items: z.array(z.object({
    material_id: z.number().min(1, 'Material is required'),
    quantity: z.number().positive('Quantity must be positive'),
    batch_number: z.string().optional(),
  })).min(1, 'At least one item is required'),
  remarks: z.string().optional(),
})

export const srnSchema = z.object({
  warehouse_id: z.number().min(1, 'Warehouse is required'),
  project_id: z.number().min(1, 'Project is required'),
  transaction_date: z.string().min(1, 'Transaction date is required'),
  items: z.array(z.object({
    material_id: z.number().min(1, 'Material is required'),
    quantity: z.number().positive('Quantity must be positive'),
  })).min(1, 'At least one item is required'),
  remarks: z.string().optional(),
})

// DPR Schema
export const dprSchema = z.object({
  project_id: z.number().min(1, 'Project is required'),
  report_date: z.string().min(1, 'Report date is required'),
  site_location: z.string().optional(),
  panel_number: z.string().optional(),
  guide_wall_running_meter: z.number().nonnegative().optional(),
  steel_quantity_kg: z.number().nonnegative().optional(),
  concrete_quantity_cubic_meter: z.number().nonnegative().optional(),
  polymer_consumption_bags: z.number().int().nonnegative().optional(),
  diesel_consumption_liters: z.number().nonnegative().optional(),
  weather_conditions: z.string().optional(),
  remarks: z.string().optional(),
  manpower: z.array(z.object({
    worker_type: z.enum(['steel_worker', 'concrete_worker', 'department_worker', 'electrician', 'welder']),
    count: z.number().int().positive('Count must be positive'),
    hajri: z.enum(['1', '1.5', '2']),
  })).optional(),
})

// Equipment Schema
export const equipmentSchema = z.object({
  equipment_code: z.string().min(1, 'Equipment code is required'),
  name: z.string().min(1, 'Name is required'),
  equipment_type: z.enum(['crane', 'jcb', 'rig', 'grabbing_rig', 'steel_bending_machine', 'steel_cutting_machine', 'water_tank', 'pump', 'other']),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  registration_number: z.string().optional(),
  is_rental: z.boolean().default(false),
  owner_vendor_id: z.number().optional(),
})

export const equipmentRentalSchema = z.object({
  project_id: z.number().min(1, 'Project is required'),
  equipment_id: z.number().min(1, 'Equipment is required'),
  vendor_id: z.number().min(1, 'Vendor is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  rate_per_day: z.number().nonnegative().optional(),
  rate_per_sq_meter: z.number().nonnegative().optional(),
}).refine(
  (data) => data.rate_per_day || data.rate_per_sq_meter,
  { message: 'Either rate per day or rate per sq meter is required', path: ['rate_per_day'] }
)

export const equipmentBreakdownSchema = z.object({
  rental_id: z.number().min(1, 'Rental is required'),
  breakdown_date: z.string().min(1, 'Breakdown date is required'),
  breakdown_time: z.string().optional(),
  resolution_date: z.string().optional(),
  resolution_time: z.string().optional(),
  breakdown_reason: z.string().optional(),
})

// Expense Schema
export const expenseSchema = z.object({
  project_id: z.number().min(1, 'Project is required'),
  expense_type: z.enum(['conveyance', 'loose_purchase', 'food', 'two_wheeler', 'other']),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  expense_date: z.string().min(1, 'Expense date is required'),
  bill_type: z.enum(['kaccha_bill', 'pakka_bill', 'petrol_bill', 'ola_uber_screenshot', 'not_required']).optional(),
  input_method: z.enum(['auto', 'manual']).default('manual'),
})

// Drawing Schema
export const drawingSchema = z.object({
  project_id: z.number().min(1, 'Project is required'),
  drawing_number: z.string().optional(),
  drawing_name: z.string().optional(),
  drawing_type: z.string().optional(),
})

export const panelSchema = z.object({
  panel_identifier: z.string().min(1, 'Panel identifier is required'),
  coordinates_json: z.any().optional(),
  panel_type: z.string().optional(),
})

export const panelProgressSchema = z.object({
  progress_date: z.string().min(1, 'Progress date is required'),
  progress_percentage: z.number().min(0).max(100).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']).default('in_progress'),
  work_stage: z.string().optional(),
  remarks: z.string().optional(),
})

// Vendor Schema
export const vendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  vendor_type: z.enum(['steel_contractor', 'concrete_contractor', 'rig_vendor', 'crane_vendor', 'jcb_vendor', 'other']),
  contact_person: z.string().optional(),
  phone: phoneSchema,
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  gst_number: gstSchema,
  pan_number: panSchema,
  bank_details: z.string().optional(),
  is_active: z.boolean().default(true),
})

// Material Requisition Schema
export const materialRequisitionItemSchema = z.object({
  material_id: z.number().min(1, 'Material is required'),
  requested_quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
})

export const materialRequisitionSchema = z.object({
  project_id: z.number().min(1, 'Project is required'),
  from_warehouse_id: z.number().min(1, 'Warehouse is required'),
  required_date: z.string().optional(),
  items: z.array(materialRequisitionItemSchema).min(1, 'At least one item is required'),
})

// Lead Schema
export const leadSchema = z.object({
  name: z.string().min(1, 'Lead name is required'),
  company_name: z.string().optional(),
  phone: phoneSchema,
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  enquiry_date: z.string().min(1, 'Enquiry date is required'),
  source: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).default('new'),
  remarks: z.string().optional(),
})

// Quotation Schema
export const quotationItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  rate: z.number().nonnegative('Rate cannot be negative'),
})

export const quotationSchema = z.object({
  lead_id: z.number().min(1, 'Lead is required'),
  version: z.number().int().positive().default(1),
  valid_till: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, 'At least one item is required'),
  discount_percentage: z.number().min(0).max(100).default(0),
  payment_terms: z.string().optional(),
  remarks: z.string().optional(),
})

// Work Order Schema
export const workOrderItemSchema = z.object({
  item_type: z.enum(['guide_wall', 'grabbing', 'stop_end', 'rubber_stop', 'steel_fabrication', 'anchor']),
  quantity: z.number().positive('Quantity must be positive'),
  rate: z.number().nonnegative('Rate cannot be negative'),
})

export const workOrderSchema = z.object({
  project_id: z.number().min(1, 'Project is required'),
  work_order_date: z.string().min(1, 'Work order date is required'),
  items: z.array(workOrderItemSchema).min(1, 'At least one item is required'),
  discount_percentage: z.number().min(0).max(100).default(0),
  payment_terms: z.string().optional(),
  remarks: z.string().optional(),
})

// Project Schema
export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  location: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  client_name: z.string().optional(),
  client_ho_address: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.number().nonnegative().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
})

// Export types
export type GRNFormData = z.infer<typeof grnSchema>
export type STNFormData = z.infer<typeof stnSchema>
export type SRNFormData = z.infer<typeof srnSchema>
export type DPRFormData = z.infer<typeof dprSchema>
export type EquipmentFormData = z.infer<typeof equipmentSchema>
export type EquipmentRentalFormData = z.infer<typeof equipmentRentalSchema>
export type ExpenseFormData = z.infer<typeof expenseSchema>
export type DrawingFormData = z.infer<typeof drawingSchema>
export type VendorFormData = z.infer<typeof vendorSchema>
export type MaterialRequisitionFormData = z.infer<typeof materialRequisitionSchema>
export type LeadFormData = z.infer<typeof leadSchema>
export type QuotationFormData = z.infer<typeof quotationSchema>
export type WorkOrderFormData = z.infer<typeof workOrderSchema>
export type ProjectFormData = z.infer<typeof projectSchema>

