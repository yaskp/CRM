import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Typography } from 'antd'
import { BankOutlined, SafetyCertificateOutlined, EnvironmentOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { masterService } from '../../services/api/master'
import StateSelect from '../../components/common/StateSelect'
import { PageContainer, PageHeader, SectionCard } from '../../components/common/PremiumComponents'
import { largeInputStyle, getLabelStyle, getPrimaryButtonStyle, getSecondaryButtonStyle, twoColumnGridStyle, actionCardStyle, flexBetweenStyle, prefixIconStyle } from '../../styles/styleUtils'

const { Text } = Typography

const BranchForm = () => {
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()

    useEffect(() => {
        if (id) {
            fetchBranch()
        }
    }, [id])

    const fetchBranch = async () => {
        try {
            // For now, get all and find one since service doesn't have getBranchById yet
            const response = await masterService.getBranches()
            const branch = response.branches.find((b: any) => b.id === Number(id))
            if (branch) {
                form.setFieldsValue(branch)
            }
        } catch (error: any) {
            message.error('Failed to fetch branch details')
        }
    }

    const onFinish = async (values: any) => {
        setLoading(true)
        try {
            if (id) {
                await masterService.updateBranch(Number(id), values)
                message.success('Billing Unit updated successfully!')
            } else {
                await masterService.createBranch(values)
                message.success('Billing Unit saved successfully!')
            }
            navigate('/master/branches')
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to save billing unit')
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageContainer maxWidth={800}>
            <PageHeader
                title={id ? 'Edit Billing Unit' : 'Define New Billing Unit'}
                subtitle="Manage GST registration and address for a regional office"
                icon={<BankOutlined />}
            />

            <Form form={form} layout="vertical" onFinish={onFinish}>
                <SectionCard title="Branch Identity" icon={<BankOutlined />}>
                    <Form.Item
                        label={<span style={getLabelStyle()}>Branch / Unit Name</span>}
                        name="branch_name"
                        rules={[{ required: true, message: 'Please enter branch name' }]}
                        tooltip="e.g., Jaipur Site Office, Maharashtra Head Office"
                    >
                        <Input
                            prefix={<BankOutlined style={prefixIconStyle} />}
                            placeholder="Enter branch name"
                            size="large"
                            style={largeInputStyle}
                        />
                    </Form.Item>

                    <div style={twoColumnGridStyle}>
                        <Form.Item
                            label={<span style={getLabelStyle()}>GSTIN</span>}
                            name="gstin"
                            rules={[
                                { required: true, message: 'Please enter GSTIN' },
                                { pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: 'Invalid GSTIN format' }
                            ]}
                            tooltip="Indian GST Identification Number"
                        >
                            <Input
                                prefix={<SafetyCertificateOutlined style={prefixIconStyle} />}
                                placeholder="e.g. 08AABCU9603R1ZM"
                                size="large"
                                style={largeInputStyle}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val.length >= 2) {
                                        form.setFieldsValue({ state_code: val.substring(0, 2) });
                                    }
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={getLabelStyle()}>State Code (Auto-from GST)</span>}
                            name="state_code"
                            rules={[{ required: true, message: 'State code is required' }]}
                        >
                            <Input
                                placeholder="08"
                                size="large"
                                style={largeInputStyle}
                                disabled
                            />
                        </Form.Item>
                    </div>

                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Note: The system identifies <b>CGST/SGST vs IGST</b> by comparing the first 2 digits of this GSTIN with the customer/vendor's GSTIN.
                    </Text>
                </SectionCard>

                <SectionCard title="Location Details" icon={<EnvironmentOutlined />}>
                    <Form.Item
                        label={<span style={getLabelStyle()}>Full Address</span>}
                        name="address"
                    >
                        <Input.TextArea rows={3} placeholder="Enter branch office address" style={largeInputStyle} />
                    </Form.Item>

                    <div style={twoColumnGridStyle}>
                        <Form.Item label={<span style={getLabelStyle()}>City</span>} name="city">
                            <Input placeholder="Jaipur" size="large" style={largeInputStyle} />
                        </Form.Item>

                        <Form.Item label={<span style={getLabelStyle()}>State</span>} name="state">
                            <StateSelect
                                onChange={(val, code) => {
                                    form.setFieldsValue({ state: val, state_code: code })
                                }}
                            />
                        </Form.Item>
                    </div>
                </SectionCard>

                <Card style={actionCardStyle}>
                    <div style={flexBetweenStyle}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/master/branches')}
                            style={getSecondaryButtonStyle()}
                        >
                            Back to List
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            icon={<SaveOutlined />}
                            size="large"
                            style={getPrimaryButtonStyle()}
                        >
                            {id ? 'Update' : 'Save'} Billing Unit
                        </Button>
                    </div>
                </Card>
            </Form>
        </PageContainer>
    )
}

export default BranchForm
