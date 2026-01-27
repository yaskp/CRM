import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import '../models/index' // Import all models to ensure associations are loaded
import StoreTransaction from '../models/StoreTransaction'
import StoreTransactionItem from '../models/StoreTransactionItem'
import Inventory from '../models/Inventory'
import InventoryLedger from '../models/InventoryLedger'
import Warehouse from '../models/Warehouse'
import Project from '../models/Project'
import User from '../models/User'
import Material from '../models/Material'
import PurchaseOrderItem from '../models/PurchaseOrderItem'
import PurchaseOrder from '../models/PurchaseOrder'
import Vendor from '../models/Vendor'
import WorkerCategory from '../models/WorkerCategory'
import { numberingService } from '../utils/numberingService'
import { createError } from '../middleware/errorHandler'
import { sequelize } from '../database/connection'

export const getWorkerCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const categories = await WorkerCategory.findAll({ order: [['name', 'ASC']] })
    res.json({ success: true, categories })
  } catch (error) {
    next(error)
  }
}

export const createGRN = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const {
      destination_type, // 'warehouse' | 'project'
      destination_id,
      warehouse_id, // legacy
      transaction_date,
      items,
      remarks,
      received_from_type,
      received_from_id,
      reference_number,
      po_id,
      truck_number,
      driver_name,
      driver_phone,
      challan_number,
      supplier_invoice_number,
      lorry_receipt_number,
      eway_bill_number,
      cgst_amount,
      sgst_amount,
      igst_amount,
      challan_image,
      invoice_image,
      goods_image,
      receiver_image
    } = req.body

    // Determine Destination
    const finalDestType = destination_type || 'warehouse'
    const finalDestId = destination_id || warehouse_id

    if (!finalDestId || !items || items.length === 0) {
      throw createError('Destination and items are required', 400)
    }

    const temp_number = numberingService.generateTempNumber('GRN')

    const grnData: any = {
      temp_number,
      transaction_number: temp_number,
      transaction_type: 'GRN',
      destination_type: finalDestType,
      transaction_date,
      status: req.body.status || 'draft',
      remarks,
      created_by: req.user!.id,
      source_type: received_from_type,
      vendor_id: received_from_type === 'vendor' ? received_from_id : null,
      from_project_id: received_from_type === 'project' ? received_from_id : null,
      reference_number,
      purchase_order_id: po_id || null,
      truck_number,
      driver_name,
      driver_phone,
      challan_number,
      supplier_invoice_number,
      lorry_receipt_number,
      eway_bill_number,
      cgst_amount: cgst_amount || 0,
      sgst_amount: sgst_amount || 0,
      igst_amount: igst_amount || 0,
      inspector_name: req.body.inspector_name,
      inspection_date: req.body.inspection_date,
      challan_image,
      invoice_image,
      goods_image,
      receiver_image
    }

    if (finalDestType === 'project') {
      grnData.to_project_id = finalDestId
      // Also set project_id as generic field if helpful, or specific to_project_id
      grnData.project_id = finalDestId
    } else {
      grnData.warehouse_id = finalDestId
    }

    // If marking as complete, generate final number
    if (grnData.status === 'pending') {
      grnData.transaction_number = await numberingService.generateTransactionNumber('GRN', transaction)
    }

    const grn = await StoreTransaction.create(grnData, { transaction })

    // Create transaction items
    const transactionItems = await StoreTransactionItem.bulkCreate(
      items.map((item: any) => ({
        transaction_id: grn.id,
        material_id: item.material_id,
        quantity: item.quantity,
        ordered_quantity: item.ordered_quantity || 0,
        accepted_quantity: item.accepted_quantity || item.quantity,
        rejected_quantity: item.rejected_quantity || 0,
        excess_quantity: item.excess_quantity || 0,
        shortage_quantity: item.shortage_quantity || 0,
        po_item_id: item.po_item_id,
        item_status: item.item_status || 'Good',
        variance_type: item.variance_type || 'exact',
        rejection_reason: item.rejection_reason,
        unit_price: item.unit_price,
        unit: item.unit,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
      })),
      { transaction }
    )

    await transaction.commit()

    res.status(201).json({
      success: true,
      message: 'GRN created successfully',
      grn: {
        ...grn.toJSON(),
        items: transactionItems,
      },
    })
  } catch (error) {
    if (transaction) await transaction.rollback()
    next(error)
  }
}

