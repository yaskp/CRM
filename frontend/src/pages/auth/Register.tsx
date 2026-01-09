import { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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
      background: '#f0f2f5'
    }}>
      <Card title="Register" style={{ width: 400 }}>
        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Employee ID"
            name="employee_id"
            rules={[{ required: true, message: 'Please input your employee ID!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phone"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Register
            </Button>
          </Form.Item>

          <Form.Item>
            <Button type="link" block onClick={() => navigate('/login')}>
              Already have an account? Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Register

