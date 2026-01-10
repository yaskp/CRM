import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Row, Col, Space, TimePicker } from 'antd'
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { equipmentService } from '../../services/api/equipment'
import { equipmentBreakdownSchema } from '../../utils/validationSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import dayjs from 'dayjs'

const { TextArea } = Input

const BreakdownForm = () => {
  const { rentalId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [rental, setRental] = useState<any>(null)

  const { control, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(equipmentBreakdownSchema),
    defaultValues: {
      breakdown_date: dayjs().format('YYYY-MM-DD'),
    },
  })

  useEffect(() => {
    if (rentalId) {
      // Fetch rental details if needed
    }
  }, [rentalId])

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
    <Card
      title="Report Equipment Breakdown"
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/operations/equipment/rentals')}>
          Back
        </Button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Breakdown Date"
              validateStatus={errors.breakdown_date ? 'error' : ''}
              help={errors.breakdown_date?.message}
              required
            >
              <Controller
                name="breakdown_date"
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
            <Form.Item label="Breakdown Time">
              <Controller
                name="breakdown_time"
                control={control}
                render={({ field }) => (
                  <TimePicker
                    {...field}
                    style={{ width: '100%' }}
                    format="HH:mm"
                    value={field.value ? dayjs(field.value, 'HH:mm:ss') : null}
                    onChange={(time) => field.onChange(time ? time.format('HH:mm:ss') : undefined)}
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Resolution Date">
              <Controller
                name="resolution_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : undefined)}
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Resolution Time">
              <Controller
                name="resolution_time"
                control={control}
                render={({ field }) => (
                  <TimePicker
                    {...field}
                    style={{ width: '100%' }}
                    format="HH:mm"
                    value={field.value ? dayjs(field.value, 'HH:mm:ss') : null}
                    onChange={(time) => field.onChange(time ? time.format('HH:mm:ss') : undefined)}
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label="Breakdown Reason">
              <Controller
                name="breakdown_reason"
                control={control}
                render={({ field }) => (
                  <TextArea {...field} rows={4} placeholder="Describe the breakdown reason" />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Space style={{ marginTop: 24, width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate('/operations/equipment/rentals')}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
            Report Breakdown
          </Button>
        </Space>
      </form>
    </Card>
  )
}

export default BreakdownForm