export const createSTN = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const {
      from_type,
      from_id,
      to_type,
      to_id,
      transaction_date,
      items,
      remarks,
      // Legacy support (optional)
      warehouse_id,
      to_warehouse_id
    } = req.body

    // Determine Source
    let finalFromType = from_type || 'warehouse'
    let finalFromId = from_id || warehouse_id

    // Determine Destination
    let finalToType = to_type || 'warehouse'
    let finalToId = to_id || to_warehouse_id

    if (!finalFromId || !finalToId || !items || items.length === 0) {
      throw createError('Source, Destination, and items are required', 400)
    }

    const temp_number = numberingService.generateTempNumber('STN')

    // Construct Payload
    const stnData: any = {
      temp_number,
      transaction_number: temp_number,
      transaction_type: 'STN',
      source_type: finalFromType,
      destination_type: finalToType,
      transaction_date,
      status: 'draft',
      remarks,
      created_by: req.user!.id,
    }

    // Map Source ID
    if (finalFromType === 'warehouse') {
      stnData.warehouse_id = finalFromId
    } else if (finalFromType === 'project') {
      stnData.from_project_id = finalFromId
    }

    // Map Destination ID
    if (finalToType === 'warehouse') {
      stnData.to_warehouse_id = finalToId
    } else if (finalToType === 'project') {
      stnData.to_project_id = finalToId
    }

    const stn = await StoreTransaction.create(stnData, { transaction })

    // Create transaction items
    const transactionItems = await StoreTransactionItem.bulkCreate(
      items.map((item: any) => ({
        transaction_id: stn.id,
        material_id: item.material_id,
        quantity: item.quantity,
        batch_number: item.batch_number,
      })),
      { transaction }
    )

    await transaction.commit()

    res.status(201).json({
      success: true,
      message: 'STN created successfully',
      stn: {
        ...stn.toJSON(),
        items: transactionItems,
      },
    })
  } catch (error) {
    if (transaction) await transaction.rollback()
    next(error)
  }
}

