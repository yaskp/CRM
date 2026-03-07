import { useState, useEffect } from 'react'
import { Modal, Form, Row, Col, Input, Select, Divider, Typography, Space, Tooltip, Button } from 'antd'
import { InfoCircleOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import DWallDimensionDiagram from '../DWallDimensionDiagram'

const { Text } = Typography
const { Option } = Select

interface BatchPanelModalProps {
    open: boolean
    onCancel: () => void
    onSubmit: (values: any) => void
    loading: boolean
}

const BatchPanelModal = ({ open, onCancel, onSubmit, loading }: BatchPanelModalProps) => {
    const [form] = Form.useForm()
    const length = Form.useWatch('length', form)
    const width = Form.useWatch('width', form)
    const depth = Form.useWatch('depth', form)
    const [activeDim, setActiveDim] = useState<'L' | 'W' | 'D' | null>(null)

    useEffect(() => {
        if (open) {
            form.resetFields()
            setActiveDim(null)
        }
    }, [open, form])

    const onFormValuesChange = (changedValues: any, allValues: any) => {
        let D = Number(allValues.depth || 0)
        if (changedValues.top_rl !== undefined || changedValues.bottom_rl !== undefined) {
            const top = Number(allValues.top_rl)
            const bottom = Number(allValues.bottom_rl)
            if (!isNaN(top) && !isNaN(bottom) && top !== 0 && bottom !== 0) {
                D = Number((top - bottom).toFixed(2))
                form.setFieldsValue({ depth: D })
            }
        }

        const L = Number(allValues.length || 0)
        const W = Number(allValues.width || 0)

        form.setFieldsValue({
            concrete_design_qty: Number((L * W * D).toFixed(2)),
            grabbing_qty: Number((L * D).toFixed(2)),
            stop_end_area: Number((L * D).toFixed(2)),
            guide_wall_rm: Number(L.toFixed(2)),
            ramming_qty: Number(D.toFixed(2))
        })

        syncAnchorLayers(changedValues, allValues, form)
    }

    const handleCancel = () => {
        form.resetFields()
        setActiveDim(null)
        onCancel()
    }

    return (
        <Modal
            title="Batch Generate Panels"
            open={open}
            onOk={() => form.submit()}
            onCancel={handleCancel}
            confirmLoading={loading}
            width={860}
            afterClose={() => setActiveDim(null)}
        >
            {/* 3D reference diagram */}
            <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
                border: '1.5px solid #bfdbfe',
                borderRadius: 10,
                padding: '22px 8px 4px',
                marginBottom: 16,
                position: 'relative'
            }}>
                <div style={{
                    position: 'absolute', top: 8, left: 12,
                    fontSize: 10, fontWeight: 600, color: '#3b82f6',
                    letterSpacing: '0.06em', textTransform: 'uppercase'
                }}>
                    3D Reference – D-Wall Panel
                </div>
                <DWallDimensionDiagram
                    highlight={activeDim}
                    L={length}
                    W={width}
                    D={depth}
                />
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={onSubmit}
                initialValues={{ prefix: 'P', start_no: 1, panel_type: 'Primary' }}
                onValuesChange={onFormValuesChange}
            >
                <div style={{ marginBottom: 16, background: '#e6f7ff', padding: '12px', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                    <Text strong>Global Settings:</Text> <Text>These dimensions and details will be applied to ALL generated panels in this sequence.</Text>
                </div>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="prefix" label="Prefix" tooltip="e.g. 'P' -> P1, P2...">
                            <Input maxLength={5} placeholder="P" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="start_no" label="Start" rules={[{ required: true }]}>
                            <Input type="number" min={1} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="end_no" label="End" rules={[{ required: true }]}>
                            <Input type="number" min={1} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="panel_type" label="Panel Type">
                            <Select>
                                <Option value="Primary">Primary (P)</Option>
                                <Option value="Secondary">Secondary (S)</Option>
                                <Option value="Closing">Closing (C)</Option>
                                <Option value="End">End (E)</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left">
                    <Space>
                        Common Dimensions
                        <Tooltip title="Click a field to highlight it in the diagram">
                            <InfoCircleOutlined style={{ color: '#60a5fa', cursor: 'help' }} />
                        </Tooltip>
                    </Space>
                </Divider>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="length" label="Length (L)" rules={[{ required: true }]}>
                            <Input type="number" step="0.01"
                                onFocus={() => setActiveDim('L')} onBlur={() => setActiveDim(null)} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="width" label="Width (W)" rules={[{ required: true }]}>
                            <Input type="number" step="0.01"
                                onFocus={() => setActiveDim('W')} onBlur={() => setActiveDim(null)} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="depth" label="Depth (D) in Soil" rules={[{ required: true }]}>
                            <Input type="number" step="0.1"
                                onFocus={() => setActiveDim('D')} onBlur={() => setActiveDim(null)} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="top_rl" label="Top RL">
                            <Input type="number" step="0.01" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="bottom_rl" label="Bottom RL">
                            <Input type="number" step="0.01" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="reinforcement_ton" label="Reinforcement in Cage (Ton)">
                            <Input type="number" step="0.01" />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left">Auto-Calculated Quantities</Divider>
                <Row gutter={16}>
                    <Col span={8}><Form.Item name="concrete_design_qty" label="Concrete (m³)"><Input readOnly style={{ background: '#f5f5f5' }} /></Form.Item></Col>
                    <Col span={8}><Form.Item name="grabbing_qty" label="Grabbing (m²)"><Input readOnly style={{ background: '#f5f5f5' }} /></Form.Item></Col>
                    <Col span={8}><Form.Item name="stop_end_area" label="Stop End (m²)"><Input readOnly style={{ background: '#f5f5f5' }} /></Form.Item></Col>
                </Row>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={12}><Form.Item name="guide_wall_rm" label="Guide Wall (RM)"><Input readOnly style={{ background: '#f5f5f5' }} /></Form.Item></Col>
                    <Col span={12}><Form.Item name="ramming_qty" label="Rubber Stop = D (RMT)"><Input readOnly style={{ background: '#f5f5f5' }} /></Form.Item></Col>
                </Row>

                <Divider orientation="left">Anchors & Layers</Divider>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="no_of_layers" label="No of Anchor Layers">
                            <Input type="number" min={0} max={10} placeholder="Sets no. of layers below" />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.List name="anchors">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }, index) => (
                                <div key={key} style={{
                                    background: '#fafafa',
                                    padding: '16px 16px 0',
                                    borderRadius: 8,
                                    marginBottom: 16,
                                    border: '1px dashed #d9d9d9',
                                    position: 'relative'
                                }}>
                                    <div style={{ marginBottom: 8, fontWeight: 600, color: '#1890ff' }}>
                                        Layer {index + 1}
                                    </div>
                                    <Row gutter={16}>
                                        <Col span={7}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'no_of_anchors']}
                                                label="No of Anchors"
                                                rules={[{ required: true, message: 'Missing' }]}
                                            >
                                                <Input type="number" placeholder="e.g. 2" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={7}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'anchor_length']}
                                                label="Length (m)"
                                                rules={[{ required: true, message: 'Missing' }]}
                                            >
                                                <Input type="number" step="0.1" placeholder="e.g. 15.5" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={7}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'anchor_capacity']}
                                                label="Capacity (kN) (Optional)"
                                            >
                                                <Input type="number" placeholder="e.g. 450" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={3}>
                                            <Button
                                                type="text"
                                                danger
                                                onClick={() => remove(name)}
                                                style={{ marginTop: 32 }}
                                            >
                                                <DeleteOutlined />
                                            </Button>
                                        </Col>
                                    </Row>
                                </div>
                            ))}
                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Add Anchor Layer Configuration
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Form>
        </Modal>
    )
}

// Helper to handle anchor layer synchronization
const syncAnchorLayers = (changedValues: any, allValues: any, form: any) => {
    if (changedValues.no_of_layers !== undefined) {
        const num = Number(changedValues.no_of_layers)
        if (!isNaN(num) && num >= 0) {
            const currentAnchors = allValues.anchors || []
            let newAnchors = [...currentAnchors]
            if (num > currentAnchors.length) {
                for (let i = currentAnchors.length; i < num; i++) {
                    newAnchors.push({})
                }
            } else {
                newAnchors = newAnchors.slice(0, num)
            }
            form.setFieldsValue({ anchors: newAnchors })
        }
    } else if (changedValues.anchors !== undefined) {
        // Update count field if layers added/removed via buttons
        form.setFieldsValue({ no_of_layers: allValues.anchors?.length || 0 })
    }
}

export default BatchPanelModal
