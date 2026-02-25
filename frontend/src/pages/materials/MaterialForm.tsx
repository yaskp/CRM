import { useState, useEffect } from 'react'
import { Form, Input, Select, Button, Card, InputNumber, Switch, Typography, App } from 'antd'
import { InboxOutlined, TagOutlined, NumberOutlined, PercentageOutlined, FileTextOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import { largeInputStyle, getLabelStyle, getPrimaryButtonStyle, getSecondaryButtonStyle, flexBetweenStyle, actionCardStyle, prefixIconStyle, twoColumnGridStyle } from '../../styles/styleUtils'
import { unitService } from '../../services/api/units'

const { Option } = Select
const { TextArea } = Input
const { Text } = Typography

const MaterialForm = () => {
    const { message } = App.useApp()
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [units, setUnits] = useState<any[]>([])
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = !!id

    useEffect(() => {
        fetchUnits()
        if (isEdit) {
            fetchMaterial()
        }
    }, [id])

    const fetchUnits = async () => {
        try {
            const response = await unitService.getUnits({ limit: 1000 })
            setUnits(response.data || [])
        } catch (error) {
            console.error('Failed to fetch units')
        }
    }

    const fetchMaterial = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(`http://localhost:5000/api/materials/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            form.setFieldsValue(response.data.material)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch material')
        }
    }

    const onFinish = async (values: any) => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')

            if (isEdit) {
                await axios.put(`http://localhost:5000/api/materials/${id}`, values, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                message.success('Material updated successfully')
            } else {
                await axios.post('http://localhost:5000/api/materials', values, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                message.success('Material created successfully')
            }

            navigate('/master/materials')
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to save material')
        } finally {
            setLoading(false)
        }
    }

    const categories = ['Cement', 'Steel', 'Sand', 'Aggregate', 'Bricks', 'Paint', 'Electrical', 'Plumbing', 'Hardware', 'Tiles', 'Wood', 'Glass', 'Aluminum', 'Other']
    // Units are now fetched from API

    return (
        <PageContainer maxWidth={1000}>
            <PageHeader
                title={isEdit ? 'Edit Material' : 'Add New Material'}
                subtitle={isEdit ? 'Update material information' : 'Create a new material in the inventory'}
                icon={<InboxOutlined />}
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                    is_active: true,
                    gst_rate: 18,
                }}
            >
                <SectionCard title="Basic Information" icon={<TagOutlined />}>
                    <div style={twoColumnGridStyle}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>Material Code</span>}
                            name="material_code"
                            rules={[
                                { required: true, message: 'Please enter material code' },
                                { pattern: /^[A-Z0-9-]+$/, message: 'Code must be uppercase alphanumeric with hyphens' }
                            ]}
                        >
                            <Input
                                prefix={<NumberOutlined style={prefixIconStyle} />}
                                placeholder="e.g., CEM-OPC-53"
                                style={{ textTransform: 'uppercase', ...largeInputStyle }}
                                size="large"
                                maxLength={20}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Material Name</span>}
                            name="name"
                            rules={[{ required: true, message: 'Please enter material name' }]}
                        >
                            <Input
                                prefix={<InboxOutlined style={prefixIconStyle} />}
                                placeholder="e.g., OPC 53 Grade Cement"
                                size="large"
                                style={largeInputStyle}
                                maxLength={100}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Category</span>}
                            name="category"
                            rules={[{ required: true, message: 'Please select category' }]}
                        >
                            <Select
                                placeholder="Select category"
                                showSearch
                                size="large"
                                style={largeInputStyle}
                            >
                                {categories.map(cat => (
                                    <Option key={cat} value={cat}>{cat}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Unit of Measurement</span>}
                            name="unit"
                            rules={[{ required: true, message: 'Please select unit' }]}
                        >
                            <Select
                                mode="multiple"
                                maxTagCount="responsive"
                                placeholder="Select units"
                                showSearch
                                size="large"
                                style={largeInputStyle}
                                optionFilterProp="children"
                            >
                                {units.map((unit: any) => (
                                    <Option key={unit.id} value={unit.code}>{unit.name} ({unit.code})</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    <InfoCard title="💡 Material Code">
                        Use a unique, descriptive code (e.g., CEM-OPC-53 for Cement OPC 53 Grade). Codes must be uppercase.
                    </InfoCard>
                </SectionCard>

                <SectionCard title="Pricing & Inventory" icon={<NumberOutlined />}>
                    <div style={twoColumnGridStyle}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>Standard Rate (₹)</span>}
                            name="standard_rate"
                        >
                            <InputNumber
                                prefix={<NumberOutlined style={prefixIconStyle} />}
                                style={{ width: '100%', ...largeInputStyle }}
                                size="large"
                                min={0}
                                placeholder="e.g., 450"
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>Base UOM</span>}
                            name="uom"
                            rules={[{ required: true, message: 'Please select base UOM' }]}
                            tooltip="The primary unit for inventory tracking"
                        >
                            <Select
                                placeholder="Select base UOM"
                                showSearch
                                size="large"
                                style={largeInputStyle}
                                optionFilterProp="children"
                            >
                                {units.map((unit: any) => (
                                    <Option key={unit.id} value={unit.code}>{unit.name} ({unit.code})</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>
                    <InfoCard title="🏢 Inventory Tracking">
                        Standard rate helps in estimating purchase orders and valuation. Base UOM is used as the primary reference for stock.
                    </InfoCard>
                </SectionCard>

                <SectionCard title="Tax & Compliance" icon={<PercentageOutlined />}>
                    <div style={twoColumnGridStyle}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>HSN Code</span>}
                            name="hsn_code"
                            rules={[
                                { pattern: /^\d{4,8}$/, message: 'HSN code must be 4-8 digits' }
                            ]}
                        >
                            <Input
                                prefix={<NumberOutlined style={prefixIconStyle} />}
                                placeholder="e.g., 25231000"
                                size="large"
                                style={largeInputStyle}
                                maxLength={8}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>GST Rate (%)</span>}
                            name="gst_rate"
                        >
                            <InputNumber
                                prefix={<PercentageOutlined style={prefixIconStyle} />}
                                style={{ width: '100%', ...largeInputStyle }}
                                size="large"
                                min={0}
                                max={28}
                                step={0.1}
                                placeholder="e.g., 18"
                            />
                        </Form.Item>
                    </div>

                    <InfoCard title="📋 HSN Code">
                        HSN (Harmonized System of Nomenclature) code is required for GST compliance. Enter 4-8 digit code.
                    </InfoCard>
                </SectionCard>

                <SectionCard title="Additional Details" icon={<FileTextOutlined />}>
                    <Form.Item
                        label={<span style={getLabelStyle()}>Description</span>}
                        name="description"
                    >
                        <TextArea
                            rows={4}
                            placeholder="Enter material description, specifications, or notes"
                            style={largeInputStyle}
                            maxLength={500}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={getLabelStyle()}>Status</span>}
                        name="is_active"
                        valuePropName="checked"
                    >
                        <Switch
                            checkedChildren="Active"
                            unCheckedChildren="Inactive"
                            style={{ marginTop: 8 }}
                        />
                    </Form.Item>
                </SectionCard>

                <Card style={actionCardStyle}>
                    <div style={flexBetweenStyle}>
                        <Text style={{ color: '#666', fontSize: 14 }}>
                            All fields marked with <span style={{ color: '#ff4d4f' }}>*</span> are required
                        </Text>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Button
                                onClick={() => navigate('/master/materials')}
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
                                {isEdit ? 'Update' : 'Create'} Material
                            </Button>
                        </div>
                    </div>
                </Card>
            </Form>
        </PageContainer>
    )
}

export default MaterialForm
