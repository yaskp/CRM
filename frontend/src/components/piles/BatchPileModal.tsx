import { useEffect, useState } from 'react'
import { Modal, Form, Row, Col, Input, Select, Divider, Typography } from 'antd'
import PileDiagram from './PileDiagram'
import { theme } from '../../styles/theme'

const { Text } = Typography
const { Option } = Select

interface BatchPileModalProps {
    open: boolean
    onCancel: () => void
    onSubmit: (values: any) => void
    loading: boolean
}

const BatchPileModal = ({ open, onCancel, onSubmit, loading }: BatchPileModalProps) => {
    const [form] = Form.useForm()
    const [formData, setFormData] = useState<any>({
        diameter: 1000,
        design_depth: 28,
        rock_socket_depth: 1.5,
        top_rl: 0,
        bottom_rl: -28
    })

    useEffect(() => {
        if (open) {
            form.resetFields()
            setFormData({
                diameter: 1000,
                design_depth: 28,
                rock_socket_depth: 1.5,
                top_rl: 0,
                bottom_rl: -28
            })
        }
    }, [open, form])

    const onFormValuesChange = (_changedValues: any, allValues: any) => {
        let Dia = Number(allValues.diameter || 0) / 1000
        let D = Number(allValues.design_depth || 0)

        const concreteBase = Number((Math.PI * Math.pow(Dia / 2, 2) * D).toFixed(3))

        form.setFieldsValue({
            concrete_design_qty: concreteBase
        })

        setFormData(allValues)
    }

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 4, height: 24, background: theme.colors.primary.main, borderRadius: 2 }} />
                    <span style={{ fontSize: 20 }}>Batch Generate Piles</span>
                </div>
            }
            open={open}
            onOk={() => form.submit()}
            onCancel={onCancel}
            confirmLoading={loading}
            width={1000}
            centered
        >
            <Row gutter={32}>
                <Col span={16}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onSubmit}
                        initialValues={{
                            prefix: 'PL-',
                            start_no: 1,
                            pile_type: 'Working',
                            concrete_grade: 'M30',
                            diameter: 1000,
                            design_depth: 28,
                            rock_socket_depth: 1.5
                        }}
                        onValuesChange={onFormValuesChange}
                    >
                        <div style={{ marginBottom: 16, background: '#e6f7ff', padding: '12px', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                            <Text strong>Sequence Generation:</Text> <Text>Generate multiple piles with common technical specifications.</Text>
                        </div>

                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="prefix" label="Prefix">
                                    <Input maxLength={10} placeholder="PL-" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="start_no" label="Start No" rules={[{ required: true }]}>
                                    <Input type="number" min={1} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="end_no" label="End No" rules={[{ required: true }]}>
                                    <Input type="number" min={1} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider orientation="left" style={{ borderColor: theme.colors.primary.main }}>📐 Technical Specifications (Common)</Divider>

                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item name="diameter" label="Diameter (mm)" rules={[{ required: true }]}>
                                    <Input type="number" placeholder="1000" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="design_depth" label="Design Depth (m)" rules={[{ required: true }]}>
                                    <Input type="number" step="0.1" placeholder="28.0" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="rock_socket_depth" label="Rock Socket (m)">
                                    <Input type="number" step="0.1" placeholder="1.5" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item name="top_rl" label="Cut-off Level (m)">
                                    <Input type="number" step="0.001" placeholder="COL" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="bottom_rl" label="Starting Level">
                                    <Input type="number" step="0.001" placeholder="Rock/Toe" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="reinforcement_ton" label="Steel Qty (Ton)">
                                    <Input type="number" step="0.001" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider orientation="left" style={{ borderColor: '#52c41a' }}>📊 Per Pile Estimates</Divider>
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item name="concrete_design_qty" label="Theoretical Concrete Consumption per Pile (m³)">
                                    <Input readOnly style={{ background: '#f6ffed', fontWeight: 'bold' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Col>
                <Col span={8}>
                    <PileDiagram
                        diameter={formData.diameter}
                        depth={formData.design_depth}
                        rockSocket={formData.rock_socket_depth}
                        topRL={formData.top_rl}
                        bottomRL={formData.bottom_rl}
                    />
                </Col>
            </Row>
        </Modal>
    )
}

export default BatchPileModal
