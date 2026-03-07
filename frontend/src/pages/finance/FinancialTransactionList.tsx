import { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, DatePicker, Select, Typography, message } from 'antd'
import {
    WalletOutlined,
    PlusOutlined,
    SearchOutlined,
    FileTextOutlined,
    BankOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    FilterOutlined
} from '@ant-design/icons'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import { financeService } from '../../services/api/finance'
import { projectService } from '../../services/api/projects'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import {
    getPrimaryButtonStyle,
    getSecondaryButtonStyle,
    largeInputStyle
} from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const FinancialTransactionList = () => {
    const [loading, setLoading] = useState(false)
    const [transactions, setTransactions] = useState([])
    const [projects, setProjects] = useState([])
    const [filters, setFilters] = useState({
        project_id: null,
        start_date: null,
        end_date: null
    })
    const navigate = useNavigate()

    useEffect(() => {
        fetchTransactions()
        fetchProjects()
    }, [filters])

    const fetchProjects = async () => {
        try {
            const response = await projectService.getProjects()
            setProjects(response.projects || [])
        } catch (error) {
            console.error('Failed to fetch projects')
        }
    }

    const fetchTransactions = async () => {
        setLoading(true)
        try {
            const params: any = {}
            if (filters.project_id) params.project_id = filters.project_id
            if (filters.start_date) params.start_date = filters.start_date
            if (filters.end_date) params.end_date = filters.end_date

            const response = await financeService.getTransactions(params)
            setTransactions(response.transactions || [])
        } catch (error) {
            message.error('Failed to load transactions')
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        {
            title: 'Ref #',
            dataIndex: 'transaction_number',
            key: 'transaction_number',
            render: (text: string, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(record.transaction_date).format('DD MMM YYYY')}</Text>
                </Space>
            )
        },
        {
            title: 'Category',
            key: 'category',
            render: (_: any, record: any) => {
                const color = record.type === 'payment' ? 'volcano' : 'green'
                return (
                    <Space direction="vertical" size={0}>
                        <Tag color={color}>{record.type?.toUpperCase()}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.category?.split('_').join(' ').toUpperCase()}</Text>
                    </Space>
                )
            }
        },
        {
            title: 'Entity',
            key: 'entity',
            render: (_: any, record: any) => {
                let name = '-'
                if (record.vendor) { name = record.vendor.name }
                else if (record.client) { name = record.client.company_name }
                else if (record.project) { name = record.project.name }

                return (
                    <Space direction="vertical" size={0}>
                        <Text strong>{name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.project?.project_code}</Text>
                    </Space>
                )
            }
        },
        {
            title: 'Payment Mode',
            dataIndex: 'payment_mode',
            key: 'payment_mode',
            render: (text: string) => (
                <Space>
                    <BankOutlined style={{ color: theme.colors.primary.main }} />
                    <Text>{text.toUpperCase()}</Text>
                </Space>
            )
        },
        {
            title: 'Amount',
            dataIndex: 'net_amount',
            key: 'net_amount',
            align: 'right' as const,
            render: (amt: number, record: any) => (
                <Space direction="vertical" align="end" size={0}>
                    <Text strong style={{ fontSize: 16, color: record.type === 'payment' ? '#cf1322' : '#389e0d' }}>
                        {record.type === 'payment' ? '-' : '+'} ₹{Number(amt).toLocaleString('en-IN')}
                    </Text>
                    {record.tds_amount > 0 && <Text type="secondary" style={{ fontSize: 11 }}>TDS: ₹{Number(record.tds_amount).toLocaleString('en-IN')}</Text>}
                </Space>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const colors: any = { cleared: 'success', pending: 'processing', draft: 'default', cancelled: 'error' }
                const icons: any = { cleared: <CheckCircleOutlined />, pending: <ClockCircleOutlined /> }
                return <Tag icon={icons[status]} color={colors[status]}>{status.toUpperCase()}</Tag>
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                <Button
                    type="link"
                    icon={<FileTextOutlined />}
                    onClick={() => navigate(`/finance/transactions/${record.id}`)}
                >
                    View
                </Button>
            )
        }
    ]

    return (
        <PageContainer>
            <PageHeader
                title="Financial Transactions"
                subtitle="Central ledger for all payments, receipts, and bank movements across the project lifecycle."
                icon={<WalletOutlined />}
                extra={
                    <Space wrap>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => navigate('/finance/transactions/new')}
                            style={getPrimaryButtonStyle()}
                            size="large"
                        >
                            Record Transaction
                        </Button>
                    </Space>
                }
            />

            <SectionCard title="Search & Filters" icon={<FilterOutlined />}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <Select
                        placeholder="Filter by Project"
                        style={{ width: 250, ...largeInputStyle }}
                        size="large"
                        allowClear
                        showSearch
                        optionFilterProp="children"
                        onChange={(val) => setFilters({ ...filters, project_id: val })}
                    >
                        {projects.map((p: any) => (
                            <Option key={p.id} value={p.id}>{p.name}</Option>
                        ))}
                    </Select>

                    <RangePicker
                        size="large"
                        style={{ width: 300, ...largeInputStyle }}
                        onChange={(dates) => {
                            setFilters({
                                ...filters,
                                start_date: dates ? (dates[0] as any).format('YYYY-MM-DD') : null,
                                end_date: dates ? (dates[1] as any).format('YYYY-MM-DD') : null
                            })
                        }}
                    />

                    <Button
                        icon={<SearchOutlined />}
                        onClick={fetchTransactions}
                        size="large"
                        style={getSecondaryButtonStyle()}
                    >
                        Search
                    </Button>
                </div>
            </SectionCard>

            <div style={{ marginTop: 24 }}>
                <Table
                    columns={columns}
                    dataSource={transactions}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    bordered
                    scroll={{ x: 1000 }}
                />
            </div>
        </PageContainer>
    )
}

export default FinancialTransactionList
