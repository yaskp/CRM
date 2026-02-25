import { useState, useEffect } from 'react'
import { Card, Button, Modal, Form, Input, Select, Space, Typography, message, Empty, Row, Col, Upload, Tabs, Table, Tag, Statistic, Divider, Progress } from 'antd'
import {
    PlusOutlined,
    FileImageOutlined,
    UploadOutlined,
    EyeOutlined,
    AppstoreOutlined
} from '@ant-design/icons'
import { drawingService } from '../../services/api/drawings'
import api from '../../services/api/auth'
import { theme } from '../../styles/theme'
import DrawingVisualizer from './DrawingVisualizer'

const { Text, Title } = Typography
const { Option } = Select

interface ProjectPanelsProps {
    projectId: number
}

const ProjectPanels = ({ projectId }: ProjectPanelsProps) => {
    const [drawings, setDrawings] = useState<any[]>([])
    const [selectedDrawing, setSelectedDrawing] = useState<any>(null)
    const [panels, setPanels] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [panelModalVisible, setPanelModalVisible] = useState(false)
    const [batchModalVisible, setBatchModalVisible] = useState(false)

    const [form] = Form.useForm()
    const [panelForm] = Form.useForm()
    const [batchForm] = Form.useForm()

    // Calculated fields state
    const [calculatedValues, setCalculatedValues] = useState({
        concrete_volume: 0,
        grabbing_qty: 0,
        stop_end_area: 0,
        guide_wall_rm: 0,
        ramming_qty: 0
    })

    const [fileList, setFileList] = useState<any[]>([])

    useEffect(() => {
        fetchDrawings()
    }, [projectId])

    useEffect(() => {
        if (selectedDrawing) {
            fetchPanels(selectedDrawing.id)
        }
    }, [selectedDrawing])

    const fetchDrawings = async () => {
        setLoading(true)
        try {
            const res = await drawingService.getDrawings({ project_id: projectId })
            setDrawings(res.drawings || [])
            if (res.drawings?.length > 0 && !selectedDrawing) {
                setSelectedDrawing(res.drawings[0])
            }
        } catch (error) {
            message.error('Failed to fetch drawings')
        } finally {
            setLoading(false)
        }
    }

    const fetchPanels = async (drawingId: number) => {
        setLoading(true)
        try {
            const res = await drawingService.getPanels(drawingId)
            setPanels(res.panels || [])
        } catch (error) {
            message.error('Failed to fetch panels')
        } finally {
            setLoading(false)
        }
    }

    const onFormValuesChange = (changedValues: any, allValues: any) => {
        let L = Number(allValues.length || 0)
        let W = Number(allValues.width || 0)
        let D = Number(allValues.depth || 0)

        // Auto-calculate Depth from RLs if RLs changed
        if (changedValues.top_rl || changedValues.bottom_rl) {
            const top = Number(allValues.top_rl)
            const bottom = Number(allValues.bottom_rl)
            if (!isNaN(top) && !isNaN(bottom)) {
                D = Number((top - bottom).toFixed(2))
                panelForm.setFieldsValue({ depth: D })
            }
        }

        // Use updated D for calculations
        const concrete = Number((L * W * D).toFixed(2))
        const grab = Number((L * D).toFixed(2))
        const stopEnd = Number((L * D).toFixed(2))
        const guideWall = Number(L.toFixed(2))
        const ramming = Number((L * W).toFixed(2))

        panelForm.setFieldsValue({
            concrete_design_qty: concrete,
            grabbing_qty: grab,
            stop_end_area: stopEnd,
            guide_wall_rm: guideWall,
            ramming_qty: ramming
        })

        setCalculatedValues({
            concrete_volume: concrete,
            grabbing_qty: grab,
            stop_end_area: stopEnd,
            guide_wall_rm: guideWall,
            ramming_qty: ramming
        })
    }

    const handleAddPanel = async (values: any) => {
        setLoading(true)
        try {
            let drawingId = selectedDrawing?.id;
            // Ensure drawing exists logic can be added here if needed, but UI enforces selection

            const L = Number(values.length)
            const W = Number(values.width)
            const D = Number(values.depth)

            const payload = {
                panel_identifier: values.panel_identifier,
                panel_type: values.panel_type,
                length: L,
                width: W,
                design_depth: D,
                top_rl: Number(values.top_rl),
                bottom_rl: Number(values.bottom_rl),
                reinforcement_ton: Number(values.reinforcement_ton),
                no_of_anchors: Number(values.no_of_anchors),
                anchor_length: Number(values.anchor_length),
                anchor_capacity: Number(values.anchor_capacity),
                concrete_design_qty: Number((L * W * D).toFixed(2)),
                grabbing_qty: Number((L * D).toFixed(2)),
                stop_end_area: Number((L * D).toFixed(2)),
                guide_wall_rm: Number(L.toFixed(2)),
                ramming_qty: Number((L * W).toFixed(2))
            }

            await drawingService.markPanel(drawingId, payload)
            message.success('Panel details added')
            setPanelModalVisible(false)
            panelForm.resetFields()
            setCalculatedValues({
                concrete_volume: 0,
                grabbing_qty: 0,
                stop_end_area: 0,
                guide_wall_rm: 0,
                ramming_qty: 0
            })
            fetchPanels(drawingId)
        } catch (error) {
            message.error('Failed to add panel')
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateBatch = async (values: any) => {
        setLoading(true)
        try {
            let drawingId = selectedDrawing?.id;

            const { prefix, start_no, end_no, panel_type, length, width, depth, top_rl, bottom_rl, reinforcement_ton, no_of_anchors, anchor_length, anchor_capacity } = values
            const panelsToCreate = []

            const L = Number(length)
            const W = Number(width)
            const D = Number(depth)
            const concrete = Number((L * W * D).toFixed(2))
            const grab = Number((L * D).toFixed(2))
            const stopEnd = Number((L * D).toFixed(2))
            const guideWall = Number(L.toFixed(2))
            const ramming = Number((L * W).toFixed(2))

            for (let i = start_no; i <= end_no; i++) {
                panelsToCreate.push({
                    panel_identifier: `${prefix}${i}`,
                    panel_type,
                    length: L,
                    width: W,
                    depth: D,
                    top_rl: Number(top_rl),
                    bottom_rl: Number(bottom_rl),
                    reinforcement_ton: Number(reinforcement_ton),
                    no_of_anchors: Number(no_of_anchors),
                    anchor_length: Number(anchor_length),
                    anchor_capacity: Number(anchor_capacity),
                    concrete_design_qty: concrete,
                    grabbing_qty: grab,
                    stop_end_area: stopEnd,
                    guide_wall_rm: guideWall,
                    ramming_qty: ramming,
                    dimensions: { length: L, width: W, depth: D }
                })
            }

            await drawingService.bulkCreatePanels(drawingId, panelsToCreate)
            message.success(`Successfully generated ${panelsToCreate.length} panels`)
            setBatchModalVisible(false)
            batchForm.resetFields()
            fetchPanels(drawingId)
        } catch (error) {
            message.error('Failed to generate sequence')
        } finally {
            setLoading(false)
        }
    }

    const ensureDrawing = async () => {
        if (selectedDrawing) return selectedDrawing.id;

        // If no selected drawing but there are drawings, pick the first one
        if (drawings.length > 0) {
            setSelectedDrawing(drawings[0]);
            return drawings[0].id;
        }

        // Auto-create a default drawing
        setLoading(true);
        try {
            const res = await api.post('/drawings', {
                project_id: projectId,
                drawing_name: 'Panel Schedule / D-Wall Layout',
                drawing_type: 'D-Wall Layout',
                is_active: true
            });
            const newDrawing = res.data.drawing;
            setDrawings([newDrawing]);
            setSelectedDrawing(newDrawing);
            return newDrawing.id;
        } catch (error) {
            message.error('Failed to create default drawing');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPanelModal = async () => {
        const drawingId = await ensureDrawing();
        if (drawingId) setPanelModalVisible(true);
    };

    const handleOpenBatchModal = async () => {
        const drawingId = await ensureDrawing();
        if (drawingId) setBatchModalVisible(true);
    };

    const handleUpload = async (values: any) => {
        if (fileList.length === 0) {
            message.error('Please select a file to upload')
            return
        }

        setLoading(true)
        try {
            await drawingService.uploadDrawing(
                {
                    project_id: projectId,
                    drawing_name: values.drawing_name,
                    drawing_number: values.drawing_number,
                    drawing_type: values.drawing_type || 'D-Wall Layout'
                },
                fileList[0] as any
            )
            message.success('Drawing uploaded successfully')
            setModalVisible(false)
            setFileList([])
            form.resetFields()
            fetchDrawings()
        } catch (error) {
            message.error('Failed to upload drawing')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} lg={6}>
                <Card
                    title={<Space><FileImageOutlined /> Drawings</Space>}
                    extra={<Button type="text" icon={<PlusOutlined />} onClick={() => setModalVisible(true)} />}
                    bodyStyle={{ padding: 0 }}
                >
                    {drawings.length > 0 ? (
                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {drawings.map(d => (
                                <div
                                    key={d.id}
                                    onClick={() => setSelectedDrawing(d)}
                                    style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        borderBottom: `1px solid ${theme.colors.neutral.gray100}`,
                                        background: selectedDrawing?.id === d.id ? theme.colors.primary.light + '10' : 'transparent',
                                        borderLeft: selectedDrawing?.id === d.id ? `4px solid ${theme.colors.primary.main}` : 'none'
                                    }}
                                >
                                    <Text strong style={{ display: 'block' }}>{d.drawing_name}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>{d.drawing_number} • {d.drawing_type}</Text>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Empty description="No drawings uploaded" style={{ padding: '24px' }} />
                    )}
                </Card>
            </Col>

            <Col xs={24} lg={18}>
                <Card
                    title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                                <AppstoreOutlined style={{ color: theme.colors.primary.main }} />
                                <Title level={4} style={{ margin: 0 }}>
                                    {selectedDrawing ? `Panel Progress: ${selectedDrawing.drawing_name}` : 'Panel Progress Board'}
                                </Title>
                            </Space>
                            <Space>
                                <Button onClick={handleOpenBatchModal}>Batch</Button>
                                <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenPanelModal}>Add Panel</Button>
                                {selectedDrawing?.file_url && (
                                    <Button
                                        icon={<EyeOutlined />}
                                        href={`http://localhost:5000${selectedDrawing.file_url}`}
                                        target="_blank"
                                    >
                                        View Map
                                    </Button>
                                )}
                            </Space>
                        </div>
                    }
                >
                    <Tabs defaultActiveKey="1" items={[
                        {
                            key: '1',
                            label: 'Visual Board',
                            children: (
                                <>

                                    {!selectedDrawing ? (
                                        <Empty
                                            description="Select a drawing to view status or start by adding a panel"
                                            style={{ padding: '60px' }}
                                        >
                                            <Space>
                                                <Button onClick={handleOpenBatchModal}>Batch Generate</Button>
                                                <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenPanelModal}>Add First Panel</Button>
                                            </Space>
                                        </Empty>
                                    ) : (
                                        <DrawingVisualizer panels={panels} loading={loading} />
                                    )}
                                </>
                            )
                        },
                        {
                            key: '2',
                            label: 'List View',
                            children: (
                                <>
                                    {!selectedDrawing ? (
                                        <Empty
                                            description="Select a drawing to view status or start by adding a panel"
                                            style={{ padding: '60px' }}
                                        >
                                            <Space>
                                                <Button onClick={handleOpenBatchModal}>Batch Generate</Button>
                                                <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenPanelModal}>Add First Panel</Button>
                                            </Space>
                                        </Empty>
                                    ) : (
                                        <Table
                                            dataSource={panels}
                                            rowKey="id"
                                            pagination={{
                                                pageSize: 20,
                                                showSizeChanger: true,
                                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} panels`
                                            }}
                                            columns={[
                                                {
                                                    title: 'Panel',
                                                    dataIndex: 'panel_identifier',
                                                    key: 'panel_identifier',
                                                    width: 100,
                                                    fixed: 'left',
                                                    render: (text) => <Text strong>{text}</Text>
                                                },
                                                {
                                                    title: 'Type',
                                                    dataIndex: 'panel_type',
                                                    key: 'panel_type',
                                                    width: 100,
                                                },
                                                {
                                                    title: 'Dimensions',
                                                    children: [
                                                        { title: 'L (m)', dataIndex: 'length', key: 'length', width: 80, render: (v: any) => Number(v).toFixed(2) },
                                                        { title: 'W (m)', dataIndex: 'width', key: 'width', width: 80, render: (v: any) => Number(v).toFixed(2) },
                                                        { title: 'D (m)', dataIndex: 'design_depth', key: 'design_depth', width: 80, render: (v: any) => Number(v).toFixed(1) },
                                                    ]
                                                },
                                                {
                                                    title: 'Area (m²)',
                                                    key: 'area',
                                                    width: 100,
                                                    render: (_, record: any) => {
                                                        const area = (Number(record.length) * Number(record.design_depth || 0)).toFixed(2)
                                                        return <Text>{area}</Text>
                                                    }
                                                },
                                                {
                                                    title: 'Progress (DPR)',
                                                    key: 'progress',
                                                    width: 200,
                                                    render: (_, record) => {
                                                        const dprs = record.dprRecords || []
                                                        const consumptions = record.consumptions || []
                                                        const allLogs = [...consumptions, ...dprs]

                                                        let percent = 0
                                                        let status = 'active'

                                                        // Calc Logic
                                                        const hasConcrete = consumptions.some((c: any) => (c.rmcLogs && c.rmcLogs.length > 0)) || allLogs.some((d: any) => Number(d.concrete_quantity_cubic_meter) > 0)
                                                        const hasRebar = allLogs.some((l: any) => l.cage_id_ref)
                                                        const maxDepth = Math.max(0, ...allLogs.map((l: any) => Number(l.actual_depth || 0)))
                                                        const designDepth = Number(record.design_depth || 1)

                                                        if (hasConcrete) {
                                                            percent = 100
                                                            status = 'success'
                                                        } else if (hasRebar) {
                                                            percent = 90
                                                        } else if (maxDepth > 0) {
                                                            const ratio = Math.min((maxDepth / designDepth), 1)
                                                            percent = Math.round(ratio * 80)
                                                        }

                                                        return <Progress percent={percent} size="small" status={status as any} />
                                                    }
                                                },
                                                {
                                                    title: 'Status',
                                                    key: 'status',
                                                    width: 120,
                                                    render: (_, record) => {
                                                        const dprs = record.dprRecords || []
                                                        const consumptions = record.consumptions || []
                                                        const allLogs = [...consumptions, ...dprs]

                                                        const qcIssues: string[] = []
                                                        allLogs.forEach((log: any) => {
                                                            if (Number(log.verticality_x) > 0.5) qcIssues.push(`Vx`)
                                                            if (Number(log.verticality_y) > 0.5) qcIssues.push(`Vy`)
                                                        })
                                                        if (qcIssues.length > 0) return <Tag color="red">QC: {qcIssues.join(',')}</Tag>

                                                        const hasConcrete = consumptions.some((c: any) => (c.rmcLogs && c.rmcLogs.length > 0)) || allLogs.some((d: any) => Number(d.concrete_quantity_cubic_meter) > 0)
                                                        if (hasConcrete) return <Tag color="green">Done</Tag>

                                                        const hasRebar = allLogs.some((l: any) => l.cage_id_ref)
                                                        if (hasRebar) return <Tag color="blue">Rebar</Tag>

                                                        const hasExcavation = allLogs.some((l: any) => Number(l.actual_depth) > 0)
                                                        if (hasExcavation) return <Tag color="gold">Digging</Tag>

                                                        return <Tag>Planned</Tag>
                                                    }
                                                },
                                                {
                                                    title: 'Excavated Depth',
                                                    key: 'depth_current',
                                                    width: 120,
                                                    render: (_, record) => {
                                                        const allLogs = [...(record.dprRecords || []), ...(record.consumptions || [])]
                                                        const maxDepth = Math.max(0, ...allLogs.map((l: any) => Number(l.actual_depth || 0)))
                                                        return maxDepth > 0 ? <Text strong>{maxDepth.toFixed(2)}m</Text> : '-'
                                                    }
                                                }
                                            ]}
                                        />
                                    )}
                                </>
                            )
                        }
                    ]} />
                </Card>
            </Col>

            {/* Upload Drawing Modal */}
            <Modal
                title="Upload New Layout/Shop Drawing"
                open={modalVisible}
                onOk={() => form.submit()}
                onCancel={() => setModalVisible(false)}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical" onFinish={handleUpload}>
                    <Form.Item name="drawing_name" label="Drawing Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. D-Wall Layout Plan" />
                    </Form.Item>
                    <Form.Item name="drawing_number" label="Drawing Number">
                        <Input placeholder="e.g. VH/PRJ/DW-01" />
                    </Form.Item>
                    <Form.Item name="drawing_type" label="Drawing Type" initialValue="D-Wall Layout">
                        <Select>
                            <Option value="D-Wall Layout">D-Wall Layout</Option>
                            <Option value="Shop Drawing">Shop Drawing</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="Select Drawing File (PDF/Image/DWG)">
                        <Upload
                            beforeUpload={(file) => {
                                setFileList([file])
                                return false
                            }}
                            fileList={fileList}
                            onRemove={() => setFileList([])}
                            maxCount={1}
                        >
                            <Button icon={<UploadOutlined />}>Select File</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Add Panel Modal */}
            <Modal
                title="Add Panel Properties"
                open={panelModalVisible}
                onOk={() => panelForm.submit()}
                onCancel={() => setPanelModalVisible(false)}
                confirmLoading={loading}
                width={800}
            >
                <Form
                    form={panelForm}
                    layout="vertical"
                    onFinish={handleAddPanel}
                    onValuesChange={onFormValuesChange}
                >
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
                                <Input type="number" step="0.01" placeholder="e.g. 2.8" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="width" label="Width (W)" rules={[{ required: true }]}>
                                <Input type="number" step="0.01" placeholder="e.g. 0.8" suffix="m" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="depth" label="Depth (D)" rules={[{ required: true }]}>
                                <Input type="number" step="0.1" placeholder="e.g. 22.0" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="top_rl" label="Top RL">
                                <Input type="number" step="0.01" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="bottom_rl" label="Bottom RL">
                                <Input type="number" step="0.01" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">Auto-Calculated Quantities</Divider>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="concrete_design_qty" label="Concrete (m³)">
                                <Input readOnly style={{ background: '#f5f5f5' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="grabbing_qty" label="Grabbing (m²)">
                                <Input readOnly style={{ background: '#f5f5f5' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="stop_end_area" label="Stop End (m²)">
                                <Input readOnly style={{ background: '#f5f5f5' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16} style={{ marginBottom: '24px' }}>
                        <Col span={12}>
                            <Form.Item name="guide_wall_rm" label="Guide Wall (RM)">
                                <Input readOnly style={{ background: '#f5f5f5' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="ramming_qty" label="Ramming (m²)">
                                <Input readOnly style={{ background: '#f5f5f5' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">Reinforcement & Anchors</Divider>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="reinforcement_ton" label="Reinforcement in Cage (Ton)">
                                <Input type="number" step="0.01" placeholder="e.g. 5.9" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="no_of_anchors" label="No. of Anchors">
                                <Input type="number" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="anchor_length" label="Anchor Length (m)">
                                <Input type="number" step="0.01" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="anchor_capacity" label="Anchor Capacity (kN)">
                                <Input type="number" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <Modal
                title="Batch Generate Panels"
                open={batchModalVisible}
                onOk={() => batchForm.submit()}
                onCancel={() => setBatchModalVisible(false)}
                confirmLoading={loading}
                width={800}
            >
                <Form
                    form={batchForm}
                    layout="vertical"
                    onFinish={handleGenerateBatch}
                    initialValues={{ prefix: 'P', start_no: 1, panel_type: 'Primary' }}
                    onValuesChange={(changedValues, allValues) => {
                        if (changedValues.top_rl !== undefined || changedValues.bottom_rl !== undefined) {
                            const top = Number(allValues.top_rl)
                            const bottom = Number(allValues.bottom_rl)
                            if (!isNaN(top) && !isNaN(bottom) && top !== 0 && bottom !== 0) {
                                batchForm.setFieldsValue({ depth: Number((top - bottom).toFixed(2)) })
                            }
                        }
                    }}
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

                    <Divider orientation="left">Common Dimensions</Divider>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="length" label="Length (L)" rules={[{ required: true }]}>
                                <Input type="number" step="0.01" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="width" label="Width (W)" rules={[{ required: true }]}>
                                <Input type="number" step="0.01" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="depth" label="Depth (D)" rules={[{ required: true }]}>
                                <Input type="number" step="0.1" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="top_rl" label="Top RL">
                                <Input type="number" step="0.01" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="bottom_rl" label="Bottom RL">
                                <Input type="number" step="0.01" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">Common Construction Details</Divider>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="reinforcement_ton" label="Reinf. (Ton)">
                                <Input type="number" step="0.01" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="no_of_anchors" label="No. of Anchors">
                                <Input type="number" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="anchor_length" label="Anchor Length (m)">
                                <Input type="number" step="0.01" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="anchor_capacity" label="Anchor Capacity (kN)">
                                <Input type="number" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </Row>
    )
}

export default ProjectPanels
