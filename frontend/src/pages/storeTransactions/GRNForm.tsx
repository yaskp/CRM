import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, App, Select, DatePicker, InputNumber, Table, Space, Row, Col, Typography, Tag, Upload } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  LoadingOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { storeTransactionService } from '../../services/api/storeTransactions'
import { materialService } from '../../services/api/materials'
import { warehouseService } from '../../services/api/warehouses'
import { projectService } from '../../services/api/projects'
import { vendorService } from '../../services/api/vendors'
import { purchaseOrderService } from '../../services/api/purchaseOrders'
import { workOrderService } from '../../services/api/workOrders'
import { uploadService } from '../../services/api/upload'
import { grnSchema, GRNFormData } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import dayjs from 'dayjs'
import { PageContainer } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

const API_FILE_BASE = ((import.meta as any).env?.VITE_API_URL || '').replace('/api', '') || 'http://localhost:5000'

const getFileUrl = (url?: string) => {
  if (!url) return undefined
  if (url.startsWith('http')) return url
  return `${API_FILE_BASE}${url}`
}

interface GRNItem {
  id?: number
  material_id: number
  material_name?: string
  material_units?: string[]
  quantity: number          // Total Invoice Qty (can exceed PO qty)
  ordered_quantity?: number  // PO qty
  received_quantity_po?: number // already received against this PO item
  accepted_quantity: number // Good qty — capped at PO ordered qty
  rejected_quantity: number // total rejected = excess + defective
  excess_qty: number        // inv qty beyond PO qty (auto-calculated)
  defective_qty: number     // user-marked as defective
  unit: string
  item_status: string
  po_item_id?: number
  variance_type?: 'exact' | 'excess' | 'shortage' | 'defective'
  rejection_reason?: string
  unit_price?: number
  batch_number?: string
  expiry_date?: string
}

