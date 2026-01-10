import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Row, Col, Space, Table, Divider } from 'antd'
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { dprService } from '../../services/api/dpr'
import { projectService } from '../../services/api/projects'
import { dprSchema, DPRFormData } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

interface ManpowerEntry {
  id?: number
  worker_type: 'steel_worker' | 'concrete_worker' | 'department_worker' | 'electrician' | 'welder'
  count: number
  hajri: '1' | '1.5' | '2'
}

const DPRForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [manpower, setManpower] = useState<ManpowerEntry[]>([])

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<DPRFormData>({
    resolver: zodResolver(dprSchema),
    defaultValues: {
      report_date: dayjs().format('YYYY-MM-DD'),
    },
  })

  useEffect(() => {
    fetchProjects()
    if (id) {
      fetchDPR()
    }
  }, [id])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects()
      setProjects(response.projects || [])
    } catch (error) {
      message.error('Failed to fetch projects')
    }
  }

  const fetchDPR = async () => {
    setLoading(true)
    try {
      const response = await dprService.getDPR(Number(id))
      const dpr = response.dpr
      
      Object.keys(dpr).forEach((key) => {
        if (key !== 'manpower' && dpr[key] !== null && dpr[key] !== undefined) {
          setValue(key as any, dpr[key])
        }
      })

      if (dpr.manpower && Array.isArray(dpr.manpower)) {
        setManpower(dpr.manpower)
        setValue('manpower', dpr.manpower)
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch DPR')
    } finally {
      setLoading(false)
    }
  }

  const addManpower = () => {
    const newEntry: ManpowerEntry = {
      worker_type: 'steel_worker',
      count: 0,
      hajri: '1',
    }
    const updated = [...manpower, newEntry]
    setManpower(updated)
    setValue('manpower', updated)
  }

  const removeManpower = (index: number) => {
    const updated = manpower.filter((_, i) => i !== index)
    setManpower(updated)
    setValue('manpower', updated)
  }

  const updateManpower = (index: number, field: keyof ManpowerEntry, value: any) => {
    const updated = [...manpower]
    updated[index] = { ...updated[index], [field]: value }
    setManpower(updated)
    setValue('manpower', updated)
  }

  const onSubmit = async (data: DPRFormData) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        manpower: manpower.length > 0 ? manpower : undefined,
      }

      if (id) {
        await dprService.updateDPR(Number(id), payload)
        message.success('DPR updated successfully!')
      } else {
        await dprService.createDPR(payload)
        message.success('DPR created successfully!')
      }
      navigate('/operations/dpr')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save DPR')
    } finally {
      setLoading(false)
    }
  }

  const manpowerColumns = [
    {
      title: 'Worker Type',
      key: 'worker_type',
      render: (_: any, record: ManpowerEntry, index: number) => (
        <Select
          style={{ width: '100%' }}
          value={record.worker_type}
          onChange={(value) => updateManpower(index, 'worker_type', value)}
        >
          <Option value="steel_worker">Steel Worker</Option>
          <Option value="concrete_worker">Concrete Worker</Option>
          <Option value="department_worker">Department Worker</Option>
          <Option value="electrician">Electrician</Option>
          <Option value="welder">Welder</Option>
        </Select>
      ),
    },
    {
      title: 'Count',
      key: 'count',
      render: (_: any, record: ManpowerEntry, index: number) => (
        <InputNumber
          style={{ width: '100%' }}
          value={record.count}
          min={0}
          onChange={(value) => updateManpower(index, 'count', value || 0)}
        />
      ),
    },
    {
      title: 'Hajri',
      key: 'hajri',
      render: (_: any, record: ManpowerEntry, index: number) => (
        <Select
          style={{ width: '100%' }}
          value={record.hajri}
          onChange={(value) => updateManpower(index, 'hajri', value)}
        >
          <Option value="1">1</Option>
          <Option value="1.5">1.5</Option>
          <Option value="2">2</Option>
        </Select>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ManpowerEntry, index: number) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeManpower(index)}
        >
          Remove
        </Button>
      ),
    },
  ]

  return (
    <Card
      title={id ? 'Edit DPR' : 'Create Daily Progress Report'}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/operations/dpr')}>
          Back
        </Button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Project"
              validateStatus={errors.project_id ? 'error' : ''}
              help={errors.project_id?.message}
              required
            >
              <Controller
                name="project_id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Project"
                    showSearch
                    optionFilterProp="children"
                  >
                    {projects.map((project) => (
                      <Option key={project.id} value={project.id}>
                        {project.name} ({project.project_code})
                      </Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Report Date"
              validateStatus={errors.report_date ? 'error' : ''}
              help={errors.report_date?.message}
              required
            >
              <Controller
                name="report_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Site Location">
              <Controller
                name="site_location"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter site location" />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Panel Number">
              <Controller
                name="panel_number"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter panel number" />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Guide Wall (Running Meter)">
              <Controller
                name="guide_wall_running_meter"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    style={{ width: '100%' }}
                    placeholder="Guide wall in meters"
                    min={0}
                    step={0.01}
                    value={field.value}
                    onChange={(value) => field.onChange(value || undefined)}
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Steel Quantity (kg)">
              <Controller
                name="steel_quantity_kg"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    style={{ width: '100%' }}
                    placeholder="Steel quantity in kg"
                    min={0}
                    step={0.01}
                    value={field.value}
                    onChange={(value) => field.onChange(value || undefined)}
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Concrete Quantity (m³)">
              <Controller
                name="concrete_quantity_cubic_meter"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    style={{ width: '100%' }}
                    placeholder="Concrete quantity in cubic meters"
                    min={0}
                    step={0.01}
                    value={field.value}
                    onChange={(value) => field.onChange(value || undefined)}
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Polymer Consumption (bags)">
              <Controller
                name="polymer_consumption_bags"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    style={{ width: '100%' }}
                    placeholder="Number of bags"
                    min={0}
                    value={field.value}
                    onChange={(value) => field.onChange(value || undefined)}
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Diesel Consumption (liters)">
              <Controller
                name="diesel_consumption_liters"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    style={{ width: '100%' }}
                    placeholder="Diesel in liters"
                    min={0}
                    step={0.01}
                    value={field.value}
                    onChange={(value) => field.onChange(value || undefined)}
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Weather Conditions">
              <Controller
                name="weather_conditions"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g., Sunny, Rainy, Cloudy" />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label="Remarks">
              <Controller
                name="remarks"
                control={control}
                render={({ field }) => (
                  <TextArea {...field} rows={3} placeholder="Enter any remarks" />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Manpower Report</Divider>

        <Card
          title="Manpower Entry"
          extra={
            <Button type="dashed" icon={<PlusOutlined />} onClick={addManpower}>
              Add Manpower Entry
            </Button>
          }
          style={{ marginTop: 16 }}
        >
          <Table
            columns={manpowerColumns}
            dataSource={manpower}
            rowKey={(_, index) => index.toString()}
            pagination={false}
            locale={{ emptyText: 'No manpower entries. Click "Add Manpower Entry" to add.' }}
          />
        </Card>

        <Space style={{ marginTop: 24, width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate('/operations/dpr')}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
            {id ? 'Update' : 'Create'} DPR
          </Button>
        </Space>
      </form>
    </Card>
  )
}

export default DPRForm

