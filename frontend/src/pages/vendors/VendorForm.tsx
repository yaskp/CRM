import { useState, useEffect } from 'react'
import { Form, Input, Select, Button, Card, message, Row, Col, Switch, Modal } from 'antd'
import { ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { vendorService } from '../../services/api/vendors'
import { validatePhone, validateGST, validatePAN, validationMessages } from '../../utils/validation'
import axios from 'axios'

const { Option } = Select
const { TextArea } = Input
const { confirm } = Modal

interface VendorType {
    id: number
    name: string
    code: string
}

const VendorForm = () => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [hasGST, setHasGST] = useState(true)
    const [vendorTypes, setVendorTypes] = useState<VendorType[]>([])
    const [showAddTypeModal, setShowAddTypeModal] = useState(false)
    const [newTypeName, setNewTypeName] = useState('')
    const [addingType, setAddingType] = useState(false)
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = !!id

    useEffect(() => {
        fetchVendorTypes()
        if (isEdit) {
            fetchVendor()
        }
    }, [id, isEdit])

    const fetchVendorTypes = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get('http://localhost:5000/api/vendor-types', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setVendorTypes(response.data.data || [])
        } catch (error) {
            console.error('Failed to fetch vendor types:', error)
        }
    }

    const fetchVendor = async () => {
        try {
            const response = await vendorService.getVendorById(Number(id))
            const vendorData = response.data
            form.setFieldsValue(vendorData)
            setHasGST(!!vendorData.gst_number)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch vendor')
        }
    }

    const handleAddVendorType = async () => {
        if (!newTypeName.trim()) {
            message.error('Please enter vendor type name')
            return
        }

        setAddingType(true)
        try {
            const token = localStorage.getItem('token')
            const code = newTypeName.toUpperCase().replace(/\s+/g, '_')

            await axios.post(
                'http://localhost:5000/api/vendor-types',
                {
                    name: newTypeName,
                    code: code,
                    description: `${newTypeName} vendor type`
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )

            message.success('Vendor type added successfully')
            setShowAddTypeModal(false)
            setNewTypeName('')
            fetchVendorTypes()
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to add vendor type')
        } finally {
            setAddingType(false)
        }
    }

    const handleGSTToggle = (checked: boolean) => {
        if (!checked) {
            form.setFieldsValue({ gst_number: undefined })
        }
        setHasGST(checked)
    }

    const onFinish = async (values: any) => {
        if (!hasGST && !values.gst_number) {
            confirm({
                title: 'Vendor without GST',
                icon: <ExclamationCircleOutlined />,
                content: 'You are creating/updating a vendor without GST number. This vendor will not be able to provide GST invoices. Do you want to continue?',
                okText: 'Yes, Continue',
                cancelText: 'No, Add GST',
                onOk: () => submitVendor(values),
                onCancel: () => {
                    setHasGST(true)
                },
            })
        } else {
            submitVendor(values)
        }
    }

    const submitVendor = async (values: any) => {
        setLoading(true)
        try {
            const formattedValues = {
                ...values,
                gst_number: values.gst_number?.toUpperCase() || null,
                pan_number: values.pan_number?.toUpperCase() || null,
            }

            if (isEdit) {
                await vendorService.updateVendor(Number(id), formattedValues)
                message.success('Vendor updated successfully')
            } else {
                await vendorService.createVendor(formattedValues)
                message.success('Vendor created successfully')
            }
            navigate('/masters/vendors')
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to save vendor')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <h2>{isEdit ? 'Edit Vendor' : 'Create Vendor'}</h2>
            <Card>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ is_active: true }}
                >
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Vendor Name"
                                name="name"
                                rules={[
                                    { required: true, message: 'Please enter vendor name' },
                                    { min: 3, message: 'Name must be at least 3 characters' },
                                    { max: 200, message: 'Name cannot exceed 200 characters' },
                                ]}
                            >
                                <Input placeholder="Enter vendor name" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Vendor Type"
                                name="vendor_type"
                                rules={[{ required: true, message: 'Please select vendor type' }]}
                            >
                                <Select
                                    placeholder="Select vendor type"
                                    dropdownRender={(menu) => (
                                        <>
                                            {menu}
                                            <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                                                <Button
                                                    type="link"
                                                    icon={<PlusOutlined />}
                                                    onClick={() => setShowAddTypeModal(true)}
                                                    style={{ width: '100%', textAlign: 'left' }}
                                                >
                                                    Add New Vendor Type
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                >
                                    {vendorTypes.map((type) => (
                                        <Option key={type.id} value={type.code}>
                                            {type.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Contact Person"
                                name="contact_person"
                                rules={[
                                    { max: 100, message: 'Name cannot exceed 100 characters' },
                                    { pattern: /^[a-zA-Z\s.]+$/, message: 'Only letters, spaces, and dots allowed' },
                                ]}
                            >
                                <Input placeholder="Enter contact person name" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Phone"
                                name="phone"
                                rules={[
                                    {
                                        validator: (_, value) => {
                                            if (!value) return Promise.resolve()
                                            if (validatePhone(value)) {
                                                return Promise.resolve()
                                            }
                                            return Promise.reject(new Error(validationMessages.phone))
                                        },
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="Enter 10-digit mobile number"
                                    maxLength={10}
                                    onKeyPress={(e) => {
                                        if (!/[0-9]/.test(e.key)) {
                                            e.preventDefault()
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[
                                    { type: 'email', message: validationMessages.email },
                                    { max: 100, message: 'Email cannot exceed 100 characters' },
                                ]}
                            >
                                <Input placeholder="Enter email address" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Status"
                                name="is_active"
                            >
                                <Select>
                                    <Option value={true}>Active</Option>
                                    <Option value={false}>Inactive</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16} align="bottom">
                        <Col xs={24} md={6}>
                            <Form.Item label="Vendor has GST">
                                <Switch
                                    checked={hasGST}
                                    onChange={handleGSTToggle}
                                    checkedChildren="Yes"
                                    unCheckedChildren="No"
                                />
                            </Form.Item>
                        </Col>

                        {hasGST && (
                            <Col xs={24} md={9}>
                                <Form.Item
                                    label="GST Number"
                                    name="gst_number"
                                    rules={[
                                        { required: hasGST, message: 'Please enter GST number or toggle off GST' },
                                        {
                                            validator: (_, value) => {
                                                if (!value) return Promise.resolve()
                                                if (validateGST(value)) {
                                                    return Promise.resolve()
                                                }
                                                return Promise.reject(new Error(validationMessages.gst))
                                            },
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder="e.g., 22AAAAA0000A1Z5"
                                        maxLength={15}
                                        style={{ textTransform: 'uppercase' }}
                                    />
                                </Form.Item>
                            </Col>
                        )}

                        <Col xs={24} md={9}>
                            <Form.Item
                                label="PAN Number"
                                name="pan_number"
                                rules={[
                                    {
                                        validator: (_, value) => {
                                            if (!value) return Promise.resolve()
                                            if (validatePAN(value)) {
                                                return Promise.resolve()
                                            }
                                            return Promise.reject(new Error(validationMessages.pan))
                                        },
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="e.g., ABCDE1234F"
                                    maxLength={10}
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Address"
                        name="address"
                        rules={[
                            { max: 500, message: 'Address cannot exceed 500 characters' },
                        ]}
                    >
                        <TextArea rows={3} placeholder="Enter complete address" />
                    </Form.Item>

                    <Form.Item
                        label="Bank Details"
                        name="bank_details"
                        tooltip="Include Bank Name, Account Number, IFSC Code, Branch"
                        rules={[
                            { max: 500, message: 'Bank details cannot exceed 500 characters' },
                        ]}
                    >
                        <TextArea
                            rows={3}
                            placeholder="Bank Name: &#10;Account Number: &#10;IFSC Code: &#10;Branch: "
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: '8px' }}>
                            {isEdit ? 'Update' : 'Create'}
                        </Button>
                        <Button onClick={() => navigate('/masters/vendors')}>
                            Cancel
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {/* Add Vendor Type Modal */}
            <Modal
                title="Add New Vendor Type"
                open={showAddTypeModal}
                onOk={handleAddVendorType}
                onCancel={() => {
                    setShowAddTypeModal(false)
                    setNewTypeName('')
                }}
                confirmLoading={addingType}
            >
                <Input
                    placeholder="Enter vendor type name (e.g., Plumbing Contractor)"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    onPressEnter={handleAddVendorType}
                />
            </Modal>
        </div>
    )
}

export default VendorForm
