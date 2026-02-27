import { useState, useEffect } from 'react'
import { Modal, Form, Row, Col, Input, Select, Statistic, Divider, Button } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import DWallDimensionDiagram from '../DWallDimensionDiagram'

const { Option } = Select

interface AddPanelModalProps {
    open: boolean
    onCancel: () => void
    onSubmit: (values: any) => void
    loading: boolean
}

const AddPanelModal = ({ open, onCancel, onSubmit, loading }: AddPanelModalProps) => {
    const [form] = Form.useForm()
    const [activeDim, setActiveDim] = useState<'L' | 'W' | 'D' | null>(null)
    const [calculatedValues, setCalculatedValues] = useState({
        concrete_volume: 0,
        grabbing_qty: 0,
        stop_end_area: 0,
        guide_wall_rm: 0,
        ramming_qty: 0
    })

    useEffect(() => {
        if (open) {
            form.resetFields()
            setActiveDim(null)
            setCalculatedValues({
                concrete_volume: 0,
                grabbing_qty: 0,
                stop_end_area: 0,
                guide_wall_rm: 0,
                ramming_qty: 0
            })
            form.setFieldsValue({ no_of_layers: 0, anchors: [] })
        }
    }, [open, form])

    const onFormValuesChange = (changedValues: any, allValues: any) => {
        let L = Number(allValues.length || 0)
        let W = Number(allValues.width || 0)
        let D = Number(allValues.depth || 0)

        if (changedValues.top_rl !== undefined || changedValues.bottom_rl !== undefined) {
            const top = Number(allValues.top_rl)
            const bottom = Number(allValues.bottom_rl)
            if (!isNaN(top) && !isNaN(bottom) && top !== 0 && bottom !== 0) {
                D = Number((top - bottom).toFixed(2))
                form.setFieldsValue({ depth: D })
            }
        }

        const concrete = Number((L * W * D).toFixed(2))
        const grab = Number((L * D).toFixed(2))
        const stopEnd = Number((L * D).toFixed(2))
        const guideWall = Number(L.toFixed(2))
        const ramming = Number((L * W).toFixed(2))

        form.setFieldsValue({
            concrete_design_qty: concrete,
            grabbing_qty: grab,
            stop_end_area: stopEnd,
            guide_wall_rm: guideWall,
            ramming_qty: ramming
        })

        syncAnchorLayers(changedValues, allValues, form)

        setCalculatedValues({
            concrete_volume: concrete,
            grabbing_qty: grab,
            stop_end_area: stopEnd,
            guide_wall_rm: guideWall,
            ramming_qty: ramming
        })
    }

    const handleCancel = () => {
        form.resetFields()
        setActiveDim(null)
        setCalculatedValues({
            concrete_volume: 0,
            grabbing_qty: 0,
            stop_end_area: 0,
            guide_wall_rm: 0,
            ramming_qty: 0
        })
        onCancel()
    }

    const handleFinish = (values: any) => {
        // We include the calculated volumes that may not be directly tied to normal Form.Item outputs
        onSubmit({
            ...values,
            concrete_design_qty: calculatedValues.concrete_volume,
            grabbing_qty: calculatedValues.grabbing_qty,
            stop_end_area: calculatedValues.stop_end_area,
            guide_wall_rm: calculatedValues.guide_wall_rm,
            ramming_qty: calculatedValues.ramming_qty
        })
    }

    return (
        <Modal
            title="Add Panel Properties"
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
                <DWallDimensionDiagram highlight={activeDim} />
            </div>

            <Form form={form} layout="vertical" onFinish={handleFinish} onValuesChange={onFormValuesChange}>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="panel_identifier" label="Panel ID" rules={[{ required: true }]}>
                            <Input placeholder="e.g. P1" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="panel_type" label="Panel Type" initialValue="Primary">
                            <Select>
                                <Option value="Primary">Primary (P)</Option>
                                <Option value="Secondary">Secondary (S)</Option>
                                <Option value="Closing">Closing (C)</Option>
                                <Option value="End">End (E)</Option>
                                <Option value="Corner">Corner</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="Concrete Vol (m³)"
                            value={calculatedValues.concrete_volume}
                            precision={2}
                            valueStyle={{ color: '#3f8600', fontSize: 16 }}
                        />
                    </Col>
                </Row>

                <Divider orientation="left">Basic Dimensions (IN METERS)</Divider>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="length" label="Length (L)" rules={[{ required: true }]}>
                            <Input type="number" step="0.01" placeholder="e.g. 2.8"
                                onFocus={() => setActiveDim('L')} onBlur={() => setActiveDim(null)} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="width" label="Width (W)" rules={[{ required: true }]}>
                            <Input type="number" step="0.01" placeholder="e.g. 0.8"
                                onFocus={() => setActiveDim('W')} onBlur={() => setActiveDim(null)} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="depth" label="Depth (D)" rules={[{ required: true }]}>
                            <Input type="number" step="0.1" placeholder="e.g. 22.0"
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
                        <Form.Item name="reinforcement_ton" label="Reinforcement (Ton)">
                            <Input type="number" step="0.01" placeholder="e.g. 5.9" />
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
                    <Col span={12}><Form.Item name="ramming_qty" label="Ramming (m²)"><Input readOnly style={{ background: '#f5f5f5' }} /></Form.Item></Col>
                </Row>

                <Divider orientation="left">Anchors & Layers</Divider>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="no_of_layers" label="No of Anchor Layers">
                            <Input type="number" min={0} max={10} placeholder="Sets no. of layers below" />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.List name="anchors" initialValue={[]}>
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
                                            {fields.length > 1 && (
                                                <Button
                                                    type="text"
                                                    danger
                                                    onClick={() => remove(name)}
                                                    style={{ marginTop: 32 }}
                                                >
                                                    <DeleteOutlined />
                                                </Button>
                                            )}
                                        </Col>
                                    </Row>
                                </div>
                            ))}
                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Add Anchor Layer
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

export default AddPanelModal
