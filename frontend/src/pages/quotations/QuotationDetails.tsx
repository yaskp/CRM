import { useState, useEffect } from 'react'
import { Card, Descriptions, Tag, Button, Space, message, Row, Col, Typography, Divider, Table, Modal, Form, Input, DatePicker, Select } from 'antd'
import {
    ArrowLeftOutlined,
    EditOutlined,
    FileTextOutlined,
    CalendarOutlined,
    UserOutlined,
    InfoCircleOutlined,
    DownloadOutlined,
    PrinterOutlined,
    CheckCircleOutlined,
    ToolOutlined,
    ProjectOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { quotationService } from '../../services/api/quotations'
import { projectService } from '../../services/api/projects'
import { clientService } from '../../services/api/clients'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import StateSelect from '../../components/common/StateSelect'
import { theme } from '../../styles/theme'
import { getPrimaryButtonStyle, getSecondaryButtonStyle, flexBetweenStyle } from '../../styles/styleUtils'

const { Text } = Typography
const { Option } = Select;

const QuotationDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [quotation, setQuotation] = useState<any>(null)

    // Create Project Modal State
    const [isCreateProjectModalVisible, setIsCreateProjectModalVisible] = useState(false)
    const [clients, setClients] = useState<any[]>([])
    const [form] = Form.useForm()
    const [creatingProject, setCreatingProject] = useState(false)

    useEffect(() => {
        if (id) {
            fetchQuotation()
        }
    }, [id])

    useEffect(() => {
        if (isCreateProjectModalVisible) {
            fetchClients()
        }
    }, [isCreateProjectModalVisible])

    const fetchClients = async () => {
        try {
            // Check if clientService exists and has getClients
            if (clientService && clientService.getClients) {
                const response = await clientService.getClients({ limit: 100 })
                if (response && response.clients) {
                    setClients(response.clients)
                }
            }
        } catch (error) {
            console.error("Failed to fetch clients for selection", error)
        }
    }

    const fetchQuotation = async () => {
        setLoading(true)
        try {
            const response = await quotationService.getQuotation(Number(id))
            setQuotation(response.quotation)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch quotation')
            navigate('/sales/quotations')
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadPDF = async () => {
        try {
            const blob = await quotationService.downloadPDF(Number(id));
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Quotation_${quotation?.quotation_number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            message.error("Failed to download PDF");
        }
    }

    const handlePrintPDF = async () => {
        try {
            const blob = await quotationService.downloadPDF(Number(id));
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            message.error("Failed to open PDF for printing");
        }
    }

    const openCreateProjectModal = () => {
        // Pre-fill form
        if (quotation) {
            form.setFieldsValue({
                proejct_name: quotation.lead?.company_name ? `${quotation.lead.company_name} Project` : `${quotation.lead?.name} Project`,
                location: quotation.lead?.address,
                city: quotation.lead?.city,
                state: quotation.lead?.state,
                start_date: dayjs(),
                client_id: quotation.lead?.client_id || undefined // If lead has client, select it
            })
        }
        setIsCreateProjectModalVisible(true)
    }

    const handleConfirmCreateProject = async () => {
        try {
            const values = await form.validateFields()
            setCreatingProject(true)

            const payload = {
                name: values.proejct_name,
                location: values.location,
                city: values.city,
                state: values.state,
                start_date: values.start_date?.format('YYYY-MM-DD'),
                client_id: values.client_selection === 'existing' ? values.client_id : null
                // Note: My backend API uses `client_id` directly. 
                // If user selected "Create New", we send null/undefined so backend creates it. 
                // If user selected "Existing", we send the ID.
            }
            // Adjust logic: If User selects a client from dropdown, send it. 
            // If user wants to auto-create, send null.
            const apiPayload = {
                ...payload,
                client_id: values.client_id // The form will control this
            }

            const response = await projectService.createProjectFromQuotation(Number(id), apiPayload)

            message.success('Project created successfully!')
            setIsCreateProjectModalVisible(false)

            if (response.project && response.project.id) {
                navigate(`/sales/projects/${response.project.id}`)
            } else {
                navigate('/sales/projects')
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to create project')
        } finally {
            setCreatingProject(false)
        }
    }

    const handleStatusChange = async (newStatus: string) => {
        try {
            setLoading(true)
            await quotationService.updateQuotation(Number(id), { status: newStatus })
            message.success(`Quotation marked as ${newStatus.replace('_', ' ')}`)
            fetchQuotation()
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to update status')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'default',
            sent: 'blue',
            accepted: 'green',
            rejected: 'red',
            expired: 'orange',
        }
        return colors[status] || 'default'
    }

    if (!quotation) {
        return (
            <PageContainer>
                <Card loading={loading}>
                    <div style={{ padding: '50px', textAlign: 'center' }}>
                        <Text type="secondary">Loading quotation details...</Text>
                    </div>
                </Card>
            </PageContainer>
        )
    }

    const itemColumns = [
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: 320,
            render: (text: string, record: any) => (
                <div>
                    <Text strong>{text}</Text>
                    {record.material && (
                        <div style={{ fontSize: '12px', color: theme.colors.neutral.gray500 }}>
                            Code: {record.material.material_code}
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 120,
            align: 'right' as const,
            render: (qty: number, record: any) => `${Number(qty).toFixed(2)}`
        },
        {
            title: 'Unit',
            dataIndex: 'unit',
            key: 'unit',
            width: 90,
            align: 'center' as const,
            render: (unit: string) => unit || '-'
        },
        {
            title: 'Rate',
            dataIndex: 'rate',
            key: 'rate',
            width: 150,
            align: 'right' as const,
            render: (rate: number) => `₹ ${Number(rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            width: 160,
            align: 'right' as const,
            render: (amount: number) => <Text strong>₹ {Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
        }
    ]

    return (
        <PageContainer maxWidth={1200}>
            <PageHeader
                title={`Quotation: ${quotation.quotation_number}`}
                subtitle={`Version ${quotation.version_number} • Created on ${dayjs(quotation.created_at).format('DD MMM YYYY')}`}
                icon={<FileTextOutlined />}
                extra={[
                    <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/sales/quotations')} style={getSecondaryButtonStyle()}>Back</Button>,
                    <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => navigate(`/sales/quotations/${id}/edit`)} style={getPrimaryButtonStyle()}>Edit</Button>
                ]}
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                    {/* Main Info */}
                    <SectionCard title="Client & Lead Information" icon={<UserOutlined />}>
                        <div style={{ padding: '8px 0' }}>
                            <Row gutter={[24, 24]}>
                                <Col xs={24} sm={12} md={6}>
                                    <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lead Name</Text>
                                    <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px', color: theme.colors.neutral.gray800 }}>
                                        {quotation.lead?.name}
                                    </div>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company</Text>
                                    <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px', color: theme.colors.neutral.gray800 }}>
                                        {quotation.lead?.company_name || '-'}
                                    </div>
                                </Col>
                                <Col xs={12} sm={8} md={5}>
                                    <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</Text>
                                    <div style={{ marginTop: '4px' }}>
                                        <Tag color={getStatusColor(quotation.status)} style={{ marginRight: 0, fontSize: '13px', padding: '2px 10px' }}>
                                            {quotation.status.toUpperCase()}
                                        </Tag>
                                    </div>
                                </Col>
                                <Col xs={12} sm={8} md={5}>
                                    <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valid Until</Text>
                                    <div style={{ marginTop: '4px', fontSize: '15px' }}>
                                        {quotation.valid_until ? (
                                            <Space>
                                                <CalendarOutlined style={{ color: theme.colors.primary.main }} />
                                                <Text strong>{dayjs(quotation.valid_until).format('DD MMM YYYY')}</Text>
                                            </Space>
                                        ) : 'N/A'}
                                    </div>
                                </Col>

                                <Col span={24}>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Terms</Text>
                                    <div style={{ marginTop: '8px', padding: '12px', background: '#f9f9f9', borderRadius: '6px', border: '1px solid #f0f0f0', fontSize: '14px', lineHeight: '1.6' }}>
                                        <Text style={{ whiteSpace: 'pre-wrap' }}>{quotation.payment_terms || 'No specific payment terms.'}</Text>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </SectionCard>

                    {/* Items */}
                    <SectionCard title="Quotation Items" icon={<FileTextOutlined />} style={{ marginTop: '16px' }}>
                        <Table
                            dataSource={quotation.items}
                            columns={itemColumns}
                            pagination={false}
                            rowKey="id"
                            summary={() => {
                                return (
                                    <>
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={0} colSpan={4} align="right">
                                                <Text type="secondary">Sub Total</Text>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right">
                                                <Text strong>₹ {Number(quotation.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                        {Number(quotation.discount_percentage) > 0 && (
                                            <Table.Summary.Row>
                                                <Table.Summary.Cell index={0} colSpan={4} align="right">
                                                    <Text type="secondary">Discount ({quotation.discount_percentage}%)</Text>
                                                </Table.Summary.Cell>
                                                <Table.Summary.Cell index={1} align="right">
                                                    <Text type="danger">- ₹ {((Number(quotation.total_amount) * Number(quotation.discount_percentage)) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                                                </Table.Summary.Cell>
                                            </Table.Summary.Row>
                                        )}
                                        <Table.Summary.Row style={{ background: theme.colors.primary.light }}>
                                            <Table.Summary.Cell index={0} colSpan={4} align="right">
                                                <Text strong style={{ fontSize: '16px', color: theme.colors.primary.main }}>Final Amount</Text>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right">
                                                <Text strong style={{ fontSize: '16px', color: theme.colors.primary.main }}>₹ {Number(quotation.final_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </>
                                )
                            }}
                        />
                    </SectionCard>



                    {(quotation.client_scope || quotation.contractor_scope) && (
                        <SectionCard title="Scope of Work" icon={<ToolOutlined />} style={{ marginTop: '16px' }}>
                            <Row gutter={[24, 24]}>
                                {quotation.client_scope && (
                                    <Col xs={24} md={12}>
                                        <Text strong style={{ display: 'block', marginBottom: '8px', textDecoration: 'underline' }}>
                                            CLIENT SCOPE (To be provided free of cost)
                                        </Text>
                                        <Text style={{ whiteSpace: 'pre-wrap' }}>{quotation.client_scope}</Text>
                                    </Col>
                                )}
                                {quotation.contractor_scope && (
                                    <Col xs={24} md={12}>
                                        <Text strong style={{ display: 'block', marginBottom: '8px', textDecoration: 'underline' }}>
                                            VHSHRI SCOPE
                                        </Text>
                                        <Text style={{ whiteSpace: 'pre-wrap' }}>{quotation.contractor_scope}</Text>
                                    </Col>
                                )}
                            </Row>
                        </SectionCard>
                    )}

                    {quotation.remarks && (
                        <SectionCard title="Remarks / Notes" icon={<InfoCircleOutlined />} style={{ marginTop: '16px' }}>
                            <Text style={{ whiteSpace: 'pre-wrap' }}>{quotation.remarks}</Text>
                        </SectionCard>
                    )}

                </Col>

                <Col xs={24} lg={8}>
                    <InfoCard title="Internal Details" icon={<InfoCircleOutlined />}>
                        <div style={flexBetweenStyle}>
                            <Text type="secondary">Created By:</Text>
                            <Text>{quotation.creator?.name || 'Unknown'}</Text>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={flexBetweenStyle}>
                            <Text type="secondary">Quote ID:</Text>
                            <Text strong>#{quotation.id}</Text>
                        </div>
                        <div style={flexBetweenStyle}>
                            <Text type="secondary">Version:</Text>
                            <Tag>v{quotation.version_number}</Tag>
                        </div>
                    </InfoCard>

                    <Card title="Document Actions" style={{ marginTop: '16px' }} size="small">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Button icon={<DownloadOutlined />} onClick={handleDownloadPDF} block>
                                Download PDF
                            </Button>
                            <Button icon={<PrinterOutlined />} onClick={handlePrintPDF} block>
                                Print PDF
                            </Button>
                        </div>
                    </Card>

                    {/* Workflow Actions */}
                    {['draft', 'sent', 'rejected', 'expired'].includes(quotation.status) && (
                        <Card title="Workflow Actions" style={{ marginTop: '16px', borderColor: '#d9d9d9' }} size="small">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {quotation.status === 'draft' && (
                                    <>
                                        <Button type="primary" onClick={() => handleStatusChange('sent')} block>
                                            Mark as Sent
                                        </Button>
                                        <Button onClick={() => handleStatusChange('approved')} block>
                                            Mark as Approved (Internal)
                                        </Button>
                                    </>
                                )}
                                {quotation.status === 'sent' && (
                                    <>
                                        <Button type="primary" style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={() => handleStatusChange('accepted_by_party')} block>
                                            Mark as Accepted by Client
                                        </Button>
                                        <Button danger onClick={() => handleStatusChange('rejected')} block>
                                            Mark as Rejected
                                        </Button>
                                    </>
                                )}
                                {(quotation.status === 'rejected' || quotation.status === 'expired') && (
                                    <Button onClick={() => handleStatusChange('draft')} block>
                                        Re-open as Draft
                                    </Button>
                                )}
                            </div>
                        </Card>
                    )}

                    {(quotation.status === 'accepted_by_party' || quotation.status === 'approved') && (
                        <Card style={{ marginTop: '16px', background: '#f6ffed', borderColor: '#b7eb8f' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <Space align="center">
                                    <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                                    <div>
                                        <Text strong style={{ color: '#52c41a' }}>Quotation {quotation.status === 'approved' ? 'Approved' : 'Accepted'}</Text>
                                        <div style={{ fontSize: '12px' }}>This quotation is ready for execution.</div>
                                    </div>
                                </Space>

                                {/* Workflow Logic: Project must be created first, then Work Order */}
                                {quotation.lead?.project?.id ? (
                                    <>
                                        <div style={{ background: 'rgba(255,255,255,0.6)', padding: '8px', borderRadius: '4px', border: '1px dashed #52c41a' }}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>Linked Project:</Text>
                                            <div style={{ fontWeight: 'bold', color: theme.colors.primary.main }}>
                                                {quotation.lead.project.name} ({quotation.lead.project.project_code})
                                            </div>
                                        </div>
                                        <Button
                                            icon={<ProjectOutlined />}
                                            style={{ width: '100%', borderColor: theme.colors.primary.main, color: theme.colors.primary.main }}
                                            onClick={() => navigate(`/sales/projects/${quotation.lead.project.id}`)}
                                        >
                                            View Project
                                        </Button>
                                        <Button
                                            type="primary"
                                            icon={<ToolOutlined />}
                                            style={{ width: '100%', backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                            onClick={() => navigate(`/operations/work-orders/new?quotation_id=${quotation.id}`)}
                                        >
                                            Create Work Order
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        type="primary"
                                        icon={<ProjectOutlined />}
                                        loading={loading}
                                        style={{ width: '100%' }}
                                        onClick={openCreateProjectModal}
                                    >
                                        Create Project
                                    </Button>
                                )}
                            </div>
                        </Card>
                    )}
                </Col>
            </Row>
            {/* Create Project Modal */}
            <Modal
                title="Create Project from Quotation"
                open={isCreateProjectModalVisible}
                onOk={handleConfirmCreateProject}
                onCancel={() => setIsCreateProjectModalVisible(false)}
                confirmLoading={creatingProject}
                width={600}
                okText="Create Project"
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        start_date: dayjs(),
                        client_action: 'create_new'
                    }}
                >
                    <InfoCard
                        title="Project Details"
                        style={{ marginBottom: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}
                    >
                        <Form.Item
                            name="proejct_name"
                            label="Project Name"
                            rules={[{ required: true, message: 'Please enter project name' }]}
                        >
                            <Input placeholder="Enter Project Name" />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="start_date"
                                    label="Start Date"
                                    rules={[{ required: true, message: 'Please select start date' }]}
                                >
                                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="contract_value"
                                    label="Contract Value"
                                >
                                    <Input
                                        prefix="₹"
                                        disabled
                                        defaultValue={quotation?.final_amount?.toLocaleString()}
                                        style={{ color: theme.colors.neutral.gray800 }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="location"
                            label="Site Location / Address"
                            rules={[{ required: true, message: 'Please enter site location' }]}
                        >
                            <Input.TextArea rows={2} placeholder="Enter Site Address" />
                        </Form.Item>

                        import StateSelect from '../../components/common/StateSelect'

                        // ... existing imports

                        // ... inside the component
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="city" label="City">
                                    <Input placeholder="City" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="state" label="State">
                                    <StateSelect
                                        onChange={(val, code) => {
                                            form.setFieldsValue({ state: val, site_state_code: code })
                                        }}
                                    />
                                </Form.Item>
                                <Form.Item name="site_state_code" hidden>
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>
                    </InfoCard>

                    <InfoCard
                        title="Client Mapping"
                        style={{ border: '1px solid #f0f0f0', borderRadius: 8 }}
                        icon={<UserOutlined />}
                    >
                        <Form.Item
                            name="client_id"
                            label="Select Client"
                            help="Leave empty to create a NEW Client from Lead details."
                        >
                            <Select
                                showSearch
                                placeholder="Select existing client or leave empty to create new"
                                optionFilterProp="children"
                                allowClear
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                options={[
                                    ...(quotation?.lead?.client_id ? [] : []), // If lead already has client, maybe show it?
                                    ...clients.map(c => ({ label: `${c.company_name} (${c.client_code})`, value: c.id }))
                                ]}
                            />
                        </Form.Item>

                        {!form.getFieldValue('client_id') && (
                            <div style={{ padding: '8px 12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
                                <Text type="success" style={{ fontSize: 13 }}>
                                    <CheckCircleOutlined /> A new client <b>{quotation?.lead?.company_name || quotation?.lead?.name}</b> will be created.
                                </Text>
                            </div>
                        )}

                        {quotation?.lead?.client_id && (
                            <div style={{ padding: '8px 12px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 4, marginTop: 8 }}>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    <InfoCircleOutlined /> Lead is already linked to a client.
                                </Text>
                            </div>
                        )}
                    </InfoCard>
                </Form>
            </Modal>
        </PageContainer >
    )
}

export default QuotationDetails
