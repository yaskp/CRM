import { useState, useEffect } from 'react'
import { Card, Tag, Button, Space, Row, Col, Typography, Divider, Table, Modal, Form, Input, DatePicker, Select, Switch, App } from 'antd'
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
    ProjectOutlined,
    ShopOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { quotationService } from '../../services/api/quotations'
import { projectService } from '../../services/api/projects'
import { clientService } from '../../services/api/clients'
import { warehouseService } from '../../services/api/warehouses'
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
    const { message } = App.useApp()
    const [loading, setLoading] = useState(false)
    const [quotation, setQuotation] = useState<any>(null)

    // Create Project Modal State
    const [isCreateProjectModalVisible, setIsCreateProjectModalVisible] = useState(false)
    const [clients, setClients] = useState<any[]>([])
    const [clientGroups, setClientGroups] = useState<any[]>([])
    const [warehouses, setWarehouses] = useState<any[]>([])
    const [form] = Form.useForm()
    const [creatingProject, setCreatingProject] = useState(false)
    const selectedClientId = Form.useWatch('client_id', form)
    const isGstRegistered = Form.useWatch('is_gst_registered', form)
    const warehouseAction = Form.useWatch('warehouse_action', form)

    useEffect(() => {
        if (id) {
            fetchQuotation()
        }
    }, [id])

    useEffect(() => {
        if (isCreateProjectModalVisible) {
            fetchClients()
            fetchClientGroups()
            fetchWarehouses()
        }
    }, [isCreateProjectModalVisible])

    const fetchWarehouses = async () => {
        try {
            if (warehouseService && warehouseService.getWarehouses) {
                const response = await warehouseService.getWarehouses()
                setWarehouses(response.warehouses || [])
            }
        } catch (error) {
            console.error("Failed to fetch warehouses", error)
        }
    }

    const fetchClientGroups = async () => {
        try {
            if (clientService && clientService.getClientGroups) {
                const response = await clientService.getClientGroups()
                setClientGroups(response.groups || [])
            }
        } catch (error) {
            console.error("Failed to fetch client groups", error)
        }
    }

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
                project_name: quotation.lead?.company_name ? `${quotation.lead.company_name} Project` : `${quotation.lead?.name} Project`,
                location: quotation.lead?.address,
                city: quotation.lead?.city,
                state: quotation.lead?.state,
                start_date: dayjs(),
                client_id: quotation.lead?.client_id || undefined, // If lead has client, select it
                warehouse_action: 'create_new',
                warehouse_type: 'site',
                warehouse_name: quotation.lead?.company_name ? `Site Store - ${quotation.lead.company_name}` : `Site Store - ${quotation.lead?.name}`,
                warehouse_address: quotation.lead?.address,
                warehouse_city: quotation.lead?.city,
                warehouse_state: quotation.lead?.state,
                warehouse_pincode: quotation.lead?.pincode,
                warehouse_gstin: quotation.lead?.gstin || (quotation.lead?.client?.gstin),
                warehouse_incharge_name: quotation.lead?.name,
                warehouse_incharge_phone: quotation.lead?.phone,
                // New Fields for Client Master
                company_name: quotation.lead?.company_name || '',
                contact_person: quotation.lead?.name,
                email: quotation.lead?.email,
                phone: quotation.lead?.phone,
                contract_value: quotation?.final_amount?.toLocaleString(),
            })
        }
        setIsCreateProjectModalVisible(true)
    }

    const handleConfirmCreateProject = async () => {
        try {
            const values = await form.validateFields()
            setCreatingProject(true)

            const apiPayload = {
                ...values,
                name: values.project_name,
                start_date: values.start_date?.format('YYYY-MM-DD'),
                client_id: values.client_id // The form will control this
            }

            const response = await projectService.createProjectFromQuotation(Number(id), apiPayload)

            message.success(quotation.lead?.project_id ? 'Project synced successfully!' : 'Project created successfully!')
            setIsCreateProjectModalVisible(false)

            if (response.project && response.project.id) {
                if (!quotation.lead?.project_id) {
                    navigate(`/sales/projects/${response.project.id}`)
                } else {
                    fetchQuotation() // Reload data if it was just a sync
                }
            } else {
                navigate('/sales/projects')
            }
        } catch (error: any) {
            if (error?.errorFields && error.errorFields.length > 0) {
                message.error(error.errorFields[0].errors[0]);
                return;
            }
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

    const handleReviseQuotation = async () => {
        try {
            setLoading(true)
            const response = await quotationService.reviseQuotation(Number(id))
            message.success(`New revision (v${response.quotation.version_number}) created!`)
            navigate(`/sales/quotations/${response.quotation.id}/edit`)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to revise quotation')
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
            superseded: 'warning',
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
            title: 'Work Category',
            key: 'category',
            width: 180,
            render: (_: any, record: any) => (
                <Text strong>{record.parentWorkItemType?.name || '-'}</Text>
            )
        },
        {
            title: 'Sub-Work Type',
            key: 'sub_type',
            width: 180,
            render: (_: any, record: any) => (
                <Text>{record.workItemType?.name || '-'}</Text>
            )
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: 320,
            render: (text: string, record: any) => (
                <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    <Text italic>{text}</Text>
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
            render: (qty: number) => `${Number(qty).toFixed(2)}`
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
                subtitle={
                    <Space>
                        <span>Version {quotation.version_number} • Created on {dayjs(quotation.created_at).format('DD MMM YYYY')}</span>
                        {quotation.status === 'superseded' && (
                            <Tag color="orange" icon={<InfoCircleOutlined />}>SUPERSEDED BY NEWER VERSION</Tag>
                        )}
                    </Space>
                }
                icon={<FileTextOutlined />}
                extra={[
                    <Space key="actions" wrap style={{ width: '100%', justifyContent: 'flex-end', gap: 8 }}>
                        <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/sales/quotations')} style={getSecondaryButtonStyle()}>Back</Button>
                        <Button
                            key="revise"
                            icon={<FileTextOutlined />}
                            onClick={handleReviseQuotation}
                            style={getSecondaryButtonStyle()}
                            loading={loading}
                            disabled={quotation.status === 'superseded'}
                        >
                            Revise
                        </Button>
                        <Button
                            key="edit"
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/sales/quotations/${id}/edit`)}
                            style={getPrimaryButtonStyle()}
                            disabled={quotation.status === 'superseded'}
                        >
                            Edit
                        </Button>
                        {['accepted', 'accepted_by_party', 'approved'].includes(quotation.status) && (
                            <Button
                                key="project"
                                type="primary"
                                icon={<ProjectOutlined />}
                                onClick={openCreateProjectModal}
                                style={{
                                    ...getPrimaryButtonStyle(),
                                    background: quotation.lead?.project_id ? theme.colors.success.main : theme.colors.primary.main,
                                    borderColor: quotation.lead?.project_id ? theme.colors.success.main : theme.colors.primary.main,
                                    width: window.innerWidth < 576 ? '100%' : 'auto'
                                }}
                            >
                                {quotation.lead?.project_id ? 'Sync' : 'Create Project'}
                            </Button>
                        )}
                    </Space>
                ]}
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                    {/* Main Info */}
                    <SectionCard title="Client & Lead Information" icon={<UserOutlined />}>
                        <div style={{ padding: '8px 0' }}>
                            <Row gutter={[24, 24]}>
                                <Col xs={24} sm={12} md={6}>
                                    <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Lead Name</Text>
                                    <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>
                                        {quotation.lead?.name}
                                    </div>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Company</Text>
                                    <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>
                                        {quotation.lead?.company_name || '-'}
                                    </div>
                                </Col>
                                <Col xs={12} sm={8} md={5}>
                                    <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Status</Text>
                                    <div style={{ marginTop: '4px' }}>
                                        <Tag color={getStatusColor(quotation.status)} style={{ marginRight: 0 }}>
                                            {quotation.status.toUpperCase()}
                                        </Tag>
                                    </div>
                                </Col>
                                <Col xs={12} sm={8} md={5}>
                                    <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Valid Until</Text>
                                    <div style={{ marginTop: '4px' }}>
                                        {quotation.valid_until ? (
                                            <Space size={4}>
                                                <CalendarOutlined style={{ color: theme.colors.primary.main }} />
                                                <Text strong>{dayjs(quotation.valid_until).format('DD MMM YY')}</Text>
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
                            scroll={{ x: 'max-content' }}
                            summary={() => {
                                return (
                                    <>
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={0} colSpan={6} align="right">
                                                <Text type="secondary">Sub Total</Text>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right">
                                                <Text strong>₹ {Number(quotation.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                        {Number(quotation.discount_percentage) > 0 && (
                                            <Table.Summary.Row>
                                                <Table.Summary.Cell index={0} colSpan={6} align="right">
                                                    <Text type="secondary">Discount ({quotation.discount_percentage}%)</Text>
                                                </Table.Summary.Cell>
                                                <Table.Summary.Cell index={1} align="right">
                                                    <Text type="danger">- ₹ {((Number(quotation.total_amount) * Number(quotation.discount_percentage)) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                                                </Table.Summary.Cell>
                                            </Table.Summary.Row>
                                        )}
                                        <Table.Summary.Row style={{ background: theme.colors.primary.light }}>
                                            <Table.Summary.Cell index={0} colSpan={6} align="right">
                                                <Text strong style={{ fontSize: '16px', color: theme.colors.primary.main }}>Final Amount</Text>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right">
                                                <Text strong style={{ fontSize: '18px', color: theme.colors.primary.main }}>₹ {Number(quotation.final_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                                                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>* GST Extra as applicable</div>
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </>
                                )
                            }}
                        />
                    </SectionCard>



                    {(quotation.scope_matrix && Array.isArray(quotation.scope_matrix) && quotation.scope_matrix.length > 0) ? (
                        <SectionCard title="Scope of Work Responsibilities" icon={<ToolOutlined />} style={{ marginTop: '16px' }}>
                            <Row gutter={[32, 32]}>
                                <Col xs={24} md={12}>
                                    <div style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '8px', marginBottom: '12px' }}>
                                        <Text strong style={{ fontSize: '16px', color: '#444' }}>CLIENT'S RESPONSIBILITIES</Text>
                                    </div>
                                    {(() => {
                                        const list: any[] = [];
                                        let currentHeader: any = null;
                                        let lastHeaderAdded = false;
                                        quotation.scope_matrix.forEach((item: any) => {
                                            if (item.is_category) {
                                                currentHeader = item;
                                                lastHeaderAdded = false;
                                            } else if (item.client_scope) {
                                                if (currentHeader && !lastHeaderAdded) {
                                                    list.push({ ...currentHeader, is_header: true });
                                                    lastHeaderAdded = true;
                                                }
                                                list.push(item);
                                            }
                                        });
                                        if (list.length === 0) return <Text type="secondary">No specific client responsibilities defined.</Text>;
                                        return list.map((it, idx) => (
                                            <div key={idx} style={{
                                                marginBottom: it.is_header ? '4px' : '6px',
                                                marginTop: it.is_header ? '12px' : '0',
                                                paddingLeft: it.is_header ? '0' : '12px'
                                            }}>
                                                {it.is_header ? (
                                                    <Text strong style={{ fontSize: '13px', color: '#1890ff', textTransform: 'uppercase' }}>{it.description}</Text>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                                        <Text style={{ marginRight: '8px', color: '#52c41a' }}>✓</Text>
                                                        <Text style={{ flex: 1 }}>{it.description}</Text>
                                                    </div>
                                                )}
                                            </div>
                                        ));
                                    })()}
                                </Col>
                                <Col xs={24} md={12}>
                                    <div style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '8px', marginBottom: '12px' }}>
                                        <Text strong style={{ fontSize: '16px', color: '#0d9488' }}>VHSHRI'S RESPONSIBILITIES</Text>
                                    </div>
                                    {(() => {
                                        const list: any[] = [];
                                        let currentHeader: any = null;
                                        let lastHeaderAdded = false;
                                        quotation.scope_matrix.forEach((item: any) => {
                                            if (item.is_category) {
                                                currentHeader = item;
                                                lastHeaderAdded = false;
                                            } else if (item.contractor_scope) {
                                                if (currentHeader && !lastHeaderAdded) {
                                                    list.push({ ...currentHeader, is_header: true });
                                                    lastHeaderAdded = true;
                                                }
                                                list.push(item);
                                            }
                                        });
                                        if (list.length === 0) return <Text type="secondary">No specific contractor responsibilities defined.</Text>;
                                        return list.map((it, idx) => (
                                            <div key={idx} style={{
                                                marginBottom: it.is_header ? '4px' : '6px',
                                                marginTop: it.is_header ? '12px' : '0',
                                                paddingLeft: it.is_header ? '0' : '12px'
                                            }}>
                                                {it.is_header ? (
                                                    <Text strong style={{ fontSize: '13px', color: '#0d9488', textTransform: 'uppercase' }}>{it.description}</Text>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                                        <Text style={{ marginRight: '8px', color: '#0d9488' }}>✓</Text>
                                                        <Text style={{ flex: 1 }}>{it.description}</Text>
                                                    </div>
                                                )}
                                            </div>
                                        ));
                                    })()}
                                </Col>
                            </Row>
                        </SectionCard>
                    ) : (
                        (quotation.client_scope || quotation.contractor_scope) && (
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
                        )
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
                                        style={{
                                            width: '100%',
                                            background: quotation.lead?.project_id ? theme.colors.success.main : theme.colors.primary.main,
                                            borderColor: quotation.lead?.project_id ? theme.colors.success.main : theme.colors.primary.main
                                        }}
                                        onClick={openCreateProjectModal}
                                    >
                                        {quotation.lead?.project_id ? 'Sync with Project' : 'Create Project'}
                                    </Button>
                                )}
                            </div>
                        </Card>
                    )}
                </Col>
            </Row>
            {/* Create Project Modal */}
            <Modal
                title={quotation.lead?.project_id ? "Sync Quotation with Project" : "Create Project from Quotation"}
                open={isCreateProjectModalVisible}
                onOk={handleConfirmCreateProject}
                onCancel={() => setIsCreateProjectModalVisible(false)}
                confirmLoading={creatingProject}
                width="95%"
                style={{ maxWidth: 800 }}
                okText={quotation.lead?.project_id ? "Sync & Update Project" : "Create Project"}
            >
                {quotation.lead?.project_id && (
                    <div style={{ marginBottom: 16, padding: '12px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 4 }}>
                        <Text type="secondary">
                            <InfoCircleOutlined /> A project <b>{quotation.lead.project?.name}</b> already exists for this lead. Syncing will update the project's contract value and BOQ materials to match this revision.
                        </Text>
                    </div>
                )}
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        start_date: dayjs(),
                        client_action: 'create_new'
                    }}
                    onValuesChange={(changedValues, allValues) => {
                        // Sync logic: If Store creation is enabled, auto-fill details from Project/Client section if they are empty
                        if (allValues.warehouse_action === 'create_new' && (changedValues.warehouse_type || changedValues.warehouse_action || changedValues.location || changedValues.city || changedValues.state || changedValues.gstin || changedValues.pincode)) {
                            const updates: any = {};

                            // Auto-sync unless properly touched or explicitly synced via checkbox
                            const isSameAsSite = form.getFieldValue('same_as_site_location');

                            if (isSameAsSite || !form.isFieldTouched('warehouse_address')) updates.warehouse_address = allValues.location;
                            if (isSameAsSite || !form.isFieldTouched('warehouse_city')) updates.warehouse_city = allValues.city;
                            if (isSameAsSite || !form.isFieldTouched('warehouse_state')) updates.warehouse_state = allValues.state;
                            if (isSameAsSite || !form.isFieldTouched('warehouse_pincode')) updates.warehouse_pincode = allValues.pincode;
                            if (isSameAsSite || !form.isFieldTouched('warehouse_gstin')) updates.warehouse_gstin = allValues.gstin;

                            // If checkbox is toggled ON, force sync immediately
                            if (changedValues.same_as_site_location === true) {
                                updates.warehouse_address = allValues.location;
                                updates.warehouse_city = allValues.city;
                                updates.warehouse_state = allValues.state;
                                updates.warehouse_pincode = allValues.pincode;
                                // GSTIN might be different? usually same client. Let's sync it too if not explicitly different.
                                updates.warehouse_gstin = allValues.gstin;
                            }

                            if (Object.keys(updates).length > 0) {
                                form.setFieldsValue(updates);
                            }
                        }
                    }}
                >
                    <InfoCard
                        title="Project Details"
                        style={{ marginBottom: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}
                    >
                        <Form.Item
                            name="project_name"
                            label="Project Name"
                            rules={[{ required: true, message: 'Please enter project name' }]}
                        >
                            <Input placeholder="Enter Project Name" />
                        </Form.Item>

                        <Row gutter={[16, 0]}>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="start_date"
                                    label="Start Date"
                                    rules={[{ required: true, message: 'Please select start date' }]}
                                >
                                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    name="contract_value"
                                    label="Contract Value"
                                >
                                    <Input
                                        prefix="₹"
                                        disabled
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

                        <Row gutter={[16, 0]}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="city" label="City">
                                    <Input placeholder="City" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
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
                                    ...clients.map(c => ({ label: `${c.company_name} (${c.client_code})`, value: c.id }))
                                ]}
                            />
                        </Form.Item>

                        {!selectedClientId && (
                            <>
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong style={{ color: theme.colors.primary.main }}>New Client Details</Text>
                                    <Divider style={{ margin: '8px 0' }} />
                                </div>

                                <Form.Item
                                    name="company_name"
                                    label="Client Company Name"
                                    rules={[{ required: true, message: 'Please enter company name' }]}
                                >
                                    <Input placeholder="Enter Company Name" />
                                </Form.Item>

                                <Form.Item
                                    name="contact_person"
                                    label="Primary Contact Person"
                                    rules={[{ required: true, message: 'Please enter contact person name' }]}
                                >
                                    <Input placeholder="Enter Contact Person" />
                                </Form.Item>

                                <Row gutter={[16, 0]}>
                                    <Col xs={24} sm={12}>
                                        <Form.Item
                                            name="email"
                                            label="Email Address"
                                            rules={[{ type: 'email', message: 'Invalid email' }]}
                                        >
                                            <Input placeholder="Enter Email" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Form.Item
                                            name="phone"
                                            label="Phone Number"
                                        >
                                            <Input placeholder="Enter Phone" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item
                                    name="client_group_id"
                                    label="Client Group (Optional)"
                                >
                                    <Select
                                        showSearch
                                        placeholder="Select Client Group"
                                        optionFilterProp="children"
                                    >
                                        {clientGroups.map(g => (
                                            <Option key={g.id} value={g.id}>{g.group_name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Row gutter={[16, 0]}>
                                    <Col xs={16} sm={12}>
                                        <Form.Item
                                            name="client_type"
                                            label="Client Type"
                                            initialValue="company"
                                        >
                                            <Select showSearch optionFilterProp="children">
                                                <Option value="company">Company</Option>
                                                <Option value="individual">Individual</Option>
                                                <Option value="government">Government</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col xs={8} sm={12}>
                                        <Form.Item
                                            name="is_gst_registered"
                                            label="GST?"
                                            valuePropName="checked"
                                            initialValue={true}
                                        >
                                            <Switch checkedChildren="Yes" unCheckedChildren="No" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                {isGstRegistered && (
                                    <Form.Item
                                        name="gstin"
                                        label="GSTIN"
                                        rules={[
                                            { required: true, message: 'GSTIN is required' },
                                            { pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: 'Invalid GSTIN' }
                                        ]}
                                    >
                                        <Input placeholder="Enter GSTIN" />
                                    </Form.Item>
                                )}

                                <Row gutter={[16, 0]}>
                                    <Col xs={24} sm={14}>
                                        <Form.Item
                                            name="pan"
                                            label="PAN Number"
                                            rules={[{ pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Invalid PAN' }]}
                                        >
                                            <Input placeholder="Enter PAN" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={10}>
                                        <Form.Item name="pincode" label="Pincode">
                                            <Input placeholder="Pincode" maxLength={6} />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={[16, 0]}>
                                    <Col xs={24} sm={12}>
                                        <Form.Item name="credit_limit" label="Credit Limit">
                                            <Input placeholder="Credit Limit" type="number" prefix="₹" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Form.Item name="payment_terms" label="Payment Terms">
                                            <Input placeholder="e.g. Net 30" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <div style={{ padding: '8px 12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4, marginBottom: 16 }}>
                                    <Text type="success" style={{ fontSize: 13 }}>
                                        <CheckCircleOutlined /> A new client <b>{quotation?.lead?.company_name || quotation?.lead?.name}</b> will be created.
                                    </Text>
                                </div>
                            </>
                        )}

                        {quotation?.lead?.client_id && selectedClientId === quotation.lead.client_id && (
                            <div style={{ padding: '8px 12px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 4, marginTop: 8 }}>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    <InfoCircleOutlined /> Lead is already linked to this client.
                                </Text>
                            </div>
                        )}
                    </InfoCard>

                    <InfoCard
                        title="Site / Store Configuration"
                        style={{ border: '1px solid #f0f0f0', borderRadius: 8, marginTop: 16 }}
                        icon={<ShopOutlined />}
                    >
                        <Row gutter={[16, 0]}>
                            <Col xs={24} sm={warehouseAction === 'create_new' ? 12 : 24}>
                                <Form.Item name="warehouse_action" label="Store Setup Strategy">
                                    <Select showSearch optionFilterProp="children" placeholder="Select action">
                                        <Option value="none">Don't create or link store</Option>
                                        <Option value="create_new">Create New Store</Option>
                                        <Option value="link_existing">Link Existing Store</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            {warehouseAction === 'create_new' && (
                                <Col xs={24} sm={12}>
                                    <Form.Item name="warehouse_type" label="Store Category">
                                        <Select showSearch optionFilterProp="children" placeholder="Select category">
                                            <Option value="site">🏗️ Site Store</Option>
                                            <Option value="regional">📍 Regional Store</Option>
                                            <Option value="fabrication">⚙️ Fabrication Yard</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            )}
                        </Row>

                        {warehouseAction === 'link_existing' ? (
                            <Form.Item
                                name="warehouse_id"
                                label="Select Existing Store"
                                rules={[{ required: true, message: 'Please select an existing store' }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Select store"
                                    optionFilterProp="children"
                                    options={warehouses.map(w => ({ label: `${w.name} (${w.code})`, value: w.id }))}
                                />
                            </Form.Item>
                        ) : (
                            <>
                                <Row gutter={[16, 0]}>
                                    <Col xs={24} sm={14}>
                                        <Form.Item
                                            name="warehouse_name"
                                            label="Store Name"
                                            rules={[{ required: true, message: 'Please enter store name' }]}
                                        >
                                            <Input placeholder="e.g. Site Store" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={10}>
                                        <Form.Item
                                            name="warehouse_code"
                                            label="Store Code"
                                        >
                                            <Input placeholder="Optional" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item
                                    name="same_as_site_location"
                                    valuePropName="checked"
                                    initialValue={true}
                                >
                                    <Switch
                                        checkedChildren="Same as Site Location"
                                        unCheckedChildren="Different Address"
                                        defaultChecked
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="warehouse_address"
                                    label="Site Store Address"
                                >
                                    <Input.TextArea rows={1} placeholder="Site Office Address" />
                                </Form.Item>

                                <Row gutter={[12, 0]}>
                                    <Col xs={24} sm={8}>
                                        <Form.Item name="warehouse_city" label="City">
                                            <Input placeholder="City" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={12} sm={8}>
                                        <Form.Item name="warehouse_state" label="State">
                                            <StateSelect
                                                onChange={(val, code) => {
                                                    form.setFieldsValue({ warehouse_state: val, warehouse_state_code: code })
                                                }}
                                            />
                                        </Form.Item>
                                        <Form.Item name="warehouse_state_code" hidden><Input /></Form.Item>
                                    </Col>
                                    <Col xs={12} sm={8}>
                                        <Form.Item name="warehouse_pincode" label="Pincode">
                                            <Input placeholder="Pincode" maxLength={6} />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={[16, 0]}>
                                    <Col xs={24} sm={12}>
                                        <Form.Item name="warehouse_incharge_name" label="Incharge Name">
                                            <Input placeholder="Incharge Name" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Form.Item name="warehouse_incharge_phone" label="Incharge Phone">
                                            <Input placeholder="Incharge Phone" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item name="warehouse_gstin" label="Store GSTIN (If different from client)">
                                    <Input placeholder="Enter GSTIN" maxLength={15} />
                                </Form.Item>
                            </>
                        )}
                    </InfoCard>
                </Form>
            </Modal>
        </PageContainer >
    )
}

export default QuotationDetails
