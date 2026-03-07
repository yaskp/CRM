import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, DatePicker, Row, Col, Space, TimePicker, Typography } from 'antd'
import {
  WarningOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { equipmentService } from '../../services/api/equipment'
import { equipmentBreakdownSchema } from '../../utils/validationSchemas'
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
  twoColumnGridStyle
} from '../../styles/styleUtils'

const { TextArea } = Input
const { Text } = Typography

import { z } from 'zod'

// ... existing imports

type BreakdownFormData = z.infer<typeof equipmentBreakdownSchema>

const BreakdownForm = () => {
  const { rentalId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<BreakdownFormData>({
    resolver: zodResolver(equipmentBreakdownSchema),
    defaultValues: {
      rental_id: Number(rentalId),
      breakdown_date: dayjs().format('YYYY-MM-DD'),
      breakdown_time: undefined,
      resolution_date: undefined,
      resolution_time: undefined,
      breakdown_reason: '',
    },
  })

  useEffect(() => {
    if (rentalId) {
      setValue('rental_id', Number(rentalId))
    }
  }, [rentalId, setValue])

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        rental_id: Number(rentalId),
        breakdown_time: data.breakdown_time ? dayjs(data.breakdown_time).format('HH:mm:ss') : undefined,
        resolution_time: data.resolution_time ? dayjs(data.resolution_time).format('HH:mm:ss') : undefined,
      }
      await equipmentService.reportBreakdown(payload)
      message.success('Breakdown reported successfully!')
      navigate('/operations/equipment/rentals')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to report breakdown')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer maxWidth={900}>
      <PageHeader
        title="Report Machine Breakdown"
        subtitle={`Register downtime and maintenance issues for Lease #${rentalId}`}
        icon={<WarningOutlined />}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={twoColumnGridStyle}>
          <SectionCard title="Downtime Entry" icon={<ClockCircleOutlined />}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span style={getLabelStyle()}>Failure Date</span>}
                  validateStatus={errors.breakdown_date ? 'error' : ''}
                  help={errors.breakdown_date?.message as string}
                  required
                >
                  <Controller
                    name="breakdown_date"
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
              </Col>
              <Col span={12}>
                <Form.Item label={<span style={getLabelStyle()}>Failure Time</span>}>
                  <Controller
                    name="breakdown_time"
                    control={control}
                    render={({ field }) => (
                      <TimePicker
                        {...field}
                        style={{ width: '100%', ...largeInputStyle }}
                        format="HH:mm"
                        size="large"
                        placeholder="HH:MM"
                        value={field.value ? dayjs(field.value, 'HH:mm:ss') : null}
                        onChange={(time) => field.onChange(time ? time.format('HH:mm:ss') : undefined)}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={<span style={getLabelStyle()}>Technical Root Cause</span>}
              validateStatus={errors.breakdown_reason ? 'error' : ''}
              help={errors.breakdown_reason?.message as string}
              required
            >
              <Controller
                name="breakdown_reason"
                control={control}
                render={({ field }) => (
                  <TextArea {...field} rows={4} placeholder="Detailed explanation for deduction audit..." style={largeInputStyle} />
                )}
              />
            </Form.Item>
          </SectionCard>

          <SectionCard title="Restoration Details" icon={<CheckCircleOutlined />}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label={<span style={getLabelStyle()}>Resolution Date</span>}>
                  <Controller
                    name="resolution_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        {...field}
                        style={{ width: '100%', ...largeInputStyle }}
                        format="DD-MMM-YYYY"
                        size="large"
                        placeholder="Ongoing"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : undefined)}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<span style={getLabelStyle()}>Resolution Time</span>}>
                  <Controller
                    name="resolution_time"
                    control={control}
                    render={({ field }) => (
                      <TimePicker
                        {...field}
                        style={{ width: '100%', ...largeInputStyle }}
                        format="HH:mm"
                        size="large"
                        placeholder="HH:MM"
                        value={field.value ? dayjs(field.value, 'HH:mm:ss') : null}
                        onChange={(time) => field.onChange(time ? time.format('HH:mm:ss') : undefined)}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            <InfoCard title="💡 Financial Impact">
              Downtime hours reported here are automatically deducted from the monthly rental invoice for third-party machinery.
            </InfoCard>
          </SectionCard>
        </div>

        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              All breakdown entries require approval from the Plant & Machinery department.
            </Text>
            <Space size="middle">
              <Button
                onClick={() => navigate('/operations/equipment/rentals')}
                size="large"
                style={getSecondaryButtonStyle()}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<ToolOutlined />}
                size="large"
                style={getPrimaryButtonStyle()}
              >
                Log Maintenance Entry
              </Button>
            </Space>
          </div>
        </Card>
      </form>
    </PageContainer>
  )
}

export default BreakdownForm
