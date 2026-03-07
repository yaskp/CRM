import { useState, useEffect } from 'react'
import { Card, Descriptions, Tag, Button, Space, message, Tabs, Avatar, List, Typography } from 'antd'
import {
    EditOutlined,
    TeamOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    BankOutlined,
    ProjectOutlined,
    UserOutlined,
    IdcardOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { clientService } from '../../services/api/clients'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle } from '../../styles/styleUtils'

const { Text } = Typography

interface ClientContact {
    id: number
    contact_name: string
    designation?: string
    email?: string
    phone?: string
    is_primary?: boolean
}

interface ClientGroup {
    id: number
    group_name: string
    group_type: string
    description?: string
}

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
    group?: ClientGroup
    contacts?: ClientContact[]
}

const ClientDetails = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [client, setClient] = useState<Client | null>(null)
    const [projects, setProjects] = useState<any[]>([])

    useEffect(() => {
        if (id) {
            fetchClient()
            fetchProjects()
        }
    }, [id])

    const fetchClient = async () => {
        try {
            const response = await clientService.getClient(Number(id))
            setClient(response.client)
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch client')
        } finally {
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

    const getGroupTypeEmoji = (type: string) => {
        const emojis: Record<string, string> = {
            corporate: '🏢',
            sme: '🏭',
            government: '🏛️',
            individual: '👤',
            retail: '🏪',
        }
        return emojis[type] || '🏢'
    }

    if (!client) {
        return <PageContainer><div>Loading...</div></PageContainer>
    }

    return (
        <PageContainer>
            <PageHeader
                title={client.company_name}
                subtitle={
                    <div>
                        <Text style={{ fontSize: 14, color: '#666' }}>Client Code: {client.client_code}</Text>
                        {client.group && (
                            <Tag
                                color="blue"
                                style={{
                                    marginLeft: 12,
                                    fontSize: 13,
                                    padding: '4px 12px',
                                }}
                            >
                                {getGroupTypeEmoji(client.group.group_type)} {client.group.group_name}
                            </Tag>
                        )}
                    </div>
                }
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
                    {/* Contact Persons Card */}
                    <SectionCard title="Contact Persons" icon={<UserOutlined />}>
                        {client.contacts && client.contacts.length > 0 ? (
                            <List
                                dataSource={client.contacts}
                                renderItem={(contact) => (
                                    <List.Item
                                        style={{
                                            padding: '12px 0',
                                            borderBottom: '1px solid #f0f0f0',
                                        }}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar
                                                    size={48}
                                                    icon={<UserOutlined />}
                                                    style={{
                                                        backgroundColor: contact.is_primary ? '#1890ff' : '#52c41a',
                                                    }}
                                                />
                                            }
                                            title={
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Text strong style={{ fontSize: 15 }}>
                                                        {contact.contact_name}
                                                    </Text>
                                                    {contact.is_primary && (
                                                        <Tag color="blue" style={{ fontSize: 11 }}>
                                                            Primary
                                                        </Tag>
                                                    )}
                                                </div>
                                            }
                                            description={
                                                <div style={{ marginTop: 4 }}>
                                                    {contact.designation && (
                                                        <div style={{ marginBottom: 4 }}>
                                                            <IdcardOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                                                            <Text style={{ fontSize: 13 }}>{contact.designation}</Text>
                                                        </div>
                                                    )}
                                                    {contact.email && (
                                                        <div style={{ marginBottom: 4 }}>
                                                            <MailOutlined style={{ marginRight: 6, color: '#52c41a' }} />
                                                            <a href={`mailto:${contact.email}`} style={{ fontSize: 13 }}>
                                                                {contact.email}
                                                            </a>
                                                        </div>
                                                    )}
                                                    {contact.phone && (
                                                        <div>
                                                            <PhoneOutlined style={{ marginRight: 6, color: '#faad14' }} />
                                                            <a href={`tel:${contact.phone}`} style={{ fontSize: 13 }}>
                                                                {contact.phone}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                                No contact persons added
                            </div>
                        )}
                    </SectionCard>

                    {/* Address Information */}
                    <SectionCard title="Address Information" icon={<EnvironmentOutlined />}>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Address">{client.address || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="City">{client.city || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="State">{client.state || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Pincode">{client.pincode || 'N/A'}</Descriptions.Item>
                        </Descriptions>
                    </SectionCard>

                    {/* Financial & Tax Information */}
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

                    {/* Client Information */}
                    <SectionCard title="Client Information" icon={<TeamOutlined />}>
                        <Descriptions column={1} bordered size="small">
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
                            {client.group && (
                                <>
                                    <Descriptions.Item label="Parent Company">
                                        {getGroupTypeEmoji(client.group.group_type)} {client.group.group_name}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Group Type">
                                        <Tag color="blue">{client.group.group_type.toUpperCase()}</Tag>
                                    </Descriptions.Item>
                                </>
                            )}
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
                                            <List
                                                dataSource={projects}
                                                renderItem={(project: any) => (
                                                    <List.Item>
                                                        <List.Item.Meta
                                                            title={project.project_name}
                                                            description={`Code: ${project.project_code}`}
                                                        />
                                                    </List.Item>
                                                )}
                                            />
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
