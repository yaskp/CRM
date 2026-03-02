import { useState, useEffect } from 'react'
import { Modal, Form, Row, Col, Input, Select, Statistic, Divider } from 'antd'
import PileDiagram from './PileDiagram'
import { theme } from '../../styles/theme'

const { Option } = Select

interface EditPileModalProps {
    open: boolean
    onCancel: () => void
    onSubmit: (values: any) => void
    loading: boolean
    editingPile: any
}

const EditPileModal = ({ open, onCancel, onSubmit, loading, editingPile }: EditPileModalProps) => {
    const [form] = Form.useForm()
    const [formData, setFormData] = useState<any>({
        diameter: 1000,
        design_depth: 28,
        rock_socket_depth: 1.5,
        top_rl: 0,
        bottom_rl: -28
    })
    const [calculatedValues, setCalculatedValues] = useState({
        concrete_volume: 0,
    })

    useEffect(() => {
        if (open && editingPile) {
            const initialValues = {
                ...editingPile,
                diameter: editingPile.length, // Dia was stored in length
                design_depth: editingPile.design_depth,
                overflow_pct: editingPile.overflow_pct || 5
            }
            form.setFieldsValue(initialValues)
            calculateConcrete(editingPile.length, editingPile.design_depth, editingPile.overflow_pct || 5)
            setFormData(initialValues)
        }
    }, [open, editingPile, form])

    const calculateConcrete = (diaMm: number, depth: number, overflowPct: number = 5) => {
        const diaM = Number(diaMm || 0) / 1000
        const d = Number(depth || 0)
        const overbreak = 1 + (Number(overflowPct || 0) / 100)

        const concreteBase = Number((Math.PI * Math.pow(diaM / 2, 2) * d).toFixed(3))
        const concreteWithOverbreak = Number((concreteBase * overbreak).toFixed(3))

        setCalculatedValues({ concrete_volume: concreteBase })
        form.setFieldsValue({ concrete_design_qty: concreteWithOverbreak })
    }

    const onFormValuesChange = (_changedValues: any, allValues: any) => {
        calculateConcrete(allValues.diameter, allValues.design_depth, allValues.overflow_pct)
        setFormData(allValues)
    }

    const handleFinish = (values: any) => {
        onSubmit({
            ...values,
            concrete_design_qty: calculatedValues.concrete_volume
        })
    }

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 4, height: 24, background: theme.colors.warning.main, borderRadius: 2 }} />
                    <span style={{ fontSize: 20 }}>Edit Pile Properties: {editingPile?.panel_identifier}</span>
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
                    <Form form={form} layout="vertical" onFinish={handleFinish} onValuesChange={onFormValuesChange}>
                        <Row gutter={24}>
                            <Col span={8}>
                                <Form.Item name="panel_identifier" label="Pile ID / Number" rules={[{ required: true }]}>
                                    <Input disabled size="large" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="pile_type" label="Pile Category">
                                    <Select size="large">
                                        <Option value="Working">Working (Main)</Option>
                                        <Option value="Test">Initial/Test Pile</Option>
                                        <Option value="Anchor">Anchor Pile</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="concrete_grade" label="Concrete Grade">
                                    <Select size="large">
                                        <Option value="M25">M-25</Option>
                                        <Option value="M30">M-30</Option>
                                        <Option value="M35">M-35</Option>
                                        <Option value="M40">M-40</Option>
                                        <Option value="M50">M-50</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider orientation="left" style={{ borderColor: theme.colors.primary.main }}>📐 Design Geometry</Divider>

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
                            <Col span={6}>
                                <Form.Item name="sbc_ton_sqm" label="SBC (kN/m²)">
                                    <Input type="number" placeholder="350" />
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
                                <Form.Item name="bottom_rl" label="Toe Level (RL)">
                                    <Input type="number" step="0.001" placeholder="Rock/Toe" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="reinforcement_ton" label="Steel Qty (Ton)">
                                    <Input type="number" step="0.001" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="overflow_pct" label="Overbreak (%)">
                                    <Input type="number" min={0} max={100} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider orientation="left" style={{ borderColor: '#52c41a' }}>📊 ERP Quantity Metrics</Divider>
                        <Row gutter={24} align="middle">
                            <Col span={12}>
                                <Statistic
                                    title="Calculated Concrete Vol (m³)"
                                    value={calculatedValues.concrete_volume}
                                    precision={3}
                                    valueStyle={{ color: '#096dd9' }}
                                    suffix="Cum"
                                />
                            </Col>
                            <Col span={12}>
                                <Form.Item name="concrete_design_qty" label="Estimated Billing Quantity (with Overbreak)">
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

export default EditPileModal
