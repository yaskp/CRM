import { Card, Button, Form, Input, Switch, message, Row, Col, Typography, Space, Divider, Avatar } from 'antd'
import {
    SettingOutlined,
    SaveOutlined,
    BellOutlined,
    GlobalOutlined,
    SafetyCertificateOutlined,
    CloudUploadOutlined,
    MailOutlined,
    MobileOutlined,
    ShopOutlined,
    InfoCircleOutlined
} from '@ant-design/icons'
import { PageContainer, PageHeader, SectionCard, InfoCard } from '../../components/common/PremiumComponents'
import {
    getPrimaryButtonStyle,
    largeInputStyle,
    getLabelStyle,
    actionCardStyle,
    prefixIconStyle
} from '../../styles/styleUtils'
import { theme } from '../../styles/theme'

const { Text } = Typography

const Settings = () => {
    const onFinish = () => {
        message.success('System configurations updated successfully!')
    }

    return (
        <PageContainer maxWidth={1000}>
            <PageHeader
                title="System Configuration"
                subtitle="Manage global application parameters, notification preferences, and organizational metadata"
                icon={<SettingOutlined />}
            />

            <Form layout="vertical" onFinish={onFinish}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <SectionCard title="Corporate Identity" icon={<ShopOutlined />}>
                            <Form.Item
                                label={<span style={getLabelStyle()}>Company Name</span>}
                                name="companyName"
                                initialValue="YASKP Construction CRM"
                            >
                                <Input size="large" style={largeInputStyle} prefix={<ShopOutlined style={prefixIconStyle} />} />
                            </Form.Item>

                            <Form.Item
                                label={<span style={getLabelStyle()}>Corporate Website</span>}
                                name="website"
                                initialValue="https://www.constructionco.com"
                            >
                                <Input size="large" style={largeInputStyle} prefix={<GlobalOutlined style={prefixIconStyle} />} />
                            </Form.Item>

                            <Divider />
                            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                <Avatar size={80} icon={<CloudUploadOutlined />} style={{ marginBottom: '10px', backgroundColor: theme.colors.neutral.gray100, color: theme.colors.neutral.gray500, cursor: 'pointer' }} />
                                <br />
                                <Text type="secondary" style={{ fontSize: '11px' }}>Click to update company logo</Text>
                            </div>
                        </SectionCard>
                    </Col>

                    <Col xs={24} lg={12}>
                        <SectionCard title="Communication Hub" icon={<BellOutlined />}>
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                    <Space size="middle">
                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <MailOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
                                        </div>
                                        <Space direction="vertical" size={0}>
                                            <Text strong>Email Dispatch</Text>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>Send daily DPR and audit summaries</Text>
                                        </Space>
                                    </Space>
                                    <Form.Item name="emailNotif" valuePropName="checked" initialValue={true} noStyle>
                                        <Switch />
                                    </Form.Item>
                                </div>
                            </div>

                            <Divider />

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                    <Space size="middle">
                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <MobileOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                                        </div>
                                        <Space direction="vertical" size={0}>
                                            <Text strong>SMS Alerts</Text>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>Critical stock and approval alerts via SMS</Text>
                                        </Space>
                                    </Space>
                                    <Form.Item name="smsNotif" valuePropName="checked" initialValue={false} noStyle>
                                        <Switch />
                                    </Form.Item>
                                </div>
                            </div>

                            <InfoCard title="Privacy Note" style={{ marginTop: '20px' }}>
                                Admin changes to notification channels affect all authorized project members.
                            </InfoCard>
                        </SectionCard>
                    </Col>
                </Row>

                <div style={{ marginTop: theme.spacing.lg }}>
                    <SectionCard title="Security & Compliance" icon={<SafetyCertificateOutlined />}>
                        <Row gutter={24}>
                            <Col span={12}>
                                <Form.Item label={<span style={getLabelStyle()}>API Access Retention</span>} initialValue="90 Days">
                                    <Input size="large" style={largeInputStyle} disabled />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label={<span style={getLabelStyle()}>Audit Log Policy</span>} initialValue="Permanent">
                                    <Input size="large" style={largeInputStyle} disabled />
                                </Form.Item>
                            </Col>
                        </Row>
                    </SectionCard>
                </div>

                <Card style={{ ...actionCardStyle, marginTop: theme.spacing.xl }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <Text type="secondary">
                            <InfoCircleOutlined style={{ marginRight: '8px' }} />
                            Global settings remain active until next system restart.
                        </Text>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            icon={<SaveOutlined />}
                            style={{ ...getPrimaryButtonStyle(200), width: window.innerWidth < 576 ? '100%' : 'auto' }}
                        >
                            Sync Configurations
                        </Button>
                    </div>
                </Card>
            </Form>
        </PageContainer>
    )
}

export default Settings
