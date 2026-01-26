import { useState } from 'react'
import { Form, Input, Button, Card, message, Typography, Row, Col } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  IdcardOutlined,
  PhoneOutlined,
  UserAddOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { theme } from '../../styles/theme'
import { getPrimaryButtonStyle, largeInputStyle, prefixIconStyle } from '../../styles/styleUtils'

const { Title, Text, Link } = Typography

const Register = () => {
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const onFinish = async (values: {
    name: string
    email: string
    password: string
    employee_id: string
    phone?: string
  }) => {
    setLoading(true)
    try {
      await register(values)
      message.success('Registration successful!')
      navigate('/')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: 480,
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: 'none',
          overflow: 'hidden'
        }}
        styles={{ body: { padding: '40px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${theme.colors.primary.main}, ${theme.colors.primary.dark})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <UserAddOutlined style={{ fontSize: '32px', color: '#fff' }} />
          </div>
          <Title level={2} style={{ margin: 0, fontWeight: '700' }}>Join the Platform</Title>
          <Text type="secondary">Create your enterprise account to get started</Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
          size="large"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontWeight: '600' }}>Full Name</span>}
                name="name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input prefix={<UserOutlined style={prefixIconStyle} />} placeholder="John Doe" style={largeInputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontWeight: '600' }}>Employee ID</span>}
                name="employee_id"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input prefix={<IdcardOutlined style={prefixIconStyle} />} placeholder="EMP-001" style={largeInputStyle} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<span style={{ fontWeight: '600' }}>Email Address</span>}
            name="email"
            rules={[
              { required: true, message: 'Required' },
              { type: 'email', message: 'Invalid email' }
            ]}
          >
            <Input prefix={<MailOutlined style={prefixIconStyle} />} placeholder="name@company.com" style={largeInputStyle} />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: '600' }}>Contact Phone</span>}
            name="phone"
          >
            <Input prefix={<PhoneOutlined style={prefixIconStyle} />} placeholder="+91 98XXX XXXXX" style={largeInputStyle} />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: '600' }}>Security Password</span>}
            name="password"
            rules={[
              { required: true, message: 'Required' },
              { min: 6, message: 'Min 6 characters' }
            ]}
          >
            <Input.Password prefix={<LockOutlined style={prefixIconStyle} />} placeholder="••••••••" style={largeInputStyle} />
          </Form.Item>

          <Form.Item style={{ marginBottom: '16px', marginTop: '32px' }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={getPrimaryButtonStyle()}
            >
              Initialize Account
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Already using the CRM? </Text>
            <Link onClick={() => navigate('/login')} style={{ fontWeight: '600' }}>
              Sign In Here <ArrowRightOutlined style={{ fontSize: '12px' }} />
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Register