const GRNInternalForm = () => {
  const { message } = App.useApp()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  // Master Data
  const [materials, setMaterials] = useState<any[]>([])
  const [, setWarehouses] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [workOrders, setWorkOrders] = useState<any[]>([])

  // Filters
  const [filterProjectId, setFilterProjectId] = useState<number | null>(null)
  const [filterWorkOrderId, setFilterWorkOrderId] = useState<number | null>(null)

  const [items, setItems] = useState<GRNItem[]>([])

  const { control, handleSubmit, setValue, watch } = useForm<GRNFormData>({
    resolver: zodResolver(grnSchema),
    defaultValues: {
      transaction_date: dayjs().format('YYYY-MM-DD'),
      received_from_type: 'vendor',
      items: [],
      destination_type: 'warehouse',
      status: 'draft'
    },
  })

  // Watchers
  const po_id_val = watch('po_id')
  const challanImg = watch('challan_image')
  const invoiceImg = watch('invoice_image')
  const goodsImg = watch('goods_image')
  const receiverImg = watch('receiver_image')

  const selectedPO = purchaseOrders.find(po => po.id === po_id_val)
  const selectedVendor = vendors.find(v => v.id === watch('received_from_id'))

  useEffect(() => {
    fetchMetadata()
    if (id) {
      fetchGRN()
    }
  }, [id])

  // Sync Project Filter when PO is loaded/selected (especially on Edit)
  useEffect(() => {
    if (po_id_val && !filterProjectId && purchaseOrders.length > 0) {
      const po = purchaseOrders.find(p => p.id === po_id_val)
      if (po?.project_id) {
        setFilterProjectId(po.project_id)
      }
    }
  }, [po_id_val, purchaseOrders, filterProjectId])

  const fetchMetadata = async () => {
    try {
      const [matRes, whRes, projRes, vendRes, poRes, woRes] = await Promise.all([
        materialService.getMaterials(),
        warehouseService.getWarehouses(),
        projectService.getProjects(),
        vendorService.getVendors(),
        purchaseOrderService.getPurchaseOrders(),
        workOrderService.getWorkOrders(),
      ])

      setMaterials(matRes.materials || [])
      setWarehouses(whRes.warehouses || [])
      setProjects(projRes.projects || [])
      setVendors(vendRes.vendors || [])
      setPurchaseOrders(poRes.purchaseOrders || poRes || [])
      setWorkOrders(woRes.workOrders || woRes || [])
    } catch (error) {
      message.error('Failed to load metadata')
    }
  }

  const fetchGRN = async () => {
    setLoading(true)
    try {
      const response = await storeTransactionService.getTransaction(Number(id))
      const grn = response.transaction

      setValue('destination_type', grn.destination_type || 'warehouse')
      setValue('destination_id', grn.warehouse_id || grn.project_id)
      setValue('transaction_date', grn.transaction_date)
      setValue('remarks', grn.remarks)
      setValue('received_from_type', grn.received_from_type || 'vendor')
      setValue('received_from_id', grn.received_from_id)
      setValue('reference_number', grn.reference_number)
      setValue('challan_number', grn.challan_number)
      setValue('supplier_invoice_number', grn.supplier_invoice_number)
      setValue('lorry_receipt_number', grn.lorry_receipt_number)
      setValue('eway_bill_number', grn.eway_bill_number)

      const existingPOId = grn.po_id || undefined
      setValue('po_id', existingPOId)

      // Attempt to infer filters from existing PO
      if (existingPOId && purchaseOrders.length > 0) {
        const po = purchaseOrders.find(p => p.id === existingPOId)
        if (po && po.project_id) {
          setFilterProjectId(po.project_id)
          // We can't know the exact WO, but we set it to valid to show the PO if needed, 
          // or leave null. The user requirement is mostly for NEW selection. 
          // But to see the PO in the dropdown, we need to pass the filter logic.
          // Let's rely on the fact that if a PO is already set, we display it name in the value,
          // but the list might be filtered.
          // To be safe, let's try to find a WO for this project.
          // const wo = workOrders.find(w => w.project_id === po.project_id)
          // if (wo) setFilterWorkOrderId(wo.id)
        }
      }

      setValue('truck_number', grn.truck_number)
      setValue('driver_name', grn.driver_name)
      setValue('driver_phone', grn.driver_phone)

      setValue('challan_image', grn.challan_image)
      setValue('invoice_image', grn.invoice_image)
      setValue('goods_image', grn.goods_image)
      setValue('receiver_image', grn.receiver_image)
      setValue('status', grn.status)

      const fetchedItems = grn.items?.map((item: any) => ({
        material_id: item.material_id,
        material_name: item.material?.name,
        material_units: item.material?.unit,
        quantity: Number(item.quantity),
        ordered_quantity: item.ordered_quantity,
        accepted_quantity: item.accepted_quantity,
        rejected_quantity: item.rejected_quantity,
        unit: item.unit || (Array.isArray(item.material?.unit) ? item.material.unit[0] : item.material?.unit),
        item_status: item.item_status || 'Good',
        unit_price: item.unit_price ? Number(item.unit_price) : undefined,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
      })) || []
      setItems(fetchedItems)
      setValue('items', fetchedItems)
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch GRN')
    } finally {
      setLoading(false)
    }
  }

  const handlePOSelect = async (poId: number | null) => {
    if (!poId) {
      setItems([])
      setValue('items', [])
      return
    }

    try {
      const res = await purchaseOrderService.getPurchaseOrder(poId)
      const po = res.purchaseOrder
      if (po && po.items) {
        if (po.project_id) {
          setValue('destination_type', 'project')
          setValue('destination_id', po.project_id)
        } else if (po.warehouse_id) {
          setValue('destination_type', 'warehouse')
          setValue('destination_id', po.warehouse_id)
        }

        setValue('received_from_id', po.vendor_id)

        const poItems = po.items.map((item: any) => {
          const ordered = Number(item.quantity)
          const recPo = Number(item.received_quantity) || 0
          const balance = ordered - recPo // pending qty
          const matUnits = item.material?.unit || ['UNIT']
          const defaultQty = balance > 0 ? balance : 0

          return {
            material_id: item.material_id,
            material_name: item.material?.name,
            material_units: Array.isArray(matUnits) ? matUnits : [matUnits],
            ordered_quantity: ordered,
            received_quantity_po: recPo,
            quantity: defaultQty,           // inv qty — defaults to pending balance
            accepted_quantity: defaultQty,  // accepted — capped to PO qty
            rejected_quantity: 0,
            excess_qty: 0,                  // excess = inv qty - PO qty (auto)
            defective_qty: 0,               // defective = user-entered
            unit: item.unit || (Array.isArray(matUnits) ? matUnits[0] : matUnits),
            unit_price: Number(item.unit_price),
            po_item_id: item.id,
            item_status: 'Good',
            variance_type: 'exact'
          }
        })
        setItems(poItems)
        setValue('items', poItems)
        message.success(`PO #${po.po_number || po.temp_number} linked.`)
      }
    } catch (e) {
      message.error('Failed to load PO details')
    }
  }

  const addItem = () => {
    const newItem: GRNItem = {
      material_id: 0,
      quantity: 0,
      accepted_quantity: 0,
      rejected_quantity: 0,
      excess_qty: 0,
      defective_qty: 0,
      unit: '',
      item_status: 'Good'
    }
    const newItems = [...items, newItem]
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  const updateItem = (index: number, changes: Partial<GRNItem>) => {
    setItems((prev: any) => {
      const newItems = [...prev]
      if (newItems[index]) {
        newItems[index] = { ...newItems[index], ...changes }
      }
      return newItems
    })
  }

  useEffect(() => {
    setValue('items', items)
  }, [items, setValue])

  const handleFileUpload = async (file: File, fieldName: keyof GRNFormData) => {
    setUploadingField(fieldName)
    try {
      const res = await uploadService.upload(file, 'grn')
      setValue(fieldName, res.file.url)
      message.success('Uploaded successfully')
    } catch (error) {
      message.error('Upload failed')
    } finally {
      setUploadingField(null)
    }
  }

  const onFinalSubmit = async (data: GRNFormData, status: 'draft' | 'pending') => {
    if (items.length === 0) {
      message.error('Please add at least one item')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...data,
        status,
        items
      }

      await storeTransactionService.createGRN(payload as any)
      message.success(status === 'draft' ? 'Draft saved!' : 'GRN Request submitted!')
      navigate('/inventory/grn')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save GRN')
    } finally {
      setLoading(false)
    }
  }

  const itemColumns = [
    {
      title: 'Goods Name',
      key: 'material',
      width: 250,
      render: (_: any, record: GRNItem, index: number) => (
        <Space direction="vertical" style={{ width: '100%' }} size={0}>
          {po_id_val ? (
            <Text strong>{record.material_name || (record as any).description || 'Unknown Material'}</Text>
          ) : (
            <Select
              style={{ width: '100%' }}
              placeholder="Select material"
              value={record.material_id || undefined}
              onChange={(value) => {
                const material = materials.find(m => m.id === value)
                const units = material?.unit || ['UNIT']
                updateItem(index, {
                  material_id: value,
                  material_name: material?.name,
                  material_units: Array.isArray(units) ? units : [units],
                  unit: Array.isArray(units) ? units[0] : units
                })
              }}
              showSearch
              optionFilterProp="children"
            >
              {materials.map((m) => <Option key={m.id} value={m.id}>{m.name}</Option>)}
            </Select>
          )}
          {record.item_status === 'Defective' && <Tag color="orange" style={{ margin: 0, fontSize: '10px' }}>Quality Issue</Tag>}
          {record.item_status === 'Shortage' && <Tag color="red" style={{ margin: 0, fontSize: '10px' }}>Short Receipt</Tag>}
          {record.item_status === 'Excess' && <Tag color="cyan" style={{ margin: 0, fontSize: '10px' }}>Extra Recd</Tag>}
        </Space>
      ),
    },
    {
      title: 'Po Qty',
      dataIndex: 'ordered_quantity',
      key: 'ordered',
      width: 80,
      render: (val: number) => <Text>{val || '-'}</Text>
    },
    {
      title: 'Balance Qty',
      key: 'balance',
      width: 100,
      render: (_: any, record: GRNItem) => {
        const bal = (record.ordered_quantity || 0) - (record.received_quantity_po || 0)
        return <Tag color={bal > 0 ? 'blue' : 'default'} style={{ border: 'none' }}>{bal > 0 ? bal.toFixed(2) : '-'}</Tag>
      }
    },
    {
      title: 'Inv Qty',
      key: 'inv_qty',
      width: 100,
      render: (_: any, record: GRNItem, index: number) => {
        const poQty = record.ordered_quantity || 0
        const invQty = record.quantity || 0
        return (
          <InputNumber
            style={{ width: '100%', borderColor: invQty > poQty && poQty > 0 ? '#faad14' : undefined }}
            value={record.quantity}
            min={0}
            // NO max — invoice can have more than PO qty
            controls={false}
            onChange={(val) => {
              const qty = val || 0
              const excess = poQty > 0 ? Math.max(0, qty - poQty) : 0
              // Accepted cannot exceed PO ordered qty
              const maxAccepted = poQty > 0 ? poQty : qty
              const newAccepted = Math.min(qty - excess, maxAccepted)
              const totalRej = excess + (record.defective_qty || 0)
              updateItem(index, {
                quantity: qty,
                excess_qty: excess,
                accepted_quantity: newAccepted >= 0 ? newAccepted : 0,
                rejected_quantity: totalRej
              })
            }}
          />
        )
      }
    },
    {
      title: 'Accepted (Good)',
      key: 'accepted',
      width: 110,
      render: (_: any, record: GRNItem, index: number) => {
        const maxAcc = record.ordered_quantity || record.quantity || 0
        return (
          <InputNumber
            style={{ width: '100%', borderColor: '#52c41a' }}
            value={record.accepted_quantity}
            min={0}
            max={maxAcc}  // Cannot accept more than PO qty
            controls={false}
            placeholder={`max ${maxAcc}`}
            onChange={(val) => {
              const acc = Math.min(val || 0, maxAcc)
              updateItem(index, { accepted_quantity: acc })
            }}
          />
        )
      }
    },
    {
      title: 'Excess Qty',
      key: 'excess',
      width: 90,
      render: (_: any, record: GRNItem) => {
        const excess = record.excess_qty || 0
        if (excess <= 0) return <Text type="secondary">-</Text>
        return <Tag color="purple" style={{ margin: 0 }}>+{excess}</Tag>
      }
    },
    {
      title: 'Defective Qty',
      key: 'defective',
      width: 110,
      render: (_: any, record: GRNItem, index: number) => (
        <InputNumber
          style={{ width: '100%', borderColor: (record.defective_qty || 0) > 0 ? '#ff4d4f' : undefined }}
          value={record.defective_qty || 0}
          min={0}
          controls={false}
          placeholder="0"
          onChange={(val) => {
            const def = val || 0
            const totalRej = (record.excess_qty || 0) + def
            updateItem(index, { defective_qty: def, rejected_quantity: totalRej })
          }}
        />
      )
    },
    {
      title: 'Status / Variance',
      key: 'status_calc',
      width: 160,
      render: (_: any, record: GRNItem) => {
        const poQty = record.ordered_quantity || 0
        const invQty = record.quantity || 0
        const accepted = record.accepted_quantity || 0
        const defective = record.defective_qty || 0
        const excess = record.excess_qty || 0
        // Pending = PO qty not yet received in this GRN
        const alreadyRecvd = record.received_quantity_po || 0
        const pending = Math.max(0, poQty - alreadyRecvd - invQty)

        return (
          <Space direction="vertical" size={2}>
            {excess > 0 && <Tag color="purple" style={{ margin: 0 }}>Excess: +{excess}</Tag>}
            {defective > 0 && <Tag color="orange" style={{ margin: 0 }}>Defective: {defective}</Tag>}
            {pending > 0 && <Tag color="blue" style={{ margin: 0 }}>Pending: {pending}</Tag>}
            {excess === 0 && defective === 0 && pending === 0 && <Tag color="success" style={{ margin: 0 }}>Complete ✓</Tag>}
            <Text type="secondary" style={{ fontSize: '10px' }}>Accepted: {accepted}</Text>
          </Space>
        )
      }
    },
    {
      title: 'Unit',
      key: 'unit',
      width: 100,
      render: (_: any, record: GRNItem, index: number) => (
        <Select
          style={{ width: '100%' }}
          value={record.unit}
          onChange={u => updateItem(index, { unit: u })}
        >
          {record.material_units?.map(u => <Option key={u} value={u}>{u}</Option>)}
        </Select>
      )
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_: any, __: any, index: number) => (
        !po_id_val && <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeItem(index)} />
      )
    }
  ]

  const uploadBox = (title: string, fieldName: keyof GRNFormData, currentUrl?: string) => (
    <div style={{ textAlign: 'center' }}>
      <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>{title}</Text>
      <Upload
        showUploadList={false}
        beforeUpload={f => { handleFileUpload(f, fieldName); return false; }}
      >
        <div style={{
          width: '100px',
          height: '100px',
          border: '1px dashed #d9d9d9',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: '#fafafa',
          margin: '0 auto',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {uploadingField === fieldName ? (
            <LoadingOutlined style={{ fontSize: 24 }} />
          ) : currentUrl ? (
            <img
              src={getFileUrl(currentUrl)}
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#999' }}>
              <CloudUploadOutlined style={{ fontSize: '24px', marginBottom: 4 }} />
              <span style={{ fontSize: '10px' }}>Click to Upload</span>
            </div>
          )}
        </div>
      </Upload>
      {currentUrl ? (
        <Button
          type="link"
          size="small"
          onClick={() => {
            const url = getFileUrl(currentUrl);
            if (url) window.open(url, '_blank');
          }}
          style={{ fontSize: '11px', padding: '4px 0' }}
        >
          View Full
        </Button>
      ) : <div style={{ height: 24 }}></div>}
    </div>
  )

  return (
    <PageContainer maxWidth={1400}>
      <Card loading={loading} style={{ marginBottom: '24px', borderRadius: '12px', overflow: 'hidden', padding: 0 }} styles={{ body: { padding: 0 } }}>
        {/* Top Header Area */}
        <div style={{ background: '#f8fbfc', padding: '20px 24px', borderBottom: '1px solid #e1e8ed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {id ? 'Modify Goods Receipt' : 'Create Goods Receipt'}
            </Typography.Title>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inventory/grn')}>Back to List</Button>
              <Button type="primary" style={{ background: theme.colors.primary.main }} onClick={handleSubmit(d => onFinalSubmit(d, 'draft'))}>Save Changes</Button>
              <Button type="primary" style={{ background: '#27ae60', borderColor: '#27ae60' }} onClick={handleSubmit(d => onFinalSubmit(d, 'pending'))}>Mark As Complete</Button>
            </Space>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px' }}>
          <Row gutter={24}>
            {/* Metadata Panel */}
            <Col xs={24} lg={10}>
              <div style={{ background: '#edf4ff', padding: '20px', borderRadius: '8px', height: '100%' }}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>PROJECT (Filter)</Text>
                    <Select
                      style={{ width: '100%', marginTop: '4px' }}
                      placeholder="Select Project..."
                      value={filterProjectId}
                      onChange={(val) => {
                        setFilterProjectId(val)
                        setFilterWorkOrderId(null)
                        setValue('po_id', undefined) // Reset PO when project changes
                        setItems([])
                      }}
                      showSearch
                      optionFilterProp="children"
                    >
                      {/* Only show projects that have at least one Work Order? 
                            User said: "list of project for hwom wokrorder is created" 
                        */}
                      {projects.filter(p => workOrders.some(wo => wo.project_id === p.id)).map(p => (
                        <Option key={p.id} value={p.id}>{p.name}</Option>
                      ))}
                    </Select>
                  </Col>

                  <Col span={24}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>WORK ORDER (Required)</Text>
                    <Select
                      style={{ width: '100%', marginTop: '4px' }}
                      placeholder={filterProjectId ? "Select Work Order..." : "Select Project First"}
                      value={filterWorkOrderId}
                      onChange={(val) => {
                        setFilterWorkOrderId(val)
                        setValue('po_id', undefined) // Reset PO when WO changes
                        setItems([])
                      }}
                      disabled={!filterProjectId}
                    >
                      {workOrders
                        .filter(wo => wo.project_id === filterProjectId && (wo.status === 'active' || wo.status === 'approved' || wo.status === 'completed'))
                        .map(wo => (
                          <Option key={wo.id} value={wo.id}>{wo.work_order_number}</Option>
                        ))}
                    </Select>
                  </Col>

                  <Col span={24}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>PO NUMBER</Text>
                    <Controller
                      name="po_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          style={{ width: '100%', marginTop: '4px' }}
                          placeholder={filterWorkOrderId ? "Select PO..." : "Select Work Order First"}
                          disabled={!filterWorkOrderId && !id} // Disabled if no WO selected, unless editing
                          onChange={(val) => { field.onChange(val); handlePOSelect(val); }}
                          allowClear
                          showSearch
                        >
                          {purchaseOrders
                            .filter(po => {
                              // If editing and this is the selected PO, show it regardless of filters
                              if (id && po.id === po_id_val) return true;

                              // Otherwise apply strict filters
                              if (!filterProjectId) return false;
                              return po.project_id === filterProjectId && (po.status === 'approved' || po.status === 'Approved');
                            })
                            .map(po => (
                              <Option key={po.id} value={po.id}>{po.po_number || po.temp_number}</Option>
                            ))}
                        </Select>
                      )}
                    />
                    {selectedPO && <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>Number: {selectedPO.po_number || selectedPO.temp_number}</div>}
                  </Col>
                  <Col span={24}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>SUPPLIER</Text>
                    <div style={{ marginTop: '4px', fontWeight: 600 }}>{selectedVendor?.name || (po_id_val ? 'Loading...' : 'Select PO First')}</div>
                  </Col>
                  <Col span={24}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>GOODS RECEIPT NUMBER</Text>
                    <div style={{ marginTop: '4px', color: '#666' }}>{id ? `GRN-${id}` : `TEMP-GRN-${dayjs().format('YYYY/MM')}#NEW`}</div>
                  </Col>
                  <Col span={24}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>GOODS RECEIVED DATE</Text>
                    <Controller
                      name="transaction_date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          {...field}
                          style={{ width: '100%', marginTop: '4px' }}
                          value={field.value ? dayjs(field.value) : null}
                          onChange={d => field.onChange(d?.format('YYYY-MM-DD'))}
                        />
                      )}
                    />
                  </Col>
                  <Col span={24}>
                    <Controller name="remarks" control={control} render={({ field }) => <TextArea {...field} rows={3} placeholder="Comments.." style={{ borderRadius: '8px' }} />} />
                  </Col>
                </Row>
              </div>
            </Col>

            {/* Logistics Panel */}
            <Col xs={24} lg={14}>
              <div style={{ padding: '0 0 0 12px' }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Challan Number">
                      <Controller name="challan_number" control={control} render={({ field }) => <Input {...field} placeholder="0" />} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Supplier Invoice Number">
                      <Controller name="supplier_invoice_number" control={control} render={({ field }) => <Input {...field} placeholder="0" />} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Lorry / Vehicle Number">
                      <Controller name="truck_number" control={control} render={({ field }) => <Input {...field} placeholder="0" />} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="E-Way Bill Number">
                      <Controller name="eway_bill_number" control={control} render={({ field }) => <Input {...field} placeholder="0" />} />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #f0f0f0', borderRadius: '12px' }}>
                  <Row gutter={[16, 16]} justify="space-around">
                    <Col xs={12} sm={6}>{uploadBox('Challan / E-Way / LR', 'challan_image', challanImg)}</Col>
                    <Col xs={12} sm={6}>{uploadBox('Supplier Invoice', 'invoice_image', invoiceImg)}</Col>
                    <Col xs={12} sm={6}>{uploadBox('Goods Photo', 'goods_image', goodsImg)}</Col>
                    <Col xs={12} sm={6}>{uploadBox('Receiver Image', 'receiver_image', receiverImg)}</Col>
                  </Row>
                </div>
              </div>
            </Col>
          </Row>

          <div style={{ marginTop: '40px' }}>
            <Typography.Title level={5} style={{ marginBottom: '16px' }}>Goods Items : Received quantity</Typography.Title>
            <Table
              columns={itemColumns}
              dataSource={items}
              rowKey={(_, i) => String(i)}
              pagination={false}
              bordered
              size="middle"
              scroll={{ x: 'max-content' }}
            />
            {!po_id_val && (
              <Button type="dashed" block icon={<PlusOutlined />} onClick={addItem} style={{ marginTop: '16px', height: '40px' }}>
                Add Manual Item
              </Button>
            )}
          </div>
        </div>
      </Card>
    </PageContainer>
  )
}

const GRNForm = () => (
  <App>
    <GRNInternalForm />
  </App>
)

export default GRNForm
