import { useState, useEffect } from 'react'
import { Card, Descriptions, Tag, Button, Space, message, Row, Col, Typography, Divider, Table, Modal, Input, InputNumber } from 'antd'
import {
    ArrowLeftOutlined,
    EditOutlined,
    ContainerOutlined,
    ProjectOutlined,
    InfoCircleOutlined,
    PrinterOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    CheckOutlined,
    CloseOutlined,
    PlusOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { materialRequisitionService } from '../../services/api/materialRequisitions'
import dayjs from 'dayjs'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'
import { getPrimaryButtonStyle, getSecondaryButtonStyle, flexBetweenStyle } from '../../styles/styleUtils'
import { useAuth } from '../../context/AuthContext'

const { Text, Title } = Typography

const MaterialRequisitionDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [requisition, setRequisition] = useState<any>(null)

    // Approval Modal State
    const [approvalModalVisible, setApprovalModalVisible] = useState(false)
    const [approvalItems, setApprovalItems] = useState<any[]>([])

    useEffect(() => {
        if (id) {
            fetchRequisition()
        }
    }, [id])

    const fetchRequisition = async () => {
        setLoading(true)
        try {
            const response = await materialRequisitionService.getRequisitionById(Number(id))
            setRequisition(response.data || response.requisition)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch requisition')
            navigate('/procurement/requisitions')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        const colors: any = {
            draft: 'default',
            pending: 'processing',
            approved: 'success',
            partially_approved: 'warning',
            rejected: 'error',
            cancelled: 'default',
        }
        return colors[status] || 'default'
    }

    const getPriorityColor = (priority: string) => {
        const colors: any = {
            low: 'blue',
            medium: 'cyan',
            high: 'orange',
            urgent: 'red',
        }
        return colors[priority] || 'default'
    }

    const openApprovalModal = () => {
        if (!requisition) return
        const items = requisition.items?.map((item: any) => ({
            id: item.id,
            material_id: item.material_id,
            material: item.material,
            requested_quantity: item.requested_quantity,
            issued_quantity: item.requested_quantity, // Default to full approval
            unit: item.unit
        })) || []
        setApprovalItems(items)
        setApprovalModalVisible(true)
    }

    const handleApprovalSubmit = async () => {
        try {
            await materialRequisitionService.approveRequisition(Number(id), {
                action: 'approve',
                items: approvalItems.map(item => ({
                    id: item.id,
                    material_id: item.material_id,
                    issued_quantity: Number(item.issued_quantity)
                }))
            })
            message.success('Requisition approved and stock issued successfully')
            setApprovalModalVisible(false)
            fetchRequisition()
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to approve requisition')
        }
    }

    const handleReject = async () => {
        Modal.confirm({
            title: 'Reject Requisition',
            icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
            content: (
                <div style={{ marginTop: '16px' }}>
                    <p>Are you sure you want to reject this requisition?</p>
                    <Input.TextArea
                        id="rejection_reason_details"
                        placeholder="Please provide a reason for rejection..."
                        rows={3}
                        style={{ marginTop: '8px' }}
                    />
                </div>
            ),
            okText: 'Reject',
            okType: 'danger',
            cancelText: 'Back',
            onOk: async () => {
                const reason = (document.getElementById('rejection_reason_details') as HTMLTextAreaElement)?.value
                try {
                    await materialRequisitionService.approveRequisition(Number(id), {
                        action: 'reject',
                        rejection_reason: reason,
                    })
                    message.success('Requisition rejected')
                    fetchRequisition()
                } catch (error: any) {
                    message.error(error.response?.data?.message || 'Failed to reject requisition')
                }
            },
        })
    }


    if (!requisition) {
        return (
            <PageContainer>
                <Card loading={loading}>
                    <div style={{ padding: '50px', textAlign: 'center' }}>
                        <Text type="secondary">Loading requisition details...</Text>
                    </div>
                </Card>
            </PageContainer>
        )
    }

    const itemColumns = [
        {
            title: 'Material',
            dataIndex: 'material',
            key: 'material',
            render: (material: any, record: any) => (
                <div>
                    <Text strong>{material?.name || 'Unknown Item'}</Text>
                    {material?.code && <div style={{ fontSize: '12px', color: theme.colors.neutral.gray500 }}>{material.code}</div>}
                </div>
            )
        },
        {
            title: 'Requested Qty',
            dataIndex: 'requested_quantity',
            key: 'quantity',
            align: 'right' as const,
            render: (qty: number, record: any) => <Tag color="blue">{qty} {record.unit || ''}</Tag>
        },
        {
            title: 'Est. Rate',
            dataIndex: 'estimated_rate',
            key: 'rate',
            align: 'right' as const,
            render: (rate: number) => rate ? `₹ ${Number(rate).toLocaleString('en-IN')}` : '-'
        },
        {
            title: 'Specification',
            dataIndex: 'specification',
            key: 'spec',
            render: (text: string) => text ? <Text type="secondary" style={{ fontSize: '12px' }}>{text}</Text> : '-'
        }
    ]

    const canApprove = requisition.status === 'pending' && user?.roles?.some((role: string) => ['Admin', 'Store Manager'].includes(role));
    const isDraftOrPending = ['draft', 'pending'].includes(requisition.status);

    return (
        <PageContainer maxWidth={1200}>
            <PageHeader
                title={`MR: ${requisition.requisition_number}`}
                subtitle={`Created on ${dayjs(requisition.created_at).format('DD MMM YYYY')}`}
                icon={<ContainerOutlined />}
                extra={[
                    <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/procurement/requisitions')} style={getSecondaryButtonStyle()}>Back</Button>,
                    <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()} style={getSecondaryButtonStyle()}>Print</Button>,
                    isDraftOrPending && (
                        <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => navigate(`/procurement/requisitions/${id}/edit`)} style={getPrimaryButtonStyle()}>Edit</Button>
                    ),
                    canApprove && (
                        <Button key="reject" danger icon={<CloseOutlined />} onClick={handleReject}>Reject</Button>
                    ),
                    requisition.status === 'approved' && (
                        <Button
                            key="create_po"
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => navigate(`/procurement/purchase-orders/new?mr_id=${id}`)}
                            style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                        >
                            Generate PO
                        </Button>
                    )
                ]}
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                    {/* Main Info */}
                    <SectionCard title="Project & Source Information" icon={<ProjectOutlined />}>
                        <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle">
                            <Descriptions.Item label={<Text type="secondary">Project</Text>}>
                                <b>{requisition.project?.name}</b>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Source Warehouse</Text>}>
                                {requisition.from_warehouse?.name || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Status</Text>}>
                                <Tag color={getStatusColor(requisition.status)}>{requisition.status.replace('_', ' ').toUpperCase()}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Priority</Text>}>
                                <Tag color={getPriorityColor(requisition.priority)}>{requisition.priority?.toUpperCase()}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Required Date</Text>}>
                                {requisition.required_date ? dayjs(requisition.required_date).format('DD MMM YYYY') : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Purpose</Text>} span={2}>
                                {requisition.purpose || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Remarks</Text>} span={2}>
                                {requisition.remarks || '-'}
                            </Descriptions.Item>
                        </Descriptions>
                    </SectionCard>

                    {/* Items */}
                    <SectionCard title="Requested Materials" icon={<ContainerOutlined />} style={{ marginTop: '16px' }}>
                        <Table
                            dataSource={requisition.items}
                            columns={itemColumns}
                            pagination={false}
                            rowKey="id"
                            scroll={{ x: 800 }}
                            summary={() => {
                                const total = requisition.items?.reduce((sum: number, item: any) => sum + (Number(item.estimated_amount) || 0), 0) || 0;
                                return (
                                    <>
                                        <Table.Summary.Row style={{ background: theme.colors.neutral.gray50 }}>
                                            <Table.Summary.Cell index={0} colSpan={2} align="right">
                                                <Text strong>Estimated Total Amount</Text>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} colSpan={2}>
                                                <Text strong style={{ color: theme.colors.primary.main }}>₹ {total.toLocaleString('en-IN')}</Text>
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </>
                                )
                            }}
                        />
                    </SectionCard>

                </Col>

                <Col xs={24} lg={8}>
                    <InfoCard title="Request Details" icon={<InfoCircleOutlined />}>
                        <div style={flexBetweenStyle}>
                            <Text type="secondary">Requested By:</Text>
                            <Text>{requisition.requester?.name || 'Unknown'}</Text>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={flexBetweenStyle}>
                            <Text type="secondary">Req. Number:</Text>
                            <Text>{requisition.requisition_number}</Text>
                        </div>
                    </InfoCard>

                    {requisition.status === 'rejected' && (
                        <Card style={{ marginTop: '16px', background: '#fff1f0', borderColor: '#ffa39e' }}>
                            <Space align="center">
                                <CloseCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
                                <div>
                                    <Text strong style={{ color: '#ff4d4f' }}>Requisition Rejected</Text>
                                    <div style={{ fontSize: '12px' }}>{requisition.rejection_reason || 'No reason provided.'}</div>
                                </div>
                            </Space>
                        </Card>
                    )}

                    {requisition.status === 'approved' && (
                        <Card style={{ marginTop: '16px', background: '#f6ffed', borderColor: '#b7eb8f' }}>
                            <Space align="center">
                                <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                                <div>
                                    <Text strong style={{ color: '#52c41a' }}>Approved & Issued</Text>
                                    <div style={{ fontSize: '12px' }}>Materials have been authorized for issue.</div>
                                </div>
                            </Space>
                        </Card>
                    )}
                </Col>
            </Row>

            {/* Approval Modal */}
            <Modal
                title={<Text strong style={{ fontSize: '18px' }}><CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} /> Approve & Issue Material</Text>}
                open={approvalModalVisible}
                onCancel={() => setApprovalModalVisible(false)}
                onOk={handleApprovalSubmit}
                width={850}
                okText="Approve & Issue"
                cancelText="Cancel"
                okButtonProps={{ style: getPrimaryButtonStyle(160), size: 'large' }}
                cancelButtonProps={{ size: 'large' }}
            >
                <div style={{ padding: '16px 0' }}>
                    <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                        <Col xs={24} sm={12}>
                            <Text type="secondary">Project</Text>
                            <div style={{ fontSize: '16px', fontWeight: 600 }}>{requisition?.project?.name}</div>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Text type="secondary">Requester</Text>
                            <div style={{ fontSize: '16px', fontWeight: 600 }}>{requisition?.requester?.name}</div>
                        </Col>
                    </Row>

                    <Table
                        dataSource={approvalItems}
                        rowKey="id"
                        pagination={false}
                        bordered
                        scroll={{ x: 600 }}
                        columns={[
                            {
                                title: 'Material',
                                dataIndex: ['material', 'name'],
                                key: 'material',
                                render: (text) => <Text strong>{text}</Text>
                            },
                            {
                                title: 'Requested',
                                dataIndex: 'requested_quantity',
                                key: 'requested',
                                width: 140,
                                render: (qty, record) => <Tag color="blue">{qty} {record.unit}</Tag>
                            },
                            {
                                title: 'Issue Quantity',
                                dataIndex: 'issued_quantity',
                                key: 'issued',
                                width: 180,
                                render: (value, record) => (
                                    <InputNumber
                                        min={0}
                                        max={record.requested_quantity}
                                        value={value}
                                        onChange={(val) => {
                                            setApprovalItems(prev => prev.map(item =>
                                                item.id === record.id ? { ...item, issued_quantity: val } : item
                                            ))
                                        }}
                                        style={{ width: '100%' }}
                                        size="large"
                                    />
                                )
                            }
                        ]}
                    />
                </div>
            </Modal>

        </PageContainer>
    )
}

export default MaterialRequisitionDetails
