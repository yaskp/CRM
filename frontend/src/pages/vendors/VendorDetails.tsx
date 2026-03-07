import { useState, useEffect } from 'react'
import { Card, Descriptions, Tag, Button, Row, Col, Typography, Divider, Tabs, Space } from 'antd'
import {
    ShopOutlined,
    ArrowLeftOutlined,
    EditOutlined,
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
    BankOutlined,
    SafetyOutlined,
    HistoryOutlined,
    WalletOutlined,
    IdcardOutlined,
    UserOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { vendorService } from '../../services/api/vendors'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import { getPrimaryButtonStyle, getSecondaryButtonStyle } from '../../styles/styleUtils'

const { Text } = Typography

const VendorDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [vendor, setVendor] = useState<any>(null)

    useEffect(() => {
        if (id) {
            fetchVendor()
        }
    }, [id])

    const fetchVendor = async () => {
        try {
            const response = await vendorService.getVendorById(Number(id))
            setVendor(response.vendor)
        } catch (error) {
            console.error('Failed to fetch vendor', error)
        }
    }

    if (!vendor) return <PageContainer>Loading...</PageContainer>

    const vendorTypeLabels: Record<string, string> = {
        steel_contractor: 'Steel Contractor',
        concrete_contractor: 'Concrete Contractor',
        rig_vendor: 'Rig Vendor',
        crane_vendor: 'Crane Vendor',
        jcb_vendor: 'JCB Vendor',
        other: 'Other',
    }

    const typeLabel = vendorTypeLabels[vendor.vendor_type] || vendor.vendor_type

    return (
        <PageContainer maxWidth={1400}>
            <PageHeader
                title={vendor.name}
                subtitle={`Vendor Code: VEND-${String(vendor.id).padStart(4, '0')}`}
                icon={<ShopOutlined />}
                extra={(
                    <Space wrap>
                        <Button
                            key="back"
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/master/vendors')}
                            style={getSecondaryButtonStyle()}
                        >
                            Back
                        </Button>
                        <Button
                            key="edit"
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/master/vendors/${id}/edit`)}
                            style={getPrimaryButtonStyle()}
                        >
                            Edit Vendor
                        </Button>
                        <Button
                            key="pay"
                            type="primary"
                            icon={<WalletOutlined />}
                            onClick={() => navigate(`/finance/transactions/new?vendor_id=${id}&category=vendor`)}
                            style={{ ...getPrimaryButtonStyle(), background: '#722ed1', borderColor: '#722ed1' }}
                        >
                            Pay Vendor
                        </Button>
                    </Space>
                )}
            />

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <SectionCard title="Vendor Overview" icon={<ShopOutlined />}>
                        <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}>
                            <Descriptions.Item label="Vendor Type">
                                <Tag color="blue" style={{ fontSize: 13, padding: '4px 8px' }}>{typeLabel}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={vendor.is_active ? 'success' : 'error'}>
                                    {vendor.is_active ? 'Active' : 'Inactive'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Registered Since">
                                {new Date(vendor.created_at).toLocaleDateString()}
                            </Descriptions.Item>
                        </Descriptions>
                    </SectionCard>

                    {vendor.contacts && vendor.contacts.length > 0 && (
                        <SectionCard title="Contact Persons" icon={<IdcardOutlined />}>
                            <Row gutter={[16, 16]}>
                                {vendor.contacts.map((contact: any, index: number) => (
                                    <Col xs={24} sm={12} key={contact.id || index}>
                                        <Card size="small" style={{ borderRadius: 8, height: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                                <div style={{
                                                    backgroundColor: '#e6f7ff',
                                                    padding: 8,
                                                    borderRadius: '50%',
                                                    marginRight: 12
                                                }}>
                                                    <UserOutlined style={{ color: '#1890ff' }} />
                                                </div>
                                                <div>
                                                    <Text strong>{contact.contact_name}</Text>
                                                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{contact.designation || 'No Designation'}</div>
                                                </div>
                                            </div>
                                            <Divider style={{ margin: '8px 0' }} />
                                            <div style={{ fontSize: 13 }}>
                                                <div style={{ marginBottom: 4 }}>
                                                    <PhoneOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                                                    {contact.phone || 'N/A'}
                                                </div>
                                                <div style={{ marginBottom: 4 }}>
                                                    <MailOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                                                    {contact.email || 'N/A'}
                                                </div>
                                                <div>
                                                    <IdcardOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
                                                    {contact.aadhar_number ? (
                                                        <Text style={{ fontSize: 13 }}>{contact.aadhar_number}</Text>
                                                    ) : 'N/A'}
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </SectionCard>
                    )}

                    <div style={{ marginTop: 24 }}>
                        <Tabs
                            defaultActiveKey="orders"
                            items={[
                                {
                                    key: 'orders',
                                    label: <span><HistoryOutlined /> Purchase Orders</span>,
                                    children: (
                                        <Card>
                                            {/* Reuse PurchaseOrderList but filtered for this vendor if possible, 
                                                 or typically we would fetch POs for this vendor. 
                                                 For now simpler view: just a placeholder or list linked */}
                                            <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
                                                Check Purchase Orders module filtered by {vendor.name}
                                                <br />
                                                <Button
                                                    style={{ marginTop: 12 }}
                                                    onClick={() => navigate(`/procurement/purchase-orders?vendor=${vendor.id}`)}
                                                >
                                                    View Vendor Orders
                                                </Button>
                                            </div>
                                        </Card>
                                    )
                                }
                            ]}
                        />
                    </div>
                </Col>

                <Col xs={24} lg={8}>
                    <InfoCard title="Address Details" icon={<EnvironmentOutlined />}>
                        <div style={{ fontSize: 15, lineHeight: 1.6 }}>
                            {vendor.address || 'No Address Provided'}
                            <br />
                            {vendor.city && <>{vendor.city}, </>} {vendor.state}
                            {vendor.pincode && <> - {vendor.pincode}</>}
                        </div>
                        {vendor.state_code && (
                            <Tag color="orange" style={{ marginTop: 12 }}>
                                GST State Code: {vendor.state_code}
                            </Tag>
                        )}
                    </InfoCard>

                    <InfoCard title="Compliance & Bank" icon={<BankOutlined />} style={{ marginTop: 24 }}>
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label={<Text type="secondary">GSTIN</Text>}>
                                {vendor.gst_number ? (
                                    <Tag color="green"><SafetyOutlined /> {vendor.gst_number}</Tag>
                                ) : <Text type="secondary">Not Registered</Text>}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">PAN</Text>}>
                                {vendor.pan_number || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">MSME</Text>}>
                                {vendor.is_msme ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <Tag color="purple">Registered ({vendor.msme_category})</Tag>
                                        <Text copyable style={{ fontSize: 13 }}>{vendor.msme_number}</Text>
                                    </div>
                                ) : <Text type="secondary">Not Registered</Text>}
                            </Descriptions.Item>
                            <Divider style={{ margin: '12px 0' }} />
                            <Descriptions.Item label={<Text type="secondary">Bank Name</Text>}>
                                {vendor.bank_name || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">Account No</Text>}>
                                {vendor.account_number || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Text type="secondary">IFSC</Text>}>
                                {vendor.ifsc_code || '-'}
                            </Descriptions.Item>
                        </Descriptions>
                    </InfoCard>
                </Col>
            </Row>
        </PageContainer>
    )
}

export default VendorDetails
