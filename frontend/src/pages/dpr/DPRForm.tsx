import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Row, Col, Space, Table, Typography } from 'antd'
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  BarChartOutlined,
  CloudOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { dprService } from '../../services/api/dpr'
import { projectService } from '../../services/api/projects'
import { dprSchema, DPRFormData } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import {
  getPrimaryButtonStyle,
  getSecondaryButtonStyle,
  largeInputStyle,
  getLabelStyle,
  flexBetweenStyle,
  actionCardStyle,
  prefixIconStyle
} from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

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

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<DPRFormData>({
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
      width: '40%',
      render: (_: any, record: ManpowerEntry, index: number) => (
        <Select
          style={{ width: '100%' }}
          value={record.worker_type}
          onChange={(value) => updateManpower(index, 'worker_type', value)}
          size="large"
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
      title: 'Head Count',
      key: 'count',
      width: '25%',
      render: (_: any, record: ManpowerEntry, index: number) => (
        <InputNumber
          style={{ width: '100%' }}
          value={record.count}
          min={0}
          onChange={(value) => updateManpower(index, 'count', value || 0)}
          size="large"
          placeholder="0"
        />
      ),
    },
    {
      title: 'Hajri (Shift)',
      key: 'hajri',
      width: '25%',
      render: (_: any, record: ManpowerEntry, index: number) => (
        <Select
          style={{ width: '100%' }}
          value={record.hajri}
          onChange={(value) => updateManpower(index, 'hajri', value)}
          size="large"
        >
          <Option value="1">1 (Full Day)</Option>
          <Option value="1.5">1.5 (OT)</Option>
          <Option value="2">2 (Double)</Option>
        </Select>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, __: any, index: number) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeManpower(index)}
          style={{ padding: 0 }}
        />
      ),
    },
  ]

  return (
    <PageContainer maxWidth={1100}>
      <PageHeader
        title={id ? 'Edit Progress Report' : 'New Daily Progress Report'}
        subtitle={id ? `Updating DPR Entry #${id}` : 'Record today\'s site metrics, manpower consumption, and progress details'}
        icon={<DashboardOutlined />}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <SectionCard title="Basic Site Details" icon={<EnvironmentOutlined />}>
              <Form.Item
                label={<span style={getLabelStyle()}>Project Selection</span>}
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
                      placeholder="Which project is this for?"
                      showSearch
                      optionFilterProp="children"
                      size="large"
                      style={largeInputStyle}
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

              <Form.Item
                label={<span style={getLabelStyle()}>Reporting Date</span>}
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
                      style={{ width: '100%', ...largeInputStyle }}
                      format="DD-MMM-YYYY"
                      size="large"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                    />
                  )}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={<span style={getLabelStyle()}>Site Location</span>}>
                    <Controller
                      name="site_location"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Specific area/site" style={largeInputStyle} size="large" />
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={<span style={getLabelStyle()}>Panel Selection</span>}>
                    <Controller
                      name="panel_number"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Panel ID" style={largeInputStyle} size="large" />
                      )}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </SectionCard>
          </Col>

          <Col xs={24} lg={12}>
            <SectionCard title="Progress Metrics" icon={<BarChartOutlined />}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={<span style={getLabelStyle()}>Guide Wall (m)</span>}>
                    <Controller
                      name="guide_wall_running_meter"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          style={{ width: '100%', ...largeInputStyle }}
                          placeholder="0.00"
                          min={0}
                          step={0.01}
                          size="large"
                        />
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={<span style={getLabelStyle()}>Steel Usage (kg)</span>}>
                    <Controller
                      name="steel_quantity_kg"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          style={{ width: '100%', ...largeInputStyle }}
                          placeholder="0.00"
                          min={0}
                          step={0.01}
                          size="large"
                        />
                      )}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={<span style={getLabelStyle()}>Concrete (m³)</span>}>
                    <Controller
                      name="concrete_quantity_cubic_meter"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          style={{ width: '100%', ...largeInputStyle }}
                          placeholder="0.00"
                          min={0}
                          step={0.01}
                          size="large"
                        />
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={<span style={getLabelStyle()}>Polymer Bags</span>}>
                    <Controller
                      name="polymer_consumption_bags"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          style={{ width: '100%', ...largeInputStyle }}
                          placeholder="0"
                          min={0}
                          size="large"
                        />
                      )}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label={<span style={getLabelStyle()}>Diesel Consumption (Liters)</span>}>
                <Controller
                  name="diesel_consumption_liters"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      style={{ width: '100%', ...largeInputStyle }}
                      placeholder="0.00"
                      min={0}
                      step={0.01}
                      size="large"
                      prefix={<ExperimentOutlined style={{ color: theme.colors.neutral.gray400 }} />}
                    />
                  )}
                />
              </Form.Item>
            </SectionCard>
          </Col>
        </Row>

        <div style={{ marginTop: theme.spacing.lg }}>
          <SectionCard
            title="Manpower Consumption"
            icon={<TeamOutlined />}
            extra={
              <Button type="dashed" icon={<PlusOutlined />} onClick={addManpower} style={{ borderRadius: '6px' }}>
                Add Worker Type
              </Button>
            }
          >
            <Table
              columns={manpowerColumns}
              dataSource={manpower}
              rowKey={(_, index) => (index || 0).toString()}
              pagination={false}
              bordered
              scroll={{ x: 800 }}
              locale={{ emptyText: <div style={{ padding: '20px' }}><Text type="secondary">No manpower reported for today. Click "Add Worker Type" to record consumption.</Text></div> }}
            />
          </SectionCard>
        </div>

        <Row gutter={24} style={{ marginTop: theme.spacing.lg }}>
          <Col xs={24} lg={12}>
            <SectionCard title="Site Conditions" icon={<CloudOutlined />}>
              <Form.Item label={<span style={getLabelStyle()}>Weather Conditions</span>}>
                <Controller
                  name="weather_conditions"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="e.g., Sunny, Light Rain, High Heat" style={largeInputStyle} size="large" prefix={<CloudOutlined style={prefixIconStyle} />} />
                  )}
                />
              </Form.Item>

              <InfoCard title="💡 Reporting Rule">
                Daily reports should ideally be submitted by 6:00 PM on the reporting day or early next morning.
              </InfoCard>
            </SectionCard>
          </Col>

          <Col xs={24} lg={12}>
            <SectionCard title="Observatons & Remarks" icon={<FileTextOutlined />}>
              <Form.Item label={<span style={getLabelStyle()}>Site Remarks</span>}>
                <Controller
                  name="remarks"
                  control={control}
                  render={({ field }) => (
                    <TextArea {...field} rows={4} placeholder="Major events, breakdowns, delays or milestones achieved today..." style={largeInputStyle} />
                  )}
                />
              </Form.Item>
            </SectionCard>
          </Col>
        </Row>

        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              Verifying all metrics ensures accurate project cost & timeline tracking.
            </Text>
            <Space size="middle">
              <Button
                onClick={() => navigate('/operations/dpr')}
                size="large"
                style={getSecondaryButtonStyle()}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
                style={getPrimaryButtonStyle()}
              >
                {id ? 'Update Report' : 'Submit Today\'s DPR'}
              </Button>
            </Space>
          </div>
        </Card>
      </form>
    </PageContainer>
  )
}

export default DPRForm
