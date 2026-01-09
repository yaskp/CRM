import { useState } from 'react'
import { Form, Input, Button, Card, message, Steps } from 'antd'
import { useNavigate } from 'react-router-dom'
import { projectService } from '../../services/api/projects'

const { TextArea } = Input
const { Step } = Steps

const ProjectCreate = () => {
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      await projectService.createProject(values)
      message.success('Project created successfully!')
      navigate('/projects')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    {
      title: 'Basic Information',
      content: (
        <>
          <Form.Item
            label="Project Name"
            name="name"
            rules={[{ required: true, message: 'Please enter project name!' }]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>
          <Form.Item
            label="Location"
            name="location"
          >
            <Input placeholder="Enter location" />
          </Form.Item>
          <Form.Item
            label="City"
            name="city"
          >
            <Input placeholder="Enter city" />
          </Form.Item>
          <Form.Item
            label="State"
            name="state"
          >
            <Input placeholder="Enter state" />
          </Form.Item>
        </>
      ),
    },
    {
      title: 'Client Details',
      content: (
        <Form.Item
          label="Client HO Address"
          name="client_ho_address"
        >
          <TextArea rows={4} placeholder="Enter client head office address" />
        </Form.Item>
      ),
    },
  ]

  return (
    <div className="content-container">
      <Card title="Create New Project">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Steps current={currentStep} style={{ marginBottom: 24 }}>
            {steps.map((step) => (
              <Step key={step.title} title={step.title} />
            ))}
          </Steps>

          <div style={{ minHeight: 200 }}>
            {steps[currentStep].content}
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
            {currentStep > 0 && (
              <Button onClick={() => setCurrentStep(currentStep - 1)}>
                Previous
              </Button>
            )}
            <div style={{ marginLeft: 'auto' }}>
              {currentStep < steps.length - 1 ? (
                <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                  Next
                </Button>
              ) : (
                <Button type="primary" htmlType="submit" loading={loading}>
                  Create Project
                </Button>
              )}
            </div>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default ProjectCreate

