import { Card, Row, Col, Statistic } from 'antd'
import { ProjectOutlined, DollarOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons'

const Dashboard = () => {
  return (
    <div className="content-container">
      <h1>Dashboard</h1>
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Projects"
              value={0}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Projects"
              value={0}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Leads"
              value={0}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Approvals"
              value={0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

