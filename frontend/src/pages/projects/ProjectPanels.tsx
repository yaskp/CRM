import { useState, useEffect } from 'react'
import { Card, Button, Modal, Form, Input, Select, Space, Typography, Empty, Row, Col, Upload, Tabs, Table, Tag, Progress, Tooltip, Popconfirm, App } from 'antd'
import {
    PlusOutlined,
    FileImageOutlined,
    UploadOutlined,
    EyeOutlined,
    AppstoreOutlined,
    EditOutlined,
    DeleteOutlined
} from '@ant-design/icons'
import { drawingService } from '../../services/api/drawings'
import api from '../../services/api/auth'
import { theme } from '../../styles/theme'
import DrawingVisualizer from './DrawingVisualizer'
import AddPanelModal from '../../components/panels/AddPanelModal'
import BatchPanelModal from '../../components/panels/BatchPanelModal'
import EditPanelModal from '../../components/panels/EditPanelModal'
import BulkEditModal from '../../components/panels/BulkEditModal'
import { useAuth } from '../../context/AuthContext'

const { Text, Title } = Typography
const { Option } = Select

interface ProjectPanelsProps {
    projectId: number
}

const ProjectPanels = ({ projectId }: ProjectPanelsProps) => {
    const { user } = useAuth()
    const isAdmin = user?.roles?.some(r => ['Admin', 'SuperAdmin'].includes(r))

    const [drawings, setDrawings] = useState<any[]>([])
    const [selectedDrawing, setSelectedDrawing] = useState<any>(null)
    const [panels, setPanels] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [panelModalVisible, setPanelModalVisible] = useState(false)
    const [batchModalVisible, setBatchModalVisible] = useState(false)
    const [editModalVisible, setEditModalVisible] = useState(false)
    const [editingPanel, setEditingPanel] = useState<any>(null)
    const [bulkEditModalVisible, setBulkEditModalVisible] = useState(false)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [bulkEditInitialValues, setBulkEditInitialValues] = useState<any>(null)

    const [form] = Form.useForm()
    const { message, modal } = App.useApp()

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
            const res = await drawingService.getDrawings({ project_id: projectId, drawing_type: 'D-Wall Layout' })
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

    const handleAddPanel = async (values: any) => {
        setLoading(true)
        try {
            let drawingId = selectedDrawing?.id;
            await drawingService.markPanel(drawingId, values)
            message.success('Panel details added')
            setPanelModalVisible(false)
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

            const { prefix, start_no, end_no, panel_type } = values
            const panelsToCreate = []

            for (let i = Number(start_no); i <= Number(end_no); i++) {
                panelsToCreate.push({
                    panel_identifier: `${prefix}${i}`,
                    panel_type,
                    length: values.length,
                    width: values.width,
                    design_depth: values.depth,
                    top_rl: values.top_rl,
                    bottom_rl: values.bottom_rl,
                    reinforcement_ton: values.reinforcement_ton,
                    concrete_design_qty: values.concrete_design_qty,
                    grabbing_qty: values.grabbing_qty,
                    stop_end_area: values.stop_end_area,
                    guide_wall_rm: values.guide_wall_rm,
                    ramming_qty: values.ramming_qty,
                    anchors: values.anchors // Dynamic layers
                })
            }

            await drawingService.bulkCreatePanels(drawingId, panelsToCreate)
            message.success(`Successfully generated ${panelsToCreate.length} panels`)
            setBatchModalVisible(false)
            fetchPanels(drawingId)
        } catch (error) {
            message.error('Failed to generate sequence')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenEdit = (panel: any) => {
        setEditingPanel(panel)
        setEditModalVisible(true)
    }

    const handleUpdatePanel = async (values: any) => {
        if (!editingPanel) return
        setLoading(true)
        try {
            await drawingService.updatePanel(editingPanel.id, values)
            message.success('Panel updated successfully')
            setEditModalVisible(false)
            setEditingPanel(null)
            fetchPanels(selectedDrawing.id)
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Failed to update panel')
        } finally {
            setLoading(false)
        }
    }

    const handleBulkEdit = async (values: any) => {
        setLoading(true)
        try {
            const ids = selectedRowKeys.map(k => Number(k))
            const L = values.length ? Number(values.length) : undefined
            const W = values.width ? Number(values.width) : undefined
            const D = values.depth ? Number(values.depth) : undefined

            const updates: any = {}
            if (values.panel_type) updates.panel_type = values.panel_type
            if (L) updates.length = L
            if (W) updates.width = W
            if (D) updates.design_depth = D
            if (values.top_rl) updates.top_rl = Number(values.top_rl)
            if (values.bottom_rl) updates.bottom_rl = Number(values.bottom_rl)
            if (values.reinforcement_ton) updates.reinforcement_ton = Number(values.reinforcement_ton)
            if (values.no_of_anchors) updates.no_of_anchors = Number(values.no_of_anchors)
            if (values.anchor_length) updates.anchor_length = Number(values.anchor_length)
            if (values.anchor_capacity) updates.anchor_capacity = Number(values.anchor_capacity)

            if (L && W && D) {
                updates.concrete_design_qty = Number((L * W * D).toFixed(2))
                updates.grabbing_qty = Number((L * D).toFixed(2))
                updates.stop_end_area = Number((L * D).toFixed(2))
                updates.guide_wall_rm = Number(L.toFixed(2))
                updates.ramming_qty = Number((L * W).toFixed(2))
            }

            await drawingService.bulkUpdatePanels(ids, updates)
            message.success(`${ids.length} panels updated successfully`)
            setBulkEditModalVisible(false)
            setBulkEditInitialValues(null)
            setSelectedRowKeys([])
            fetchPanels(selectedDrawing.id)
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Bulk update failed')
        } finally {
            setLoading(false)
        }
    }

    const handleBulkDelete = async () => {
        if (selectedRowKeys.length === 0) return

        modal.confirm({
            title: `Delete ${selectedRowKeys.length} panels?`,
            content: 'This action cannot be undone. All selected panels will be permanently removed.',
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                setLoading(true)
                try {
                    const ids = selectedRowKeys.map(k => Number(k))
                    await drawingService.bulkDeletePanels(ids)
                    message.success(`${ids.length} panels deleted successfully`)
                    setSelectedRowKeys([])
                    if (selectedDrawing) fetchPanels(selectedDrawing.id)
                } catch (error: any) {
                    message.error(error?.response?.data?.message || 'Bulk delete failed')
                } finally {
                    setLoading(false)
                }
            }
        })
    }

    const handleDeletePanel = async (panelId: number) => {
        try {
            await drawingService.deletePanel(panelId)
            message.success('Panel deleted')
            if (selectedDrawing) fetchPanels(selectedDrawing.id)
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Failed to delete panel')
        }
    }

    const openBulkEditWithPreFill = () => {
        const selected = panels.filter(p => selectedRowKeys.includes(p.id))
        if (selected.length === 0) return

        const getCommon = (key: string) => {
            const vals = selected.map((p: any) => p[key])
            return vals.every(v => String(v) === String(vals[0])) ? vals[0] : undefined
        }

        setBulkEditInitialValues({
            panel_type: getCommon('panel_type'),
            length: getCommon('length'),
            width: getCommon('width'),
            depth: getCommon('design_depth'),
            top_rl: getCommon('top_rl'),
            bottom_rl: getCommon('bottom_rl'),
            reinforcement_ton: getCommon('reinforcement_ton'),
            no_of_anchors: getCommon('no_of_anchors'),
            anchor_length: getCommon('anchor_length'),
            anchor_capacity: getCommon('anchor_capacity'),
        })
        setBulkEditModalVisible(true)
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
                    styles={{ body: { padding: 0 } }}
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
                                        <>
                                            {selectedRowKeys.length > 0 && (
                                                <div style={{ marginBottom: 16, background: '#e6f7ff', padding: '10px 16px', borderRadius: '6px', border: '1px solid #91d5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Text strong>{selectedRowKeys.length} panel{selectedRowKeys.length > 1 ? 's' : ''} selected</Text>
                                                    <Space>
                                                        <Button size="small" onClick={() => setSelectedRowKeys([])}>Clear</Button>
                                                        <Button
                                                            danger
                                                            size="small"
                                                            icon={<DeleteOutlined />}
                                                            onClick={handleBulkDelete}
                                                        >
                                                            Delete ({selectedRowKeys.length})
                                                        </Button>
                                                        <Button
                                                            type="primary"
                                                            size="small"
                                                            onClick={() => openBulkEditWithPreFill()}
                                                        >
                                                            Bulk Edit ({selectedRowKeys.length})
                                                        </Button>
                                                    </Space>
                                                </div>
                                            )}
                                            <Table
                                                dataSource={panels}
                                                rowKey="id"
                                                rowSelection={{
                                                    selectedRowKeys,
                                                    onChange: setSelectedRowKeys,
                                                    onSelectAll: (selected) => {
                                                        if (selected) {
                                                            const allIds = panels
                                                                .filter(p => isAdmin || !((p.dprRecords?.length > 0) || (p.consumptions?.length > 0)))
                                                                .map(p => p.id)
                                                            setSelectedRowKeys(allIds)
                                                        } else {
                                                            setSelectedRowKeys([])
                                                        }
                                                    },
                                                    getCheckboxProps: (record: any) => ({
                                                        disabled: !isAdmin && ((record.dprRecords?.length > 0) || (record.consumptions?.length > 0))
                                                    })
                                                }}
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
                                                    },
                                                    {
                                                        title: 'Action',
                                                        key: 'action',
                                                        width: 100,
                                                        fixed: 'right',
                                                        render: (_, record) => {
                                                            const hasDPR = (record.dprRecords?.length > 0) || (record.consumptions?.length > 0)
                                                            const canEdit = !hasDPR || isAdmin
                                                            return (
                                                                <Space size={0}>
                                                                    <Tooltip title={!canEdit ? 'Cannot edit: DPR work logged' : 'Edit panel'}>
                                                                        <Button type="link" size="small" icon={<EditOutlined />} disabled={!canEdit} onClick={() => handleOpenEdit(record)}>
                                                                            Edit
                                                                        </Button>
                                                                    </Tooltip>
                                                                    <Tooltip title={!canEdit ? 'Cannot delete: DPR work logged' : 'Delete panel'}>
                                                                        <Popconfirm
                                                                            title="Delete this panel?"
                                                                            onConfirm={() => handleDeletePanel(record.id)}
                                                                            okText="Delete"
                                                                            okButtonProps={{ danger: true }}
                                                                            disabled={!canEdit}
                                                                        >
                                                                            <Button type="link" size="small" danger disabled={!canEdit}>
                                                                                Delete
                                                                            </Button>
                                                                        </Popconfirm>
                                                                    </Tooltip>
                                                                </Space>
                                                            )
                                                        }
                                                    }
                                                ]}
                                            />
                                        </>
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

            <AddPanelModal
                open={panelModalVisible}
                onCancel={() => setPanelModalVisible(false)}
                onSubmit={handleAddPanel}
                loading={loading}
            />

            <BatchPanelModal
                open={batchModalVisible}
                onCancel={() => setBatchModalVisible(false)}
                onSubmit={handleGenerateBatch}
                loading={loading}
            />

            <EditPanelModal
                open={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false)
                    setEditingPanel(null)
                }}
                onSubmit={handleUpdatePanel}
                loading={loading}
                editingPanel={editingPanel}
            />

            <BulkEditModal
                open={bulkEditModalVisible}
                onCancel={() => {
                    setBulkEditModalVisible(false)
                    setBulkEditInitialValues(null)
                }}
                onSubmit={handleBulkEdit}
                loading={loading}
                selectedCount={selectedRowKeys.length}
                initialValues={bulkEditInitialValues}
            />
        </Row>
    )
}

export default ProjectPanels
