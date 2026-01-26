import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Switch, Typography, Select } from 'antd'
import { HomeOutlined, NumberOutlined, EnvironmentOutlined, GlobalOutlined, BankOutlined, ShopOutlined, ProjectOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { warehouseService } from '../../services/api/warehouses'
import { projectService } from '../../services/api/projects'
import StateSelect from '../../components/common/StateSelect'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import { largeInputStyle, getLabelStyle, getPrimaryButtonStyle, getSecondaryButtonStyle, flexBetweenStyle, actionCardStyle, prefixIconStyle, twoColumnGridStyle } from '../../styles/styleUtils'

const { Text } = Typography

const WarehouseForm = () => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [projects, setProjects] = useState<any[]>([])
  const warehouseType = Form.useWatch('type', form)
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    fetchProjects()
    if (id) {
      fetchWarehouse()
    }
  }, [id])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects({ limit: 1000 })
      setProjects(response.projects || [])
    } catch (error) {
      console.error('Failed to fetch projects', error)
    }
  }

  const fetchWarehouse = async () => {
    try {
      const response = await warehouseService.getWarehouse(Number(id))
      const warehouse = response.warehouse
      form.setFieldsValue({
        ...warehouse
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to fetch warehouse')
    }
  }

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const payload = { ...values }

      if (id) {
        await warehouseService.updateWarehouse(Number(id), payload)
        message.success('Warehouse updated successfully!')
      } else {
        await warehouseService.createWarehouse(payload)
        message.success('Warehouse created successfully!')
      }
      navigate('/master/warehouses')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save warehouse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer maxWidth={900}>
      <PageHeader
        title={id ? 'Edit Warehouse' : 'Create New Warehouse'}
        subtitle={id ? 'Update warehouse information' : 'Add a new warehouse location'}
        icon={<HomeOutlined />}
      />

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <SectionCard title="Warehouse Information" icon={<HomeOutlined />}>
          <div style={twoColumnGridStyle}>
            <Form.Item
              label={<span style={getLabelStyle()}>Warehouse Code</span>}
              name="code"
              rules={[{ required: true, message: 'Please enter warehouse code!' }]}
            >
              <Input
                prefix={<NumberOutlined style={prefixIconStyle} />}
                placeholder="Enter warehouse code (e.g., WH-001)"
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Warehouse Name</span>}
              name="name"
              rules={[{ required: true, message: 'Please enter warehouse name!' }]}
            >
              <Input
                prefix={<HomeOutlined style={prefixIconStyle} />}
                placeholder="Enter warehouse name"
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>
          </div>

          <Form.Item
            label={<span style={getLabelStyle()}>Address</span>}
            name="address"
          >
            <Input
              prefix={<EnvironmentOutlined style={prefixIconStyle} />}
              placeholder="Enter warehouse address"
              size="large"
              style={largeInputStyle}
            />
          </Form.Item>

          <div style={twoColumnGridStyle}>
            <Form.Item
              label={<span style={getLabelStyle()}>City</span>}
              name="city"
            >
              <Input placeholder="e.g. Jaipur" size="large" style={largeInputStyle} />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>State</span>}
              name="state"
            >
              <StateSelect
                onChange={(val: string, code?: string) => {
                  form.setFieldsValue({ state: val, state_code: code })
                }}
              />
            </Form.Item>
          </div>

          <div style={twoColumnGridStyle}>
            <Form.Item
              label={<span style={getLabelStyle()}>State Code (GST Prefix)</span>}
              name="state_code"
              rules={[{ len: 2, message: 'Must be 2 digits (e.g., 08)' }]}
            >
              <Input placeholder="e.g. 08" size="large" style={largeInputStyle} disabled />
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>GSTIN (Location Specific)</span>}
              name="gstin"
            >
              <Input placeholder="Enter GSTIN for this site" size="large" style={largeInputStyle} />
            </Form.Item>
          </div>

          <div style={twoColumnGridStyle}>
            <Form.Item
              label={<span style={getLabelStyle()}>Warehouse Category</span>}
              name="type"
              initialValue="central"
              rules={[{ required: true, message: 'Please select warehouse category' }]}
            >
              <Select size="large" style={largeInputStyle}>
                <Select.Option value="central">🏢 Central Store (Base/HO)</Select.Option>
                <Select.Option value="site">🏗️ Site Store (Main Site)</Select.Option>
                <Select.Option value="regional">📍 Regional / Satellite Store</Select.Option>
                <Select.Option value="fabrication">⚙️ Fabrication / Yard</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={<span style={getLabelStyle()}>Common Warehouse (VHPT & VHSHREE)</span>}
              name="is_common"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch
                checkedChildren={<><GlobalOutlined /> Common</>}
                unCheckedChildren="Company Specific"
              />
            </Form.Item>
          </div>

          {(warehouseType === 'site' || warehouseType === 'regional') && (
            <Form.Item
              label={<span style={getLabelStyle()}>Associated Project</span>}
              name="project_id"
              rules={[{ required: warehouseType === 'site', message: 'Project link is mandatory for Site Stores' }]}
              tooltip={warehouseType === 'regional' ? "Optional: Link to a project if ready, or keep blank for general regional storage" : "Required: Site stores must be linked to a project"}
            >
              <Select
                showSearch
                placeholder="Select project"
                size="large"
                style={largeInputStyle}
                optionFilterProp="children"
                allowClear
              >
                {projects.map(p => (
                  <Select.Option key={p.id} value={p.id}>
                    <ProjectOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    {p.name} ({p.project_code || 'No Code'})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <InfoCard title="🏢 Storage Tiers Overview">
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li><b>Central Store:</b> Main company warehouse for bulk storage.</li>
              <li><b>Site Store:</b> Located <u>at the project site</u>. Mandatory project link.</li>
              <li><b>Regional / Satellite:</b> Buffer store <u>near projects</u>. Useful when project is in pipeline.</li>
              <li><b>Fabrication Yard:</b> Processing yard for rebar/steel serving multiple units.</li>
            </ul>
          </InfoCard>
        </SectionCard>

        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text style={{ color: '#666', fontSize: 14 }}>
              All fields marked with <span style={{ color: '#ff4d4f' }}>*</span> are required
            </Text>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                onClick={() => navigate('/master/warehouses')}
                size="large"
                style={getSecondaryButtonStyle()}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                style={getPrimaryButtonStyle()}
              >
                {id ? 'Update' : 'Create'} Warehouse
              </Button>
            </div>
          </div>
        </Card>
      </Form>
    </PageContainer>
  )
}

export default WarehouseForm
