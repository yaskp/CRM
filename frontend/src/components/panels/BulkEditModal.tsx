import { useState, useEffect } from 'react'
import { Modal, Form, Row, Col, Input, Select, Divider, Typography, Space, Tooltip, Button } from 'antd'
import { EditOutlined, InfoCircleOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import DWallDimensionDiagram from '../DWallDimensionDiagram'

const { Text } = Typography
const { Option } = Select

interface BulkEditModalProps {
    open: boolean
    onCancel: () => void
    onSubmit: (values: any) => void
    loading: boolean
    selectedCount: number
    initialValues?: any
}

const BulkEditModal = ({ open, onCancel, onSubmit, loading, selectedCount, initialValues }: BulkEditModalProps) => {
    const [form] = Form.useForm()
    const length = Form.useWatch('length', form)
    const width = Form.useWatch('width', form)
    const depth = Form.useWatch('depth', form)
    const [activeDim, setActiveDim] = useState<'L' | 'W' | 'D' | null>(null)

    useEffect(() => {
        if (open) {
            form.resetFields()
            setActiveDim(null)
            if (initialValues) {
                form.setFieldsValue(initialValues)
                // Also trigger calculation if L, W, D are all present
                if (initialValues.length && initialValues.width && initialValues.depth) {
                    onFormValuesChange({}, initialValues)
                }
            }
        }
    }, [open, initialValues, form])

    const onFormValuesChange = (changedValues: any, allValues: any) => {
        let D = Number(allValues.depth || 0)

        // Handle RL changes
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

        // Only calculate if all three dimensions are provided, since in bulk edit
        // missing dimensions mean "leave as-is" and we can't calculate a correct absolute volume
        if (allValues.length && allValues.width && allValues.depth) {
            const concrete = Number((L * W * D).toFixed(2))
            const grab = Number((L * D).toFixed(2))
            const stopEnd = Number((L * D).toFixed(2))
            const guideWall = Number(L.toFixed(2))
            const ramming = Number(D.toFixed(2))

            form.setFieldsValue({
                concrete_design_qty: concrete,
                grabbing_qty: grab,
                stop_end_area: stopEnd,
                guide_wall_rm: guideWall,
                ramming_qty: ramming
            })
        } else {
            // Clear them if any dimension is blank in bulk edit
            form.setFieldsValue({
                concrete_design_qty: '',
                grabbing_qty: '',
                stop_end_area: '',
                guide_wall_rm: '',
                ramming_qty: ''
            })
        }

        syncAnchorLayers(changedValues, allValues, form)
    }

    const handleCancel = () => {
        form.resetFields()
        setActiveDim(null)
        onCancel()
    }

    return (
        <Modal
            title={
                <Space>
                    <EditOutlined style={{ color: '#1677ff' }} />
                    <span>Bulk Edit {selectedCount} Panel{selectedCount > 1 ? 's' : ''}</span>
                </Space>
            }
            open={open}
            onOk={() => form.submit()}
            onCancel={handleCancel}
            confirmLoading={loading}
            width={860}
            afterClose={() => setActiveDim(null)}
            okText="Update Panels"
        >
            <div style={{ marginBottom: 16, background: '#fffbe6', padding: '10px 14px', borderRadius: '6px', border: '1px solid #ffe58f' }}>
                <Text><strong>Tip:</strong> Only fill the fields you want to change. Leave a field blank to keep the existing value on each panel.</Text>
            </div>

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
                onValuesChange={onFormValuesChange}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="panel_type" label="Panel Type (optional)">
                            <Select allowClear placeholder="Keep existing type">
                                <Option value="Primary">Primary (P)</Option>
                                <Option value="Secondary">Secondary (S)</Option>
                                <Option value="Closing">Closing (C)</Option>
                                <Option value="End">End (E)</Option>
                                <Option value="Corner">Corner</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="reinforcement_ton" label="Reinforcement in Cage(Ton)">
                            <Input type="number" step="0.01" placeholder="Leave blank to keep existing" />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left">
                    <Space>
                        Dimensions — fill all three to recalculate BOQ
                        <Tooltip title="Click a field to highlight it in the diagram">
                            <InfoCircleOutlined style={{ color: '#60a5fa', cursor: 'help' }} />
                        </Tooltip>
                    </Space>
                </Divider>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="length" label="Length (L)">
                            <Input type="number" step="0.01" placeholder="e.g. 2.8"
                                onFocus={() => setActiveDim('L')} onBlur={() => setActiveDim(null)} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="width" label="Width (W)">
                            <Input type="number" step="0.01" placeholder="e.g. 0.8"
                                onFocus={() => setActiveDim('W')} onBlur={() => setActiveDim(null)} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="depth" label="Depth (D) in Soil">
                            <Input type="number" step="0.1" placeholder="e.g. 22.0"
                                onFocus={() => setActiveDim('D')} onBlur={() => setActiveDim(null)} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="top_rl" label="Top RL">
                            <Input type="number" step="0.01" placeholder="Auto-fills Depth" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="bottom_rl" label="Bottom RL">
                            <Input type="number" step="0.01" />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left">Auto-Calculated Quantities (if L, W, D provided)</Divider>
                <Row gutter={16}>
                    <Col span={8}><Form.Item name="concrete_design_qty" label="Concrete (m³)"><Input readOnly style={{ background: '#f5f5f5' }} placeholder="Auto-calculated" /></Form.Item></Col>
                    <Col span={8}><Form.Item name="grabbing_qty" label="Grabbing (m²)"><Input readOnly style={{ background: '#f5f5f5' }} placeholder="Auto-calculated" /></Form.Item></Col>
                    <Col span={8}><Form.Item name="stop_end_area" label="Stop End (m²)"><Input readOnly style={{ background: '#f5f5f5' }} placeholder="Auto-calculated" /></Form.Item></Col>
                </Row>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={12}><Form.Item name="guide_wall_rm" label="Guide Wall (RM)"><Input readOnly style={{ background: '#f5f5f5' }} placeholder="Auto-calculated" /></Form.Item></Col>
                    <Col span={12}><Form.Item name="ramming_qty" label="Rubber Stop = D (RMT)"><Input readOnly style={{ background: '#f5f5f5' }} placeholder="Auto-calculated" /></Form.Item></Col>
                </Row>
                <Divider orientation="left">Anchors & Layers (Optional)</Divider>
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    If you add layers here, they will overwrite the anchor configuration for all selected panels.
                </Text>
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

export default BulkEditModal
