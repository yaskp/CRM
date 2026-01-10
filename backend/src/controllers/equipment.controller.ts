import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Equipment from '../models/Equipment'
import EquipmentRental from '../models/EquipmentRental'
import EquipmentBreakdown from '../models/EquipmentBreakdown'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'

export const createEquipment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      equipment_code,
      name,
      equipment_type,
      manufacturer,
      model,
      registration_number,
      is_rental,
      owner_vendor_id,
    } = req.body

    if (!equipment_code || !name || !equipment_type) {
      throw createError('Equipment code, name, and type are required', 400)
    }

    const equipment = await Equipment.create({
      equipment_code,
      name,
      equipment_type,
      manufacturer,
      model,
      registration_number,
      is_rental: is_rental || false,
      owner_vendor_id,
    })

    res.status(201).json({
      success: true,
      message: 'Equipment created successfully',
      equipment,
    })
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(createError('Equipment code already exists', 400))
    }
    next(error)
  }
}

export const getEquipment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, equipment_type, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (equipment_type) where.equipment_type = equipment_type
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { equipment_code: { [Op.like]: `%${search}%` } },
      ]
    }

    const { count, rows } = await Equipment.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['name', 'ASC']],
      include: [
        {
          association: 'ownerVendor',
          attributes: ['id', 'name'],
        },
      ],
    })

    res.json({
      success: true,
      equipment: rows,
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

export const createEquipmentRental = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      project_id,
      equipment_id,
      vendor_id,
      start_date,
      end_date,
      rate_per_day,
      rate_per_sq_meter,
    } = req.body

    if (!project_id || !equipment_id || !vendor_id || !start_date) {
      throw createError('Project, Equipment, Vendor, and Start date are required', 400)
    }

    const start = new Date(start_date)
    const end = end_date ? new Date(end_date) : new Date()
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    let totalAmount = 0
    if (rate_per_day) {
      totalAmount = Number(rate_per_day) * totalDays
    }

    const rental = await EquipmentRental.create({
      project_id,
      equipment_id,
      vendor_id,
      start_date,
      end_date,
      rate_per_day,
      rate_per_sq_meter,
      total_days: totalDays,
      total_amount: totalAmount,
      breakdown_deduction_amount: 0,
      net_amount: totalAmount,
      status: 'active',
    })

    res.status(201).json({
      success: true,
      message: 'Equipment rental created successfully',
      rental,
    })
  } catch (error) {
    next(error)
  }
}

export const getEquipmentRentals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { project_id, status, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (project_id) where.project_id = project_id
    if (status) where.status = status

    const { count, rows } = await EquipmentRental.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['start_date', 'DESC']],
      include: [
        {
          association: 'project',
          attributes: ['id', 'name', 'project_code'],
        },
        {
          association: 'equipment',
          attributes: ['id', 'name', 'equipment_code'],
        },
        {
          association: 'vendor',
          attributes: ['id', 'name'],
        },
        {
          association: 'breakdowns',
        },
      ],
    })

    res.json({
      success: true,
      rentals: rows,
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

export const reportEquipmentBreakdown = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      rental_id,
      breakdown_date,
      breakdown_time,
      breakdown_reason,
      resolution_date,
      resolution_time,
    } = req.body

    if (!rental_id || !breakdown_date) {
      throw createError('Rental ID and breakdown date are required', 400)
    }

    const rental = await EquipmentRental.findByPk(rental_id)
    if (!rental) {
      throw createError('Rental not found', 404)
    }

    // Calculate breakdown hours
    let breakdownHours = 0
    if (breakdown_date && resolution_date && breakdown_time && resolution_time) {
      const breakdownDateTime = new Date(`${breakdown_date}T${breakdown_time}`)
      const resolutionDateTime = new Date(`${resolution_date}T${resolution_time}`)
      breakdownHours = (resolutionDateTime.getTime() - breakdownDateTime.getTime()) / (1000 * 60 * 60)
    }

    // Calculate deduction amount based on rate per day
    let deductionAmount = 0
    if (rental.rate_per_day && breakdownHours > 0) {
      const hoursPerDay = 24
      deductionAmount = (Number(rental.rate_per_day) / hoursPerDay) * breakdownHours
    }

    const breakdown = await EquipmentBreakdown.create({
      rental_id,
      breakdown_date,
      breakdown_time,
      resolution_date,
      resolution_time,
      breakdown_hours: breakdownHours,
      breakdown_reason,
      deduction_amount: deductionAmount,
      reported_by: req.user!.id,
    })

    // Update rental with total deductions
    const allBreakdowns = await EquipmentBreakdown.findAll({
      where: { rental_id },
    })
    const totalDeductions = allBreakdowns.reduce((sum, bd) => sum + Number(bd.deduction_amount || 0), 0)
    const netAmount = (rental.total_amount || 0) - totalDeductions

    await rental.update({
      breakdown_deduction_amount: totalDeductions,
      net_amount: netAmount,
    })

    res.status(201).json({
      success: true,
      message: 'Breakdown reported successfully',
      breakdown,
      rental: await EquipmentRental.findByPk(rental_id),
    })
  } catch (error) {
    next(error)
  }
}

export const getBreakdownsByRental = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const breakdowns = await EquipmentBreakdown.findAll({
      where: { rental_id: id },
      include: [
        {
          association: 'reporter',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['breakdown_date', 'DESC']],
    })

    res.json({
      success: true,
      breakdowns,
    })
  } catch (error) {
    next(error)
  }
}

