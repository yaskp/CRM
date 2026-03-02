import { useState, useEffect } from 'react'
import { Card, Button, Modal, Form, Input, Space, Typography, message, Empty, Row, Col, Upload, Table, Progress, Tag, Popconfirm, Statistic } from 'antd'
import {
    PlusOutlined,
    FileImageOutlined,
    UploadOutlined,
    AppstoreOutlined,
    EditOutlined,
} from '@ant-design/icons'
import { drawingService } from '../../services/api/drawings'
import api from '../../services/api/auth'
import { theme } from '../../styles/theme'
import { AddPileModal, BatchPileModal, EditPileModal } from '../../components/piles'

const { Text, Title } = Typography

interface ProjectPilesProps {
    projectId: number
}

const ProjectPiles = ({ projectId }: ProjectPilesProps) => {

    const [drawings, setDrawings] = useState<any[]>([])
    const [selectedDrawing, setSelectedDrawing] = useState<any>(null)
    const [piles, setPiles] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [pileModalVisible, setPileModalVisible] = useState(false)
    const [batchModalVisible, setBatchModalVisible] = useState(false)
    const [editModalVisible, setEditModalVisible] = useState(false)
    const [editingPile, setEditingPile] = useState<any>(null)

    const [form] = Form.useForm()
    const [fileList, setFileList] = useState<any[]>([])

    useEffect(() => {
        fetchDrawings()
    }, [projectId])

    useEffect(() => {
        if (selectedDrawing) {
            fetchPiles(selectedDrawing.id)
        }
    }, [selectedDrawing])

    const fetchDrawings = async () => {
        setLoading(true)
        try {
            const res = await drawingService.getDrawings({ project_id: projectId, drawing_type: 'Pile Layout' })
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

    const fetchPiles = async (drawingId: number) => {
        setLoading(true)
        try {
            const res = await drawingService.getPanels(drawingId)
            setPiles(res.panels || [])
        } catch (error) {
            message.error('Failed to fetch piles')
        } finally {
            setLoading(false)
        }
    }

    const handleAddPile = async (values: any) => {
        setLoading(true)
        try {
            let drawingId = selectedDrawing?.id;
            // Map pile fields to panel fields for backend compatibility
            const data = {
                ...values,
                length: values.diameter, // Use length field for diameter
                width: 0,
                design_depth: values.design_depth,
                coordinates_json: JSON.stringify({
                    concrete_grade: values.concrete_grade,
                    rock_socket_depth: values.rock_socket_depth,
                    sbc_ton_sqm: values.sbc_ton_sqm,
                    overflow_pct: values.overflow_pct
                })
            }
            await drawingService.markPanel(drawingId, data)
            message.success('Pile details added')
            setPileModalVisible(false)
            fetchPiles(drawingId)
        } catch (error) {
            message.error('Failed to add pile')
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateBatch = async (values: any) => {
        setLoading(true)
        try {
            let drawingId = selectedDrawing?.id;
            const { prefix, start_no, end_no, pile_type, diameter, design_depth, concrete_grade, rock_socket_depth, sbc_ton_sqm, overflow_pct } = values
            const pilesToCreate = []

            for (let i = Number(start_no); i <= Number(end_no); i++) {
                pilesToCreate.push({
                    panel_identifier: `${prefix}${i}`,
                    panel_type: pile_type,
                    length: diameter,
                    width: 0,
                    design_depth: design_depth,
                    top_rl: values.top_rl,
                    bottom_rl: values.bottom_rl,
                    reinforcement_ton: values.reinforcement_ton,
                    concrete_design_qty: values.concrete_design_qty,
                    coordinates_json: JSON.stringify({
                        concrete_grade,
                        rock_socket_depth,
                        sbc_ton_sqm,
                        overflow_pct
                    })
                })
            }

            await drawingService.bulkCreatePanels(drawingId, pilesToCreate)
            message.success(`Successfully generated ${pilesToCreate.length} piles`)
            setBatchModalVisible(false)
            fetchPiles(drawingId)
        } catch (error) {
            message.error('Failed to generate sequence')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenEdit = (pile: any) => {
        const extra = typeof pile.coordinates_json === 'string' ? JSON.parse(pile.coordinates_json) : (pile.coordinates_json || {})
        setEditingPile({
            ...pile,
            diameter: pile.length,
            ...extra
        })
        setEditModalVisible(true)
    }

    const handleUpdatePile = async (values: any) => {
        if (!editingPile) return
        setLoading(true)
        try {
            const data = {
                ...values,
                length: values.diameter,
                design_depth: values.design_depth,
                coordinates_json: JSON.stringify({
                    concrete_grade: values.concrete_grade,
                    rock_socket_depth: values.rock_socket_depth,
                    sbc_ton_sqm: values.sbc_ton_sqm,
                    overflow_pct: values.overflow_pct
                })
            }
            await drawingService.updatePanel(editingPile.id, data)
            message.success('Pile updated successfully')
            setEditModalVisible(false)
            setEditingPile(null)
            fetchPiles(selectedDrawing.id)
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Failed to update pile')
        } finally {
            setLoading(false)
        }
    }

    const handleDeletePile = async (pileId: number) => {
        try {
            await drawingService.deletePanel(pileId)
            message.success('Pile deleted')
            if (selectedDrawing) fetchPiles(selectedDrawing.id)
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Failed to delete pile')
        }
    }

    const ensureDrawing = async () => {
        if (selectedDrawing) return selectedDrawing.id;
        if (drawings.length > 0) {
            setSelectedDrawing(drawings[0]);
            return drawings[0].id;
        }

        setLoading(true);
        try {
            const res = await api.post('/drawings', {
                project_id: projectId,
                drawing_name: 'Pile Layout Plan',
                drawing_type: 'Pile Layout',
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

    const handleOpenPileModal = async () => {
        const drawingId = await ensureDrawing();
        if (drawingId) setPileModalVisible(true);
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
                    drawing_type: 'Pile Layout'
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
                        <Empty description="No pile drawings uploaded" style={{ padding: '24px' }} />
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
                                    {selectedDrawing ? `Pile Progress: ${selectedDrawing.drawing_name}` : 'Pile Progress Board'}
                                </Title>
                            </Space>
                            <Space>
                                <Button onClick={handleOpenBatchModal}>Batch Generate</Button>
                                <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenPileModal}>Add Single Pile</Button>
                            </Space>
                        </div>
                    }
                >
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col span={6}>
                            <Card size="small" style={{ background: '#f0f5ff' }}>
                                <Statistic title="Total Piles" value={piles.length} valueStyle={{ color: '#0050b3' }} />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card size="small" style={{ background: '#f6ffed' }}>
                                <Statistic
                                    title="Total Boring"
                                    value={piles.reduce((acc, p) => acc + Number(p.design_depth || 0), 0)}
                                    precision={2}
                                    suffix="m"
                                    valueStyle={{ color: '#389e0d' }}
                                />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card size="small" style={{ background: '#fff7e6' }}>
                                <Statistic
                                    title="Total Concrete (Design)"
                                    value={piles.reduce((acc, p) => acc + Number(p.concrete_design_qty || 0), 0)}
                                    precision={2}
                                    suffix="m³"
                                    valueStyle={{ color: '#d46b08' }}
                                />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card size="small" style={{ background: '#fff1f0' }}>
                                <Statistic
                                    title="Total Steel (Design)"
                                    value={piles.reduce((acc, p) => acc + Number(p.reinforcement_ton || 0), 0)}
                                    precision={3}
                                    suffix="MT"
                                    valueStyle={{ color: '#cf1322' }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Table
                        dataSource={piles}
                        rowKey="id"
                        pagination={{ pageSize: 20 }}
                        scroll={{ x: 1800 }}
                        bordered
                        columns={[
                            {
                                title: 'Pile ID',
                                dataIndex: 'panel_identifier',
                                key: 'panel_identifier',
                                width: 130,
                                fixed: 'left',
                                render: (text, record) => (
                                    <Space direction="vertical" size={0}>
                                        <Text strong>{text}</Text>
                                        <Tag color="blue" style={{ fontSize: '10px' }}>{record.panel_type || 'Working'}</Tag>
                                    </Space>
                                )
                            },
                            {
                                title: 'Grade',
                                dataIndex: 'concrete_grade',
                                key: 'grade',
                                width: 90,
                                render: (_, record) => {
                                    const extra = typeof record.coordinates_json === 'string' ? JSON.parse(record.coordinates_json) : (record.coordinates_json || {})
                                    return <Tag color="cyan">{extra.concrete_grade || record.concrete_grade || 'M30'}</Tag>
                                }
                            },
                            {
                                title: 'Dia (mm)',
                                dataIndex: 'length',
                                key: 'diameter',
                                width: 100,
                                render: (v) => <Text strong>{v}</Text>
                            },
                            {
                                title: 'Design Depth (m)',
                                dataIndex: 'design_depth',
                                key: 'design_depth',
                                width: 120,
                                render: (v) => <Text strong>{Number(v).toFixed(2)}</Text>
                            },
                            {
                                title: 'Rock Socket (m)',
                                key: 'rock_socket',
                                width: 120,
                                render: (_, record) => {
                                    const extra = typeof record.coordinates_json === 'string' ? JSON.parse(record.coordinates_json) : (record.coordinates_json || {})
                                    return extra.rock_socket_depth || '0.00'
                                }
                            },
                            {
                                title: 'COL (m)',
                                dataIndex: 'top_rl',
                                key: 'top_rl',
                                width: 110,
                                render: (v) => v || '0.00'
                            },
                            {
                                title: 'Toe RL (m)',
                                dataIndex: 'bottom_rl',
                                key: 'bottom_rl',
                                width: 110,
                                render: (v) => v || '0.00'
                            },
                            {
                                title: 'Steel (Ton)',
                                dataIndex: 'reinforcement_ton',
                                key: 'steel',
                                width: 100,
                                render: (v) => v || '0.000'
                            },
                            {
                                title: 'Concrete (m³)',
                                dataIndex: 'concrete_design_qty',
                                key: 'concrete',
                                width: 120,
                                render: (v) => <Text strong type="success">{Number(v || 0).toFixed(3)}</Text>
                            },
                            {
                                title: 'SBC (kN/m²)',
                                key: 'sbc',
                                width: 120,
                                render: (_, record) => {
                                    const extra = typeof record.coordinates_json === 'string' ? JSON.parse(record.coordinates_json) : (record.coordinates_json || {})
                                    return extra.sbc_ton_sqm || 'N/A'
                                }
                            },
                            {
                                title: 'Execution Status',
                                key: 'progress',
                                width: 220,
                                render: (_, record) => {
                                    const consumptions = record.consumptions || []
                                    const pileLogs = consumptions.flatMap((c: any) => {
                                        try {
                                            return typeof c.pile_work_logs === 'string' ? JSON.parse(c.pile_work_logs) : (c.pile_work_logs || [])
                                        } catch (e) { return [] }
                                    }).filter((l: any) => l.drawing_panel_id === record.id)

                                    let percent = 0
                                    let status = 'active'
                                    let label = 'Pending'

                                    const hasConcrete = pileLogs.some((l: any) => Number(l.concrete_poured) > 0)
                                    const hasSteel = pileLogs.some((l: any) => Number(l.steel_installed) > 0)
                                    const maxDepth = Math.max(0, ...pileLogs.map((l: any) => Number(l.achieved_depth || 0)))
                                    const designDepth = Number(record.design_depth || 1)

                                    if (hasConcrete) {
                                        percent = 100
                                        status = 'success'
                                        label = 'Cast Done'
                                    } else if (hasSteel) {
                                        percent = 90
                                        label = 'Lowering'
                                    } else if (maxDepth > 0) {
                                        const ratio = Math.min((maxDepth / designDepth), 1)
                                        percent = Math.round(ratio * 80)
                                        label = 'Boring In-progress'
                                    }

                                    return (
                                        <div style={{ width: '100%' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <Text style={{ fontSize: 11 }}>{label}</Text>
                                                <Text style={{ fontSize: 11 }}>{percent}%</Text>
                                            </div>
                                            <Progress percent={percent} size="small" status={status as any} showInfo={false} />
                                        </div>
                                    )
                                }
                            },
                            {
                                title: 'Action',
                                key: 'action',
                                width: 120,
                                fixed: 'right',
                                render: (_, record) => (
                                    <Space size={0}>
                                        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)}>
                                            Edit
                                        </Button>
                                        <Popconfirm
                                            title="Delete this pile?"
                                            onConfirm={() => handleDeletePile(record.id)}
                                            okText="Delete"
                                            okButtonProps={{ danger: true }}
                                        >
                                            <Button type="link" size="small" danger>
                                                Delete
                                            </Button>
                                        </Popconfirm>
                                    </Space>
                                )
                            }
                        ]}
                    />
                </Card>
            </Col>

            {/* Upload Drawing Modal */}
            <Modal
                title="Upload New Pile Layout"
                open={modalVisible}
                onOk={() => form.submit()}
                onCancel={() => setModalVisible(false)}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical" onFinish={handleUpload}>
                    <Form.Item name="drawing_name" label="Drawing Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Pile Layout Plan" />
                    </Form.Item>
                    <Form.Item name="drawing_number" label="Drawing Number">
                        <Input placeholder="e.g. VH/PRJ/PL-01" />
                    </Form.Item>
                    <Form.Item label="Select Drawing File">
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

            <AddPileModal
                open={pileModalVisible}
                onCancel={() => setPileModalVisible(false)}
                onSubmit={handleAddPile}
                loading={loading}
            />

            <BatchPileModal
                open={batchModalVisible}
                onCancel={() => setBatchModalVisible(false)}
                onSubmit={handleGenerateBatch}
                loading={loading}
            />

            <EditPileModal
                open={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false)
                    setEditingPile(null)
                }}
                onSubmit={handleUpdatePile}
                loading={loading}
                editingPile={editingPile}
            />
        </Row>
    )
}

export default ProjectPiles
