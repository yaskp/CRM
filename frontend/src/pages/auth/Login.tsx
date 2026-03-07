import { useState } from 'react'
import { Form, Input, Button, Card, message, Typography } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined, RocketOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { largeInputStyle, getLabelStyle, getPrimaryButtonStyle, prefixIconStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Title, Text } = Typography

const Login = () => {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true)
    try {
      await login(values.email, values.password)
      message.success('Login successful!')
      navigate('/')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Login failed')
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
      background: theme.colors.background.main,
      padding: theme.spacing.lg
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 450,
          borderRadius: theme.borderRadius.lg,
          boxShadow: theme.shadows.xl,
          border: `1px solid ${theme.colors.neutral.gray100}`,
        }}
      >
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: theme.spacing.xl,
          paddingBottom: theme.spacing.lg,
          borderBottom: `2px solid ${theme.colors.neutral.gray100}`
        }}>
          <div style={{
            width: 80,
            height: 80,
            margin: '0 auto 16px',
            borderRadius: theme.borderRadius.full,
            background: theme.gradients.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.shadows.primary
          }}>
            <RocketOutlined style={{ fontSize: 40, color: 'white' }} />
          </div>
          <Title level={2} style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>
            Welcome Back
          </Title>
          <Text style={{ color: theme.colors.neutral.gray600, fontSize: 15 }}>
            Sign in to your Construction CRM account
          </Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label={<span style={getLabelStyle()}>Email, Username or Employee ID</span>}
            name="email"
            rules={[
              { required: true, message: 'Please input your credentials!' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={prefixIconStyle} />}
              placeholder="Enter email, username or employee ID"
              size="large"
              style={largeInputStyle}
            />
          </Form.Item>

          <Form.Item
            label={<span style={getLabelStyle()}>Password</span>}
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={prefixIconStyle} />}
              placeholder="Enter your password"
              size="large"
              style={largeInputStyle}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: theme.spacing.md }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              size="large"
              icon={<LoginOutlined />}
              style={{
                ...getPrimaryButtonStyle(),
                width: '100%',
                height: 48,
                fontSize: 16,
                fontWeight: 600
              }}
            >
              Sign In
            </Button>
          </Form.Item>

        </Form>


        {/* Footer */}
        <div style={{
          marginTop: theme.spacing.xl,
          paddingTop: theme.spacing.lg,
          borderTop: `1px solid ${theme.colors.neutral.gray100}`,
          textAlign: 'center'
        }}>
          <Text style={{ fontSize: 12, color: theme.colors.neutral.gray500 }}>
            © 2026 Construction CRM. All rights reserved.
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default Login
