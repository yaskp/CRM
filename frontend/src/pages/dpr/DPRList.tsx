import { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Space, Input, Select, DatePicker, message } from 'antd'
import { PlusOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { dprService } from '../../services/api/dpr'
import { projectService } from '../../services/api/projects'
import dayjs from 'dayjs'

const { Search } = Input
const { RangePicker } = DatePicker

const DPRList = () => {
  const [loading, setLoading] = useState(false)
  const [dprs, setDprs] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
    fetchDPRs()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects()
      setProjects(response.projects || [])
    } catch (error) {
      console.error('Failed to fetch projects')
    }
  }

  const fetchDPRs = async (params?: any) => {
    setLoading(true)
    try {
      const response = await dprService.getDPRs({
        ...params,
        page: params?.current || pagination.current,
        limit: params?.pageSize || pagination.pageSize,
      })
      setDprs(response.dprs || [])
      setPagination({
        current: response.pagination?.page || 1,
        pageSize: response.pagination?.limit || 10,
        total: response.pagination?.total || 0,
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch DPRs')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Date',
      dataIndex: 'report_date',
      key: 'report_date',
      render: (date: string) => dayjs(date).format('DD-MM-YYYY'),
      sorter: (a: any, b: any) => dayjs(a.report_date).unix() - dayjs(b.report_date).unix(),
    },
    {
      title: 'Project',
      dataIndex: ['project', 'name'],
      key: 'project',
      render: (text: string, record: any) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.project?.project_code}</div>
        </div>
      ),
    },
    {
      title: 'Site Location',
      dataIndex: 'site_location',
      key: 'site_location',
    },
    {
      title: 'Panel Number',
      dataIndex: 'panel_number',
      key: 'panel_number',
    },
    {
      title: 'Guide Wall (m)',
      dataIndex: 'guide_wall_running_meter',
      key: 'guide_wall',
      render: (value: number) => value ? `${value} m` : '-',
    },
    {
      title: 'Steel (kg)',
      dataIndex: 'steel_quantity_kg',
      key: 'steel',
      render: (value: number) => value ? `${value} kg` : '-',
    },
    {
      title: 'Concrete (m³)',
      dataIndex: 'concrete_quantity_cubic_meter',
      key: 'concrete',
      render: (value: number) => value ? `${value} m³` : '-',
    },
    {
      title: 'Created By',
      dataIndex: ['creator', 'name'],
      key: 'creator',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/operations/dpr/${record.id}`)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/operations/dpr/${record.id}/edit`)}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="Daily Progress Reports (DPR)"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/operations/dpr/new')}
        >
          Create DPR
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Space wrap>
          <Search
            placeholder="Search by site location or panel"
            style={{ width: 250 }}
            onSearch={(value) => fetchDPRs({ search: value })}
          />
          <Select
            placeholder="Filter by Project"
            style={{ width: 200 }}
            allowClear
            showSearch
            optionFilterProp="children"
            onChange={(value) => fetchDPRs({ project_id: value })}
          >
            {projects.map((project) => (
              <Select.Option key={project.id} value={project.id}>
                {project.name}
              </Select.Option>
            ))}
          </Select>
          <RangePicker
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                fetchDPRs({
                  start_date: dates[0].format('YYYY-MM-DD'),
                  end_date: dates[1].format('YYYY-MM-DD'),
                })
              } else {
                fetchDPRs()
              }
            }}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={dprs}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} DPRs`,
          }}
          onChange={(pagination) => fetchDPRs({ current: pagination.current, pageSize: pagination.pageSize })}
        />
      </Space>
    </Card>
  )
}

export default DPRList

