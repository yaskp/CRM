import { useState, useEffect } from 'react'
import { Table, Button, Space, Card, Tag, message, Typography, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, BankOutlined, EnvironmentOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { masterService } from '../../services/api/master'
import { PageContainer, PageHeader } from '../../components/common/PremiumComponents'
import { theme } from '../../styles/theme'

const { Text } = Typography

const BranchList = () => {
    const [loading, setLoading] = useState(false)
    const [branches, setBranches] = useState<any[]>([])
    const navigate = useNavigate()

    useEffect(() => {
        fetchBranches()
    }, [])

    const fetchBranches = async () => {
        setLoading(true)
        try {
            const response = await masterService.getBranches()
            setBranches(response.branches || [])
        } catch (error: any) {
            message.error('Failed to fetch billing units')
        } finally {
            setLoading(false)
        }
    }

    const onDelete = async (id: number) => {
        try {
            await masterService.deleteBranch(id)
            message.success('Billing unit deleted successfully')
            fetchBranches()
        } catch (error: any) {
            message.error('Failed to delete billing unit')
        }
    }

    const columns = [
        {
            title: 'Branch / Billing Unit',
            dataIndex: 'branch_name',
            key: 'branch_name',
            render: (text: string, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: 16 }}>{text}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        <EnvironmentOutlined /> {record.city}, {record.state}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'GSTIN',
            dataIndex: 'gstin',
            key: 'gstin',
            render: (text: string) => (
                <Tag color="cyan" icon={<SafetyCertificateOutlined />} style={{ padding: '4px 12px', borderRadius: 4 }}>
                    {text}
                </Tag>
            ),
        },
        {
            title: 'State Code',
            dataIndex: 'state_code',
            key: 'state_code',
            render: (text: string) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            ellipsis: true,
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (active: boolean) => (
                <Tag color={active ? 'success' : 'error'}>
                    {active ? 'ACTIVE' : 'INACTIVE'}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'action',
            render: (_: any, record: any) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: theme.colors.primary.main }} />}
                        onClick={() => navigate(`/master/branches/${record.id}`)}
                    />
                    <Popconfirm
                        title="Are you sure you want to delete this billing unit?"
                        onConfirm={() => onDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <PageContainer>
            <PageHeader
                title="Billing Units (Company GST Registrations)"
                subtitle="Manage your company's regional offices and GST numbers for accurate tax billing"
                icon={<BankOutlined />}
                extra={[
                    <Button
                        key="add"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/master/branches/new')}
                        size="large"
                        style={{ borderRadius: 8, height: 45 }}
                    >
                        Add Billing Unit
                    </Button>,
                ]}
            />

            <Card
                variant="borderless"
                style={{ borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
            >
                <Table
                    columns={columns}
                    dataSource={branches}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </PageContainer>
    )
}

export default BranchList
