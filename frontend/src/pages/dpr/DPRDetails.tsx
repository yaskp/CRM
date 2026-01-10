import { useState, useEffect } from 'react'
import { Card, Descriptions, Tag, Button, Table, Space, message, Row, Col, Statistic } from 'antd'
import { ArrowLeftOutlined, EditOutlined, PrinterOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { dprService } from '../../services/api/dpr'
import dayjs from 'dayjs'

const DPRDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dpr, setDpr] = useState<any>(null)

  useEffect(() => {
    if (id) {
      fetchDPR()
    }
  }, [id])

  const fetchDPR = async () => {
    setLoading(true)
    try {
      const response = await dprService.getDPR(Number(id))
      setDpr(response.dpr)
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch DPR')
    } finally {
      setLoading(false)
    }
  }

  if (!dpr) {
    return <div>Loading...</div>
  }

  const manpowerColumns = [
    {
      title: 'Worker Type',
      dataIndex: 'worker_type',
      key: 'worker_type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          steel_worker: 'Steel Worker',
          concrete_worker: 'Concrete Worker',
          department_worker: 'Department Worker',
          electrician: 'Electrician',
          welder: 'Welder',
        }
        return typeMap[type] || type
      },
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: 'Hajri',
      dataIndex: 'hajri',
      key: 'hajri',
      render: (hajri: string) => <Tag color="blue">{hajri}</Tag>,
    },
  ]

  return (
    <Card
      title="DPR Details"
      loading={loading}
      extra={
        <Space>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
            Print
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/operations/dpr/${id}/edit`)}
          >
            Edit
          </Button>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/operations/dpr')}>
            Back
          </Button>
        </Space>
      }
    >
      <Descriptions title="Project Information" bordered column={{ xs: 1, sm: 2, md: 3 }}>
        <Descriptions.Item label="Project">
          {dpr.project?.name} ({dpr.project?.project_code})
        </Descriptions.Item>
        <Descriptions.Item label="Report Date">
          {dayjs(dpr.report_date).format('DD-MM-YYYY')}
        </Descriptions.Item>
        <Descriptions.Item label="Site Location">
          {dpr.site_location || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Panel Number">
          {dpr.panel_number || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Created By">
          {dpr.creator?.name}
        </Descriptions.Item>
        <Descriptions.Item label="Weather">
          {dpr.weather_conditions || '-'}
        </Descriptions.Item>
      </Descriptions>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Guide Wall"
              value={dpr.guide_wall_running_meter || 0}
              suffix="m"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Steel Quantity"
              value={dpr.steel_quantity_kg || 0}
              suffix="kg"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Concrete Quantity"
              value={dpr.concrete_quantity_cubic_meter || 0}
              suffix="m³"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Polymer Bags"
              value={dpr.polymer_consumption_bags || 0}
              suffix="bags"
            />
          </Card>
        </Col>
      </Row>

      {dpr.diesel_consumption_liters && (
        <Card style={{ marginTop: 16 }}>
          <Statistic
            title="Diesel Consumption"
            value={dpr.diesel_consumption_liters}
            suffix="liters"
            precision={2}
          />
        </Card>
      )}

      {dpr.manpower && dpr.manpower.length > 0 && (
        <Card title="Manpower Report" style={{ marginTop: 24 }}>
          <Table
            columns={manpowerColumns}
            dataSource={dpr.manpower}
            rowKey="id"
            pagination={false}
          />
        </Card>
      )}

      {dpr.remarks && (
        <Card title="Remarks" style={{ marginTop: 24 }}>
          <p>{dpr.remarks}</p>
        </Card>
      )}
    </Card>
  )
}

export default DPRDetails