export const createSRN = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      source_type,
      source_id,
      destination_type,
      destination_id,
      purchase_order_id,
      transaction_date,
      items,
      remarks,
      // Legacy params
      project_id,
      warehouse_id
    } = req.body

    // Default to Project->Warehouse if using legacy or defaults
    const finalSourceType = source_type || (project_id ? 'project' : 'project')
    const finalSourceId = source_id || project_id

    const finalDestType = destination_type || (warehouse_id ? 'warehouse' : 'warehouse')
    const finalDestId = destination_id || warehouse_id

    if (!finalSourceId || !finalDestId || !items || items.length === 0) {
      throw createError('Source, Destination, and items are required', 400)
    }

    const temp_number = numberingService.generateTempNumber('SRN')

    const srnData: any = {
      temp_number,
      transaction_number: temp_number,
      transaction_type: 'SRN',
      source_type: finalSourceType,
      destination_type: finalDestType,
      transaction_date,
      status: 'draft',
      remarks,
      created_by: req.user!.id,
    }

    // Map Source
    if (finalSourceType === 'project') {
      srnData.from_project_id = finalSourceId
      // For legacy compatibility where 'project_id' was the generic field
      srnData.project_id = finalSourceId
    } else if (finalSourceType === 'warehouse') {
      srnData.warehouse_id = finalSourceId
    }

    // Map Destination
    if (finalDestType === 'warehouse') {
      // If source is project, this is usually 'warehouse_id' in old logic, 
      // but strictly it's a destination here. 
      // Let's use to_warehouse_id for clarity if source is project, 
      // but currently SRN approval uses 'warehouse_id' to increase stock?
      // Let's stick to consistent "Source -> Dest" field naming where possible
      // createSTN uses to_warehouse_id for destination. 
      // Let's use to_warehouse_id for SRN destination too.
      srnData.to_warehouse_id = finalDestId

      // Backwards compat: If Approval logic uses `warehouse_id` as "Place where stock changes", we must be careful.
      // In SRN (Site Return), stock INCREASES at warehouse.
      // In Purchase Return (Vendor Return), stock DECREASES at warehouse.
      // So 'warehouse_id' usually implies 'Inventory Owner'. 
      // In Site Return, Warehouse owns the resulting inventory.
      // In Purchase Return, Warehouse owns the source inventory.

      // I'll set BOTH if applicable to ensure legacy logic catches one? 
      // No, explicit is better. I will update approval logic to look at 'to_warehouse_id' for Site Returns.
    } else if (finalDestType === 'vendor') {
      srnData.vendor_id = finalDestId
      srnData.purchase_order_id = purchase_order_id
    }

    const srn = await StoreTransaction.create(srnData)

    // Create transaction items
    const transactionItems = await StoreTransactionItem.bulkCreate(
      items.map((item: any) => ({
        transaction_id: srn.id,
        material_id: item.material_id,
        quantity: item.quantity,
        batch_number: item.batch_number,
        remarks: item.remarks
      }))
    )

    res.status(201).json({
      success: true,
      message: 'SRN created successfully',
      srn: {
        ...srn.toJSON(),
        items: transactionItems,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const createConsumption = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const {
      warehouse_id,
      project_id,
      to_building_id,
      to_floor_id,
      to_zone_id,
      transaction_date,
      items,
      remarks,
      manpower_data,
      weather_condition,
      temperature,
      work_hours,
      progress_photos,
    } = req.body

    if (!warehouse_id || !items || items.length === 0) {
      throw createError('Source warehouse and items are required', 400)
    }

    const temp_number = numberingService.generateTempNumber('CON')

    const consumptionData: any = {
      temp_number,
      transaction_number: temp_number,
      transaction_type: 'CONSUMPTION',
      source_type: 'warehouse',
      destination_type: 'project',
      warehouse_id,
      project_id,
      to_building_id,
      to_floor_id,
      to_zone_id,
      transaction_date,
      status: 'draft',
      remarks,
      manpower_data,
      weather_condition,
      temperature,
      work_hours,
      progress_photos,
      created_by: req.user!.id,
    }

    const consumption = await StoreTransaction.create(consumptionData, { transaction })

    // Auto-save NEW worker categories from manpower_data
    if (manpower_data) {
      try {
        const workers = typeof manpower_data === 'string' ? JSON.parse(manpower_data) : manpower_data
        if (Array.isArray(workers)) {
          for (const w of workers) {
            if (w.worker_type) {
              await WorkerCategory.findOrCreate({
                where: { name: w.worker_type },
                transaction
              })
            }
          }
        }
      } catch (e) {
        console.error('Failed to auto-save worker categories', e)
      }
    }

    const transactionItems = await StoreTransactionItem.bulkCreate(
      items.map((item: any) => ({
        transaction_id: consumption.id,
        material_id: item.material_id,
        quantity: item.quantity,
        wastage_quantity: item.wastage_quantity || 0,
        issued_quantity: item.issued_quantity || 0,
        returned_quantity: item.returned_quantity || 0,
        work_done_quantity: item.work_done_quantity || 0,
        work_item_type_id: item.work_item_type_id,
        unit: item.unit
      })),
      { transaction }
    )

    await transaction.commit()

    res.status(201).json({
      success: true,
      message: 'Consumption recorded successfully',
      consumption: {
        ...consumption.toJSON(),
        items: transactionItems,
      },
    })
  } catch (error) {
    if (transaction) await transaction.rollback()
    next(error)
  }
}

export const getTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, status, warehouse_id, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (type) where.transaction_type = type
    if (status) where.status = status
    if (warehouse_id) where.warehouse_id = warehouse_id

    const { count, rows } = await StoreTransaction.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code'],
          required: false,
        },
        {
          model: Warehouse,
          as: 'toWarehouse',
          attributes: ['id', 'name', 'code'],
          required: false,
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'project_code'],
          required: false,
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
        {
          model: PurchaseOrder,
          as: 'purchase_order',
          attributes: ['id', 'po_number', 'temp_number'],
          required: false,
        },
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: Project,
          as: 'source_project',
          attributes: ['id', 'name', 'project_code'],
          required: false,
        },
        {
          model: Project,
          as: 'destination_project',
          attributes: ['id', 'name', 'project_code'],
          required: false,
        },
      ],
    })

    res.json({
      success: true,
      transactions: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(count / Number(limit)),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const transaction = await StoreTransaction.findByPk(Number(id), {
      include: [
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code'],
          required: false,
        },
        {
          model: Warehouse,
          as: 'toWarehouse',
          attributes: ['id', 'name', 'code'],
          required: false,
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'project_code'],
          required: false,
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
        {
          model: PurchaseOrder,
          as: 'purchase_order',
          attributes: ['id', 'po_number', 'temp_number'],
          required: false,
        },
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: Project,
          as: 'source_project',
          attributes: ['id', 'name', 'project_code'],
          required: false,
        },
        {
          model: Project,
          as: 'destination_project',
          attributes: ['id', 'name', 'project_code'],
          required: false,
        },
        { association: 'toBuilding' },
        { association: 'toFloor' },
        { association: 'toZone' },
        {
          model: StoreTransactionItem,
          as: 'items',
          required: false,
          include: [
            {
              model: Material,
              as: 'material',
              attributes: ['id', 'name', 'material_code', 'unit', 'standard_rate', 'uom'],
              required: false,
            },
            {
              association: 'workItemType',
            }
          ],
        },
      ],
    })

    if (!transaction) {
      throw createError('Transaction not found', 404)
    }

    res.json({
      success: true,
      transaction,
    })
  } catch (error) {
    next(error)
  }
}

