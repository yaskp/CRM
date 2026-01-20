import { useState, useEffect } from 'react'
import { Card, Descriptions, Tag, Button, Space, message, Tabs } from 'antd'
import {
    EditOutlined,
    TeamOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    BankOutlined,
    ProjectOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { clientService } from '../../services/api/clients'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle } from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

interface Client {
    id: number
    client_code: string
    company_name: string
    contact_person?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    gstin?: string
    pan?: string
    payment_terms?: string
    credit_limit?: number
    client_type: string
    status: string
    created_at: string
    updated_at: string
}

const ClientDetails = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [client, setClient] = useState<Client | null>(null)
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])

    useEffect(() => {
        if (id) {
            fetchClient()
            fetchProjects()
        }
    }, [id])

    const fetchClient = async () => {
        setLoading(true)
        try {
            const response = await clientService.getClient(Number(id))
            setClient(response.client)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch client')
        } finally {
            setLoading(false)
        }
    }

    const fetchProjects = async () => {
        try {
            const response = await clientService.getClientProjects(Number(id))
            setProjects(response.projects || [])
        } catch (error: any) {
            console.error('Failed to fetch projects')
        }
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            active: 'success',
            inactive: 'default',
            blocked: 'error',
        }
        return colors[status] || 'default'
    }

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            individual: 'blue',
            company: 'purple',
            government: 'orange',
        }
        return colors[type] || 'default'
    }

    if (!client) {
        return <PageContainer><div>Loading...</div></PageContainer>
    }

    return (
        <PageContainer>
            <PageHeader
                title={client.company_name}
                subtitle={`Client Code: ${client.client_code}`}
                icon={<TeamOutlined />}
                extra={
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/sales/clients/${id}/edit`)}
                        size="large"
                        style={getPrimaryButtonStyle()}
                    >
                        Edit Client
                    </Button>
                }
            />

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                    <SectionCard title="Basic Information" icon={<TeamOutlined />}>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Company Name">{client.company_name}</Descriptions.Item>
                            <Descriptions.Item label="Contact Person">{client.contact_person || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Email">
                                {client.email ? (
                                    <a href={`mailto:${client.email}`}>{client.email}</a>
                                ) : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Phone">
                                {client.phone ? (
                                    <a href={`tel:${client.phone}`}>{client.phone}</a>
                                ) : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Client Type">
                                <Tag color={getTypeColor(client.client_type)}>
                                    {client.client_type.toUpperCase()}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={getStatusColor(client.status)}>
                                    {client.status.toUpperCase()}
                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>
                    </SectionCard>

                    <SectionCard title="Address Information" icon={<EnvironmentOutlined />}>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Address">{client.address || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="City">{client.city || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="State">{client.state || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Pincode">{client.pincode || 'N/A'}</Descriptions.Item>
                        </Descriptions>
                    </SectionCard>

                    <SectionCard title="Financial & Tax Information" icon={<BankOutlined />}>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="GSTIN">{client.gstin || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="PAN">{client.pan || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Credit Limit">
                                {client.credit_limit ? `₹${client.credit_limit.toLocaleString('en-IN')}` : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Payment Terms">{client.payment_terms || 'N/A'}</Descriptions.Item>
                        </Descriptions>
                    </SectionCard>
                </div>

                <Card>
                    <Tabs
                        items={[
                            {
                                key: 'projects',
                                label: (
                                    <span>
                                        <ProjectOutlined /> Projects ({projects.length})
                                    </span>
                                ),
                                children: (
                                    <div style={{ padding: 16 }}>
                                        {projects.length > 0 ? (
                                            <div>Projects will be displayed here</div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                                                No projects found for this client
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: 'invoices',
                                label: (
                                    <span>
                                        <BankOutlined /> Invoices (0)
                                    </span>
                                ),
                                children: (
                                    <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>
                                        Invoice module coming soon
                                    </div>
                                ),
                            },
                        ]}
                    />
                </Card>
            </Space>
        </PageContainer>
    )
}

export default ClientDetails
