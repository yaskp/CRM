import { useState, useEffect } from 'react'
import { Form, Input, Select, Button, Card, InputNumber, Switch, message, Space } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const { Option } = Select
const { TextArea } = Input

const MaterialForm = () => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = !!id

    useEffect(() => {
        if (isEdit) {
            fetchMaterial()
        }
    }, [id])

    const fetchMaterial = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(`http://localhost:5000/api/materials/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            form.setFieldsValue(response.data.data)
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

            navigate('/masters/materials')
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to save material')
        } finally {
            setLoading(false)
        }
    }

    const categories = [
        'Cement',
        'Steel',
        'Sand',
        'Aggregate',
        'Bricks',
        'Paint',
        'Electrical',
        'Plumbing',
        'Hardware',
        'Tiles',
        'Wood',
        'Glass',
        'Aluminum',
        'Other'
    ]

    const units = [
        'KG',
        'MT',
        'Ton',
        'Bag',
        'Nos',
        'Pcs',
        'Sqft',
        'Sqm',
        'Cft',
        'Cum',
        'Ltr',
        'Rmt',
        'Bundle',
        'Box',
        'Packet'
    ]

    return (
        <div>
            <h2>{isEdit ? 'Edit' : 'Add'} Material</h2>

            <Card>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        is_active: true,
                        gst_rate: 18,
                    }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item
                            label="Material Code"
                            name="code"
                            rules={[
                                { required: true, message: 'Please enter material code' },
                                { pattern: /^[A-Z0-9-]+$/, message: 'Code must be uppercase alphanumeric with hyphens' }
                            ]}
                        >
                            <Input
                                placeholder="e.g., CEM-OPC-53"
                                style={{ textTransform: 'uppercase' }}
                                maxLength={20}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Material Name"
                            name="name"
                            rules={[{ required: true, message: 'Please enter material name' }]}
                        >
                            <Input placeholder="e.g., OPC 53 Grade Cement" maxLength={100} />
                        </Form.Item>

                        <Form.Item
                            label="Category"
                            name="category"
                            rules={[{ required: true, message: 'Please select category' }]}
                        >
                            <Select placeholder="Select category" showSearch>
                                {categories.map(cat => (
                                    <Option key={cat} value={cat}>{cat}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="Unit of Measurement"
                            name="unit"
                            rules={[{ required: true, message: 'Please select unit' }]}
                        >
                            <Select placeholder="Select unit" showSearch>
                                {units.map(unit => (
                                    <Option key={unit} value={unit}>{unit}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="HSN Code"
                            name="hsn_code"
                            rules={[
                                { pattern: /^\d{4,8}$/, message: 'HSN code must be 4-8 digits' }
                            ]}
                        >
                            <Input placeholder="e.g., 25231000" maxLength={8} />
                        </Form.Item>

                        <Form.Item
                            label="GST Rate (%)"
                            name="gst_rate"
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                min={0}
                                max={28}
                                step={0.1}
                                placeholder="e.g., 18"
                            />
                        </Form.Item>
                    </div>

                    <Form.Item
                        label="Description"
                        name="description"
                    >
                        <TextArea
                            rows={3}
                            placeholder="Enter material description, specifications, or notes"
                            maxLength={500}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Status"
                        name="is_active"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>

                    <Form.Item style={{ marginTop: '24px' }}>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                {isEdit ? 'Update' : 'Create'} Material
                            </Button>
                            <Button onClick={() => navigate('/masters/materials')}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
}

export default MaterialForm