export const downloadDPRPDF = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const transaction = await StoreTransaction.findByPk(Number(id), {
      include: [
        { model: Project, as: 'project' },
        { association: 'toBuilding' },
        { association: 'toFloor' },
        { association: 'toZone' },
        { model: User, as: 'creator' },
        {
          model: StoreTransactionItem,
          as: 'items',
          include: [
            { model: Material, as: 'material' },
            { association: 'workItemType' }
          ]
        }
      ]
    })

    if (!transaction) {
      throw createError('Report not found', 404)
    }

    const mode = req.query.mode === 'inline' ? 'inline' : 'attachment'
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `${mode}; filename=DPR-${transaction.transaction_number}.pdf`)

    const { generateDPRPDF } = await import('../utils/pdfGenerator')
    generateDPRPDF(transaction, res)

  } catch (error) {
    next(error)
  }
}

export const approveTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  let finalNumber = '';
  let updateData: any = {};
  try {
    const { id } = req.params
    const storeTransaction = await StoreTransaction.findByPk(Number(id), {
      include: [
        {
          model: StoreTransactionItem,
          as: 'items',
          include: [{ model: Material, as: 'material' }]
        },
      ],
      transaction,
    })

    if (!storeTransaction) {
      throw createError('Transaction not found', 404)
    }

    if (storeTransaction.status !== 'draft' && storeTransaction.status !== 'pending') {
      throw createError('Transaction already processed', 400)
    }

    const items = (storeTransaction as any).items || []

    // 1. Assign permanent sequential number if it's still a TMP number
    finalNumber = storeTransaction.transaction_number
    if (finalNumber.startsWith('TMP-')) {
      finalNumber = await numberingService.generateTransactionNumber(storeTransaction.transaction_type, transaction)
    }

    // 2. Process items and record Ledger
    for (const item of items) {
      const mat = item.material;
      let matUnit = mat?.unit || 'UNIT';
      if (Array.isArray(matUnit)) {
        matUnit = matUnit[0] || 'UNIT';
      }

      // --- GRN LOGIC ---
      if (storeTransaction.transaction_type === 'GRN') {
        let targetWarehouseId = storeTransaction.warehouse_id;

        // Fallback: If Direct-to-Site (project_id set but no warehouse_id), find the Site Warehouse
        if (!targetWarehouseId && (storeTransaction.to_project_id || storeTransaction.project_id)) {
          const pId = storeTransaction.to_project_id || storeTransaction.project_id;
          const siteWh = await Warehouse.findOne({
            where: { project_id: pId, type: 'site' },
            transaction
          });
          if (siteWh) targetWarehouseId = siteWh.id;
        }

        if (targetWarehouseId) {
          // Increase Inventory
          // Identify Project ID if available (either from transaction or found siteWh)
          const targetProjectId = storeTransaction.to_project_id || storeTransaction.project_id || (await Warehouse.findByPk(targetWarehouseId))?.project_id;

          const [inv] = await Inventory.findOrCreate({
            where: { warehouse_id: targetWarehouseId, material_id: item.material_id },
            defaults: {
              warehouse_id: targetWarehouseId,
              project_id: targetProjectId,
              material_id: item.material_id,
              quantity: 0,
              reserved_quantity: 0
            },
            transaction
          });

          // Ensure project_id is set if it was missing (e.g. legacy data)
          if (targetProjectId && !inv.project_id) {
            await inv.update({ project_id: targetProjectId }, { transaction });
          }

          const newQty = Number(inv.quantity) + Number(item.quantity);
          await inv.update({ quantity: newQty }, { transaction });

          // Record Ledger
          await InventoryLedger.create({
            material_id: item.material_id,
            warehouse_id: targetWarehouseId!,
            transaction_type: 'GRN',
            transaction_id: storeTransaction.id,
            transaction_number: finalNumber,
            transaction_date: storeTransaction.transaction_date,
            quantity_in: item.quantity,
            quantity_out: 0,
            balance_quantity: newQty,
            unit: item.unit || matUnit,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date,
            rate: item.unit_price,
            value: Number(item.quantity) * Number(item.unit_price || 0),
            project_id: storeTransaction.project_id || undefined,
          }, { transaction });

          // 🆕 Update PurchaseOrderItem received_quantity
          if (item.po_item_id) {
            const poItem = await PurchaseOrderItem.findByPk(item.po_item_id, { transaction });
            if (poItem) {
              const currentReceived = Number(poItem.received_quantity) || 0;
              await poItem.update({
                received_quantity: currentReceived + Number(item.quantity)
              }, { transaction });
            }
          }
        }
      }
      // --- STN LOGIC ---
      else if (storeTransaction.transaction_type === 'STN') {
        // A. Source OUT
        let sourceWhId = storeTransaction.warehouse_id;
        if (!sourceWhId && storeTransaction.from_project_id) {
          const siteWh = await Warehouse.findOne({ where: { project_id: storeTransaction.from_project_id, type: 'site' }, transaction });
          if (siteWh) sourceWhId = siteWh.id;
        }

        if (sourceWhId) {
          const sourceProjectId = storeTransaction.from_project_id || (await Warehouse.findByPk(sourceWhId))?.project_id;

          const [invSource] = await Inventory.findOrCreate({
            where: { warehouse_id: sourceWhId, material_id: item.material_id },
            defaults: {
              warehouse_id: sourceWhId,
              project_id: sourceProjectId,
              material_id: item.material_id,
              quantity: 0,
              reserved_quantity: 0
            },
            transaction
          });

          if (sourceProjectId && !invSource.project_id) {
            await invSource.update({ project_id: sourceProjectId }, { transaction });
          }

          const currQty = Number(invSource.quantity);
          const newQty = currQty - Number(item.quantity);

          await invSource.update({ quantity: newQty }, { transaction });

          await InventoryLedger.create({
            material_id: item.material_id,
            warehouse_id: sourceWhId,
            transaction_type: 'STN_OUT',
            transaction_id: storeTransaction.id,
            transaction_number: finalNumber,
            transaction_date: storeTransaction.transaction_date,
            quantity_in: 0,
            quantity_out: item.quantity,
            balance_quantity: newQty,
            unit: item.unit || matUnit,
            batch_number: item.batch_number
          }, { transaction });
        }

        // B. Destination IN
        let destWhId = storeTransaction.to_warehouse_id;
        if (!destWhId && storeTransaction.to_project_id) {
          const siteWh = await Warehouse.findOne({ where: { project_id: storeTransaction.to_project_id, type: 'site' }, transaction });
          if (siteWh) destWhId = siteWh.id;
        }

        if (destWhId) {
          const destProjectId = storeTransaction.to_project_id || (await Warehouse.findByPk(destWhId))?.project_id;

          const [inv] = await Inventory.findOrCreate({
            where: { warehouse_id: destWhId, material_id: item.material_id },
            defaults: {
              warehouse_id: destWhId,
              project_id: destProjectId,
              material_id: item.material_id,
              quantity: 0,
              reserved_quantity: 0
            },
            transaction
          });

          if (destProjectId && !inv.project_id) {
            await inv.update({ project_id: destProjectId }, { transaction });
          }

          const newQty = Number(inv.quantity) + Number(item.quantity);
          await inv.update({ quantity: newQty }, { transaction });

          await InventoryLedger.create({
            material_id: item.material_id,
            warehouse_id: destWhId,
            transaction_type: 'STN_IN',
            transaction_id: storeTransaction.id,
            transaction_number: finalNumber,
            transaction_date: storeTransaction.transaction_date,
            quantity_in: item.quantity,
            quantity_out: 0,
            balance_quantity: newQty,
            unit: item.unit || matUnit,
            batch_number: item.batch_number
          }, { transaction });
        }
      }
      // --- SRN LOGIC ---
      else if (storeTransaction.transaction_type === 'SRN') {
        // A. Source OUT
        let sourceWhId = storeTransaction.warehouse_id;
        if (!sourceWhId && storeTransaction.from_project_id) {
          const siteWh = await Warehouse.findOne({ where: { project_id: storeTransaction.from_project_id, type: 'site' }, transaction });
          if (siteWh) sourceWhId = siteWh.id;
        }

        if (sourceWhId) {
          const [inv] = await Inventory.findOrCreate({
            where: { warehouse_id: sourceWhId, material_id: item.material_id },
            defaults: { warehouse_id: sourceWhId, material_id: item.material_id, quantity: 0, reserved_quantity: 0 },
            transaction
          });
          const currentQty = Number(inv.quantity);
          const newQty = currentQty - Number(item.quantity);

          await inv.update({ quantity: newQty }, { transaction });

          await InventoryLedger.create({
            material_id: item.material_id,
            warehouse_id: sourceWhId,
            transaction_type: 'SRN_OUT',
            transaction_id: storeTransaction.id,
            transaction_number: finalNumber,
            transaction_date: storeTransaction.transaction_date,
            quantity_in: 0,
            quantity_out: item.quantity,
            balance_quantity: newQty,
            unit: item.unit || matUnit,
            batch_number: item.batch_number
          }, { transaction });
        }

        // B. Destination IN
        let destWhId = storeTransaction.to_warehouse_id;
        if (!destWhId && storeTransaction.to_project_id) {
          const siteWh = await Warehouse.findOne({ where: { project_id: storeTransaction.to_project_id, type: 'site' }, transaction });
          if (siteWh) destWhId = siteWh.id;
        }

        if (destWhId) {
          const [inv] = await Inventory.findOrCreate({
            where: { warehouse_id: destWhId, material_id: item.material_id },
            defaults: { warehouse_id: destWhId, material_id: item.material_id, quantity: 0, reserved_quantity: 0 },
            transaction
          });

          const newQty = Number(inv.quantity) + Number(item.quantity);
          await inv.update({ quantity: newQty }, { transaction });

          await InventoryLedger.create({
            material_id: item.material_id,
            warehouse_id: destWhId,
            transaction_type: 'SRN_IN',
            transaction_id: storeTransaction.id,
            transaction_number: finalNumber,
            transaction_date: storeTransaction.transaction_date,
            quantity_in: item.quantity,
            quantity_out: 0,
            balance_quantity: newQty,
            unit: item.unit || matUnit,
            batch_number: item.batch_number
          }, { transaction });
        }
      }
      // --- CONSUMPTION LOGIC ---
      else if (storeTransaction.transaction_type === 'CONSUMPTION') {
        let locWhId = storeTransaction.warehouse_id;
        if (!locWhId && storeTransaction.project_id) {
          const siteWh = await Warehouse.findOne({ where: { project_id: storeTransaction.project_id, type: 'site' }, transaction });
          if (siteWh) locWhId = siteWh.id;
        }

        if (locWhId) {
          const [inv] = await Inventory.findOrCreate({
            where: { warehouse_id: locWhId, material_id: item.material_id },
            defaults: { warehouse_id: locWhId, material_id: item.material_id, quantity: 0, reserved_quantity: 0 },
            transaction
          });
          const currQty = Number(inv.quantity);
          const totalOut = Number(item.quantity) + Number((item as any).wastage_quantity || 0);
          const newQty = currQty - totalOut;

          await inv.update({ quantity: newQty }, { transaction });

          await InventoryLedger.create({
            material_id: item.material_id,
            warehouse_id: locWhId,
            transaction_type: 'CONSUMPTION',
            transaction_id: storeTransaction.id,
            transaction_number: finalNumber,
            transaction_date: storeTransaction.transaction_date,
            quantity_in: 0,
            quantity_out: totalOut,
            balance_quantity: newQty,
            unit: item.unit || matUnit,
            project_id: storeTransaction.project_id || storeTransaction.to_project_id,
            building_id: storeTransaction.to_building_id,
            floor_id: storeTransaction.to_floor_id,
            zone_id: storeTransaction.to_zone_id,
            work_item_type_id: (item as any).work_item_type_id,
            wastage_quantity: Number((item as any).wastage_quantity || 0),
            remarks: storeTransaction.remarks
          }, { transaction });

          // AUTO-UPDATE BOQ PROGRESS (NEW FEATURE)
          // If work_done_quantity is provided, update the BOQ item's progress
          const workDone = Number((item as any).work_done_quantity || 0);
          const workItemTypeId = (item as any).work_item_type_id;

          if (workDone > 0 && workItemTypeId && storeTransaction.project_id) {
            // Find the matching BOQ item for this location and work type
            const ProjectBOQItem = (await import('../models/ProjectBOQItem.js')).default;
            const boqItem = await ProjectBOQItem.findOne({
              where: {
                material_id: item.material_id,
                work_item_type_id: workItemTypeId,
                ...(storeTransaction.to_building_id && { building_id: storeTransaction.to_building_id }),
                ...(storeTransaction.to_floor_id && { floor_id: storeTransaction.to_floor_id }),
                ...(storeTransaction.to_zone_id && { zone_id: storeTransaction.to_zone_id })
              } as any,
              include: [{
                association: 'boq',
                where: { project_id: storeTransaction.project_id, is_active: true }
              }],
              transaction
            });

            if (boqItem) {
              // Increment both consumed quantity and completed work
              await boqItem.increment({
                consumed_quantity: Number(item.quantity),
                total_completed_work: workDone
              }, { transaction });
            }
          }
        }
      }
    }

    // 3. Update transaction status
    const updateData: any = {
      status: 'approved',
      approved_by: req.user!.id,
    }

    if (storeTransaction.transaction_number !== finalNumber) {
      updateData.transaction_number = finalNumber
    }

    await storeTransaction.update(updateData, { transaction })

    await transaction.commit()

    res.json({
      success: true,
      message: `${storeTransaction.transaction_type} approved successfully`,
      transaction: {
        ...storeTransaction.toJSON(),
        transaction_number: finalNumber
      }
    })
  } catch (error: any) {
    if (transaction) await transaction.rollback()

    console.error('--- APPROVAL ERROR START ---');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);

    if (error.errors) {
      error.errors.forEach((e: any) => {
        console.error(`Field: ${e.path}, Message: ${e.message}, Value: ${e.value}, Type: ${e.type}`);
      });
    }

    if (error.parent) {
      console.error('Parent Error (DB):', error.parent.message);
    }

    console.error('Context:', {
      transactionId: req.params.id,
      finalNumber,
      updateData
    });
    console.error('--- APPROVAL ERROR END ---');

    next(error)
  }
}

export const rejectTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { remarks } = req.body

    const storeTransaction = await StoreTransaction.findByPk(id)

    if (!storeTransaction) {
      throw createError('Transaction not found', 404)
    }

    await storeTransaction.update({
      status: 'rejected',
      approved_by: req.user!.id,
      remarks: remarks || storeTransaction.remarks,
    })

    res.json({
      success: true,
      message: 'Transaction rejected successfully',
      transaction: storeTransaction,
    })
  } catch (error) {
    next(error)
  }
}

