import React, { useState, useEffect } from 'react'
import { Card, Table, Typography, message, Empty, Row, Col, Statistic, Tag, Space, Button, Modal, Form, Input, Select, Upload, Tooltip, Popconfirm } from 'antd'
import {
    EyeOutlined,
    BuildOutlined,
    PlusOutlined,
    SettingOutlined,
    UploadOutlined,
    EditOutlined,
    DeleteOutlined
} from '@ant-design/icons'
import { drawingService } from '../../services/api/drawings'
import { theme } from '../../styles/theme'
import AddPanelModal from '../../components/panels/AddPanelModal'
import BatchPanelModal from '../../components/panels/BatchPanelModal'
import EditPanelModal from '../../components/panels/EditPanelModal'
import BulkEditModal from '../../components/panels/BulkEditModal'
import { AddPileModal, BatchPileModal, EditPileModal } from '../../components/piles'
import { useAuth } from '../../context/AuthContext'

const { Text, Title } = Typography
const { Option } = Select

interface ProjectBOQProps {
    projectId: number
}

const ProjectBOQManager = ({ projectId }: ProjectBOQProps) => {
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

    const [form] = Form.useForm()
    const [fileList, setFileList] = useState<any[]>([])
    const [bulkEditInitialValues, setBulkEditInitialValues] = useState<any>(null)

    const [totals, setTotals] = useState({
        length: 0,
        width: 0,
        design_depth: 0,
        concrete: 0,
        grab: 0,
        stopEnd: 0,
        reinforcement: 0,
        anchors: 0,
        anchorRM: 0
    })

    useEffect(() => {
        fetchDrawings()
    }, [projectId])

    useEffect(() => {
        if (selectedDrawing) {
            fetchPanels(selectedDrawing.id)
        }
    }, [selectedDrawing])

    const calculateTotals = () => {
        const newTotals = panels.reduce((acc, panel) => {
            const layerNos = (panel.anchors || []).reduce((sum: number, a: any) => sum + Number(a.no_of_anchors || 0), 0)
            const layerRM = (panel.anchors || []).reduce((sum: number, a: any) => sum + (Number(a.no_of_anchors || 0) * Number(a.anchor_length || 0)), 0)

            const count = layerNos > 0 ? layerNos : Number(panel.no_of_anchors || 0)
            const rm = layerRM > 0 ? layerRM : (Number(panel.no_of_anchors || 0) * Number(panel.anchor_length || 0))

            return {
                length: acc.length + Number(panel.length || 0),
                width: acc.width + Number(panel.width || 0),
                design_depth: acc.design_depth + Number(panel.design_depth || 0),
                concrete: acc.concrete + Number(panel.concrete_design_qty || 0),
                grab: acc.grab + Number(panel.grabbing_qty || 0),
                stopEnd: acc.stopEnd + Number(panel.stop_end_area || 0),
                reinforcement: acc.reinforcement + Number(panel.reinforcement_ton || 0),
                anchors: acc.anchors + count,
                anchorRM: acc.anchorRM + rm
            }
        }, { length: 0, width: 0, design_depth: 0, concrete: 0, grab: 0, stopEnd: 0, reinforcement: 0, anchors: 0, anchorRM: 0 })
        setTotals(newTotals)
    }

    useEffect(() => {
        calculateTotals()
    }, [panels])

    const fetchDrawings = async () => {
        setLoading(true)
        try {
            const res = await drawingService.getDrawings({ project_id: projectId })
            const allDrawings = res.drawings || []
            setDrawings(allDrawings)

            if (allDrawings.length > 0 && !selectedDrawing) {
                // Try to find D-Wall Layout first as default, otherwise pick first
                const dWallDraw = allDrawings.find((d: any) => d.drawing_type === 'D-Wall Layout')
                setSelectedDrawing(dWallDraw || allDrawings[0])
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

            const payload = {
                drawing_id: drawingId,
                ...values
            }

            await drawingService.markPanel(drawingId, payload)
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
                    no_of_anchors: Number(values.no_of_anchors || 0),
                    anchor_length: Number(values.anchor_length || 0),
                    anchor_capacity: Number(values.anchor_capacity || 0),
                    concrete_design_qty: values.concrete_design_qty,
                    grabbing_qty: values.grabbing_qty,
                    stop_end_area: values.stop_end_area,
                    guide_wall_rm: values.guide_wall_rm,
                    ramming_qty: values.ramming_qty,
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

            // Recalculate quantities if dimensions given
            if (L && W && D) {
                updates.concrete_design_qty = Number((L * W * D).toFixed(2))
                updates.grabbing_qty = Number((L * D).toFixed(2))
                updates.stop_end_area = Number((L * D).toFixed(2))
                updates.guide_wall_rm = Number(L.toFixed(2))
                updates.ramming_qty = Number(D.toFixed(2))
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

        Modal.confirm({
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
                    fetchPanels(selectedDrawing.id)
                } catch (error: any) {
                    message.error(error?.response?.data?.message || 'Bulk delete failed')
                } finally {
                    setLoading(false)
                }
            }
        })
    }

    // Pre-populate bulk form with common values from selected panels.
    // If all selected panels share the same value, show it; otherwise blank (mixed).
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

    const handleDeletePanel = async (panelId: number) => {
        try {
            await drawingService.deletePanel(panelId)
            message.success('Panel deleted')
            fetchPanels(selectedDrawing.id)
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Failed to delete panel')
        }
    }

    const isPile = selectedDrawing?.drawing_type === 'Pile Layout'

    const panelColumns = [
        {
            title: isPile ? 'Pile ID' : 'Panel',
            dataIndex: 'panel_identifier',
            key: 'panel_identifier',
            fixed: 'left' as const,
            render: (text: string) => <Text strong>{text}</Text>
        },
        {
            title: isPile ? 'Pile Type' : 'Panel Type',
            dataIndex: 'panel_type',
            key: 'panel_type',
            render: (text: string) => text ? <Tag color="blue">{text}</Tag> : '-'
        },
        {
            title: isPile ? 'Dia (mm)' : 'L (m)',
            dataIndex: 'length',
            key: 'length',
            render: (val: any) => isPile ? val : Number(val).toFixed(2)
        },
        ...(!isPile ? [
            {
                title: 'W (m)',
                dataIndex: 'width',
                key: 'width',
                render: (val: any) => Number(val).toFixed(2)
            }
        ] : []),
        {
            title: 'D (m)',
            dataIndex: 'design_depth',
            key: 'design_depth',
            render: (val: any) => Number(val).toFixed(2)
        },
        {
            title: isPile ? 'Concrete (m³)' : 'Concrete (m³)',
            dataIndex: 'concrete_design_qty',
            key: 'concrete_design_qty',
            render: (val: any) => <Text strong>{val ? Number(val).toFixed(2) : '-'}</Text>
        },
        ...(!isPile ? [
            {
                title: 'Grab (m²)',
                dataIndex: 'grabbing_qty',
                key: 'grabbing_qty',
                render: (val: any) => val ? Number(val).toFixed(2) : '-'
            },
            {
                title: 'Stop End (m²)',
                dataIndex: 'stop_end_area',
                key: 'stop_end_area',
                render: (val: any) => val ? Number(val).toFixed(2) : '-'
            }
        ] : []),
        {
            title: 'Reinf. (Ton)',
            dataIndex: 'reinforcement_ton',
            key: 'reinforcement_ton',
            render: (val: any) => val ? Number(val).toFixed(2) : '-'
        },
        ...(!isPile ? [
            {
                title: 'Anchors',
                children: [
                    {
                        title: 'Nos',
                        key: 'anchor_nos',
                        width: 70,
                        render: (_: any, record: any) => {
                            const layers = record.anchors || []
                            if (layers.length > 0) {
                                const total = layers.reduce((sum: number, a: any) => sum + Number(a.no_of_anchors || 0), 0)
                                const details = layers.map((l: any, i: number) => `L${i + 1}: ${l.no_of_anchors}`).join(', ')
                                return (
                                    <Tooltip title={details}>
                                        <Text strong>{total}</Text> <Text type="secondary" style={{ fontSize: 11 }}>({layers.length}L)</Text>
                                    </Tooltip>
                                )
                            }
                            return record.no_of_anchors || '-'
                        }
                    },
                    {
                        title: 'L (m)',
                        key: 'anchor_len',
                        width: 80,
                        render: (_: any, record: any) => {
                            const layers = record.anchors || []
                            if (layers.length > 0) {
                                const totalLen = layers.reduce((sum: number, l: any) => sum + (Number(l.no_of_anchors || 0) * Number(l.anchor_length || 0)), 0)
                                const lengths = [...new Set(layers.map((l: any) => Number(l.anchor_length || 0)))]
                                const details = layers.map((l: any, i: number) => `L${i + 1}: ${l.no_of_anchors} nos x ${l.anchor_length}m`).join(', ')
                                return (
                                    <Tooltip title={details}>
                                        <Text>{totalLen.toFixed(1)}</Text> <Text type="secondary" style={{ fontSize: 11 }}>({lengths.join('/')})</Text>
                                    </Tooltip>
                                )
                            }
                            return record.anchor_length || '-'
                        }
                    }
                ]
            }
        ] : []),
        {
            title: 'Action',
            key: 'action',
            fixed: 'right' as const,
            width: 100,
            render: (_: any, record: any) => {
                const hasDPR = (record.dprRecords?.length > 0) || (record.consumptions?.length > 0)
                const canEdit = !hasDPR || isAdmin
                return (
                    <Space size={4}>
                        <Tooltip title={!canEdit ? `Cannot edit: DPR work logged` : `Edit ${isPile ? 'pile' : 'panel'}`}>
                            <Button
                                size="small"
                                icon={<EditOutlined />}
                                disabled={!canEdit}
                                onClick={() => handleOpenEdit(record)}
                            />
                        </Tooltip>
                        <Tooltip title={!canEdit ? `Cannot delete: DPR work logged` : `Delete ${isPile ? 'pile' : 'panel'}`}>
                            <Popconfirm
                                title={`Delete this ${isPile ? 'pile' : 'panel'}?`}
                                description="This cannot be undone. Design quantities will be recalculated."
                                onConfirm={() => handleDeletePanel(record.id)}
                                okText="Delete"
                                okButtonProps={{ danger: true }}
                                cancelText="Cancel"
                                disabled={!canEdit}
                            >
                                <Button
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    disabled={!canEdit}
                                />
                            </Popconfirm>
                        </Tooltip>
                    </Space>
                )
            }
        },
    ]

    return (
        <div style={{ padding: '0 8px' }}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Space size="large">
                                    <Space>
                                        <BuildOutlined style={{ color: theme.colors.primary.main }} />
                                        <Title level={4} style={{ margin: 0 }}>Design Quantities</Title>
                                    </Space>
                                    <Select
                                        placeholder="Select Drawing"
                                        style={{ width: 250 }}
                                        value={selectedDrawing?.id}
                                        onChange={(id) => setSelectedDrawing(drawings.find(d => d.id === id))}
                                    >
                                        {drawings.map(d => (
                                            <Option key={d.id} value={d.id}>{d.drawing_name}</Option>
                                        ))}
                                    </Select>
                                </Space>
                                <Space>
                                    <Button
                                        icon={<SettingOutlined />}
                                        onClick={() => setBatchModalVisible(true)}
                                    >
                                        Batch
                                    </Button>
                                    {selectedDrawing?.file_url && (
                                        <Button
                                            icon={<EyeOutlined />}
                                            href={`http://localhost:5000${selectedDrawing.file_url}`}
                                            target="_blank"
                                        >
                                            View
                                        </Button>
                                    )}
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setPanelModalVisible(true)}
                                    >
                                        Add {selectedDrawing?.drawing_type === 'Pile Layout' ? 'Pile' : 'Panel'}
                                    </Button>
                                    <Button type="text" icon={<UploadOutlined />} onClick={() => setModalVisible(true)} />
                                </Space>
                            </div>
                        }
                    >
                        {!selectedDrawing ? (
                            <Empty
                                description={drawings.length > 0 ? "Select a drawing to view BOQ" : "No drawings found. Upload a drawing to start."}
                                style={{ padding: '60px' }}
                            />
                        ) : (
                            <>
                                <div style={{ marginBottom: 16, background: '#f6ffed', padding: '12px', borderRadius: '4px', border: '1px solid #b7eb8f', display: 'flex', justifyContent: 'space-between' }}>
                                    <Statistic title="Total Concrete (m³)" value={totals.concrete} precision={2} valueStyle={{ color: '#3f8600', fontSize: 18 }} />
                                    <Statistic title="Total Reinf. (Ton)" value={totals.reinforcement} precision={2} valueStyle={{ color: '#096dd9', fontSize: 18 }} />
                                    <Statistic title="Total Anchors" value={totals.anchors} valueStyle={{ color: '#cf1322', fontSize: 18 }} />
                                    <Statistic title="Total Anchor Length (m)" value={totals.anchorRM} precision={1} valueStyle={{ color: '#722ed1', fontSize: 18 }} />
                                </div>
                                {selectedRowKeys.length > 0 && (
                                    <div style={{ marginBottom: 12, background: '#e6f7ff', padding: '10px 16px', borderRadius: '6px', border: '1px solid #91d5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                                                icon={<EditOutlined />}
                                                onClick={() => openBulkEditWithPreFill()}
                                            >
                                                Edit Selected ({selectedRowKeys.length})
                                            </Button>
                                        </Space>
                                    </div>
                                )}
                                <Table
                                    dataSource={panels}
                                    columns={panelColumns}
                                    rowKey="id"
                                    loading={loading}
                                    pagination={{ pageSize: 50 }}
                                    scroll={{ x: 1000 }}
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
                                    summary={() => (
                                        <Table.Summary fixed>
                                            <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                                                <Table.Summary.Cell index={0}></Table.Summary.Cell> {/* Checkbox */}
                                                <Table.Summary.Cell index={1}>Total</Table.Summary.Cell> {/* ID */}
                                                <Table.Summary.Cell index={2}>-</Table.Summary.Cell> {/* Type */}
                                                <Table.Summary.Cell index={3}>{isPile ? '-' : totals.length.toFixed(2)}</Table.Summary.Cell>

                                                {isPile ? (
                                                    <>
                                                        <Table.Summary.Cell index={4}>{totals.design_depth.toFixed(2)}</Table.Summary.Cell>
                                                        <Table.Summary.Cell index={5}>{totals.concrete.toFixed(2)}</Table.Summary.Cell>
                                                        <Table.Summary.Cell index={6}>{totals.reinforcement.toFixed(2)}</Table.Summary.Cell>
                                                        <Table.Summary.Cell index={7}></Table.Summary.Cell>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Table.Summary.Cell index={4}>{totals.width.toFixed(2)}</Table.Summary.Cell>
                                                        <Table.Summary.Cell index={5}>{totals.design_depth.toFixed(2)}</Table.Summary.Cell>
                                                        <Table.Summary.Cell index={6}>{totals.concrete.toFixed(2)}</Table.Summary.Cell>
                                                        <Table.Summary.Cell index={7}>{totals.grab.toFixed(2)}</Table.Summary.Cell>
                                                        <Table.Summary.Cell index={8}>{totals.stopEnd.toFixed(2)}</Table.Summary.Cell>
                                                        <Table.Summary.Cell index={9}>{totals.reinforcement.toFixed(2)}</Table.Summary.Cell>
                                                        <Table.Summary.Cell index={10}>{totals.anchors}</Table.Summary.Cell>
                                                        <Table.Summary.Cell index={11}>{totals.anchorRM.toFixed(1)}</Table.Summary.Cell>
                                                        <Table.Summary.Cell index={12}></Table.Summary.Cell>
                                                    </>
                                                )}
                                            </Table.Summary.Row>
                                        </Table.Summary>
                                    )}
                                />
                            </>
                        )}
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
                                <Option value="Pile Layout">Pile Layout</Option>
                                <Option value="Anchor Layout">Anchor Layout</Option>
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

                {selectedDrawing?.drawing_type === 'Pile Layout' ? (
                    <>
                        <AddPileModal
                            open={panelModalVisible}
                            onCancel={() => setPanelModalVisible(false)}
                            onSubmit={handleAddPanel}
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
                                setEditingPanel(null)
                            }}
                            onSubmit={handleUpdatePanel}
                            loading={loading}
                            editingPile={editingPanel}
                        />
                    </>
                ) : (
                    <>
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
                    </>
                )}

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
        </div >
    )
}

export default ProjectBOQManager
