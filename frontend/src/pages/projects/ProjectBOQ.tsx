import React, { useState, useEffect } from 'react'
import { Card, Table, Typography, message, Empty, Row, Col, Statistic, Tag, Space, Button, Modal, Form, Input, Select, Divider, Upload, Tooltip, Popconfirm } from 'antd'
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

const { Text, Title } = Typography
const { Option } = Select

interface ProjectBOQProps {
    projectId: number
}

const ProjectBOQManager = ({ projectId }: ProjectBOQProps) => {
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
    const [panelForm] = Form.useForm()
    const [batchForm] = Form.useForm()
    const [editForm] = Form.useForm()
    const [bulkForm] = Form.useForm()
    const [fileList, setFileList] = useState<any[]>([])

    const [totals, setTotals] = useState({
        length: 0,
        width: 0,
        design_depth: 0,
        concrete: 0,
        grab: 0,
        stopEnd: 0,
        reinforcement: 0,
        anchors: 0
    })

    // Calculated fields state
    const [calculatedValues, setCalculatedValues] = useState({
        concrete_volume: 0,
        grabbing_qty: 0,
        stop_end_area: 0,
        guide_wall_rm: 0,
        ramming_qty: 0
    })

    useEffect(() => {
        fetchDrawings()
    }, [projectId])

    useEffect(() => {
        if (selectedDrawing) {
            fetchPanels(selectedDrawing.id)
        }
    }, [selectedDrawing])

    useEffect(() => {
        calculateTotals()
    }, [panels])

    const calculateTotals = () => {
        const newTotals = panels.reduce((acc, panel) => ({
            length: acc.length + Number(panel.length || 0),
            width: acc.width + Number(panel.width || 0),
            design_depth: acc.design_depth + Number(panel.design_depth || 0),
            concrete: acc.concrete + Number(panel.concrete_design_qty || 0),
            grab: acc.grab + Number(panel.grabbing_qty || 0),
            stopEnd: acc.stopEnd + Number(panel.stop_end_area || 0),
            reinforcement: acc.reinforcement + Number(panel.reinforcement_ton || 0),
            anchors: acc.anchors + Number(panel.no_of_anchors || 0)
        }), { length: 0, width: 0, design_depth: 0, concrete: 0, grab: 0, stopEnd: 0, reinforcement: 0, anchors: 0 })
        setTotals(newTotals)
    }

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

        // Auto-populate form fields so user can see they are calculated
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
        editForm.setFieldsValue({
            panel_identifier: panel.panel_identifier,
            panel_type: panel.panel_type,
            length: panel.length,
            width: panel.width,
            depth: panel.design_depth,
            top_rl: panel.top_rl,
            bottom_rl: panel.bottom_rl,
            reinforcement_ton: panel.reinforcement_ton,
            no_of_anchors: panel.no_of_anchors,
            anchor_length: panel.anchor_length,
            anchor_capacity: panel.anchor_capacity,
            concrete_design_qty: panel.concrete_design_qty,
            grabbing_qty: panel.grabbing_qty,
            stop_end_area: panel.stop_end_area,
            guide_wall_rm: panel.guide_wall_rm,
            ramming_qty: panel.ramming_qty,
        })
        setEditModalVisible(true)
    }

    const handleEditPanel = async (values: any) => {
        if (!editingPanel) return
        setLoading(true)
        try {
            const L = Number(values.length)
            const W = Number(values.width)
            const D = Number(values.depth)
            await drawingService.updatePanel(editingPanel.id, {
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
                ramming_qty: Number((L * W).toFixed(2)),
            })
            message.success('Panel updated successfully')
            setEditModalVisible(false)
            setEditingPanel(null)
            editForm.resetFields()
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
                updates.ramming_qty = Number((L * W).toFixed(2))
            }

            await drawingService.bulkUpdatePanels(ids, updates)
            message.success(`${ids.length} panels updated successfully`)
            setBulkEditModalVisible(false)
            bulkForm.resetFields()
            setSelectedRowKeys([])
            fetchPanels(selectedDrawing.id)
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Bulk update failed')
        } finally {
            setLoading(false)
        }
    }

    // Pre-populate bulk form with common values from selected panels.
    // If all selected panels share the same value, show it; otherwise blank (mixed).
    const openBulkEditWithPreFill = () => {
        bulkForm.resetFields()
        const selected = panels.filter(p => selectedRowKeys.includes(p.id))
        if (selected.length === 0) return

        const getCommon = (key: string) => {
            const vals = selected.map((p: any) => p[key])
            return vals.every(v => String(v) === String(vals[0])) ? vals[0] : undefined
        }

        bulkForm.setFieldsValue({
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

    const panelColumns = [
        {
            title: 'Panel',
            dataIndex: 'panel_identifier',
            key: 'panel_identifier',
            fixed: 'left' as const,
            render: (text: string) => <Text strong>{text}</Text>
        },
        {
            title: 'Panel Type',
            dataIndex: 'panel_type',
            key: 'panel_type',
            render: (text: string) => text ? <Tag color="blue">{text}</Tag> : '-'
        },
        {
            title: 'L (m)',
            dataIndex: 'length',
            key: 'length',
            render: (val: any) => Number(val).toFixed(2)
        },
        {
            title: 'W (m)',
            dataIndex: 'width',
            key: 'width',
            render: (val: any) => Number(val).toFixed(2)
        },
        {
            title: 'D (m)',
            dataIndex: 'design_depth',
            key: 'design_depth',
            render: (val: any) => Number(val).toFixed(2)
        },
        {
            title: 'Concrete (m³)',
            dataIndex: 'concrete_design_qty',
            key: 'concrete_design_qty',
            render: (val: any) => <Text strong>{val ? Number(val).toFixed(2) : '-'}</Text>
        },
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
        },
        {
            title: 'Reinf. (Ton)',
            dataIndex: 'reinforcement_ton',
            key: 'reinforcement_ton',
            render: (val: any) => val ? Number(val).toFixed(2) : '-'
        },
        {
            title: 'Anchors',
            dataIndex: 'no_of_anchors',
            key: 'no_of_anchors',
            render: (val: any) => val || '-'
        },
        {
            title: 'Action',
            key: 'action',
            fixed: 'right' as const,
            width: 100,
            render: (_: any, record: any) => {
                const hasDPR = (record.dprRecords?.length > 0) || (record.consumptions?.length > 0)
                return (
                    <Space size={4}>
                        <Tooltip title={hasDPR ? 'Cannot edit: DPR work logged' : 'Edit panel'}>
                            <Button
                                size="small"
                                icon={<EditOutlined />}
                                disabled={hasDPR}
                                onClick={() => handleOpenEdit(record)}
                            />
                        </Tooltip>
                        <Tooltip title={hasDPR ? 'Cannot delete: DPR work logged' : 'Delete panel'}>
                            <Popconfirm
                                title="Delete this panel?"
                                description="This cannot be undone. Design quantities will be recalculated."
                                onConfirm={() => handleDeletePanel(record.id)}
                                okText="Delete"
                                okButtonProps={{ danger: true }}
                                cancelText="Cancel"
                                disabled={hasDPR}
                            >
                                <Button
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    disabled={hasDPR}
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
                                        Add Panel
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
                                </div>
                                {selectedRowKeys.length > 0 && (
                                    <div style={{ marginBottom: 12, background: '#e6f7ff', padding: '10px 16px', borderRadius: '6px', border: '1px solid #91d5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text strong>{selectedRowKeys.length} panel{selectedRowKeys.length > 1 ? 's' : ''} selected</Text>
                                        <Space>
                                            <Button size="small" onClick={() => setSelectedRowKeys([])}>Clear</Button>
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
                                        getCheckboxProps: (record: any) => ({
                                            disabled: (record.dprRecords?.length > 0) || (record.consumptions?.length > 0)
                                        })
                                    }}
                                    summary={() => (
                                        <Table.Summary fixed>
                                            <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                                                <Table.Summary.Cell index={0}></Table.Summary.Cell>
                                                <Table.Summary.Cell index={1}>Total</Table.Summary.Cell>
                                                <Table.Summary.Cell index={2}>-</Table.Summary.Cell>
                                                <Table.Summary.Cell index={3}>{totals.length.toFixed(2)}</Table.Summary.Cell>
                                                <Table.Summary.Cell index={4}>{totals.width.toFixed(2)}</Table.Summary.Cell>
                                                <Table.Summary.Cell index={5}>{totals.design_depth.toFixed(2)}</Table.Summary.Cell>
                                                <Table.Summary.Cell index={6}>{totals.concrete.toFixed(2)}</Table.Summary.Cell>
                                                <Table.Summary.Cell index={7}>{totals.grab.toFixed(2)}</Table.Summary.Cell>
                                                <Table.Summary.Cell index={8}>{totals.stopEnd.toFixed(2)}</Table.Summary.Cell>
                                                <Table.Summary.Cell index={9}>{totals.reinforcement.toFixed(2)}</Table.Summary.Cell>
                                                <Table.Summary.Cell index={10}>{totals.anchors}</Table.Summary.Cell>
                                                <Table.Summary.Cell index={11}></Table.Summary.Cell>
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
                            if (changedValues.top_rl || changedValues.bottom_rl) {
                                const top = Number(allValues.top_rl)
                                const bottom = Number(allValues.bottom_rl)
                                if (!isNaN(top) && !isNaN(bottom)) {
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

                {/* Bulk Edit Modal */}
                <Modal
                    title={`Bulk Edit ${selectedRowKeys.length} Panel${selectedRowKeys.length > 1 ? 's' : ''}`}
                    open={bulkEditModalVisible}
                    onOk={() => bulkForm.submit()}
                    onCancel={() => { setBulkEditModalVisible(false); bulkForm.resetFields() }}
                    confirmLoading={loading}
                    width={700}
                >
                    <div style={{ marginBottom: 16, background: '#fffbe6', padding: '10px 14px', borderRadius: '6px', border: '1px solid #ffe58f' }}>
                        <Text><strong>Tip:</strong> Only fill the fields you want to change. Leave a field blank to keep the existing value on each panel.</Text>
                    </div>
                    <Form
                        form={bulkForm}
                        layout="vertical"
                        onFinish={handleBulkEdit}
                        onValuesChange={(changedValues, allValues) => {
                            if (changedValues.top_rl !== undefined || changedValues.bottom_rl !== undefined) {
                                const top = Number(allValues.top_rl)
                                const bottom = Number(allValues.bottom_rl)
                                if (!isNaN(top) && !isNaN(bottom) && top !== 0 && bottom !== 0) {
                                    bulkForm.setFieldsValue({ depth: Number((top - bottom).toFixed(2)) })
                                }
                            }
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="panel_type" label="Panel Type (optional)">
                                    <Select allowClear placeholder="Keep existing">
                                        <Option value="Primary">Primary (P)</Option>
                                        <Option value="Secondary">Secondary (S)</Option>
                                        <Option value="Closing">Closing (C)</Option>
                                        <Option value="End">End (E)</Option>
                                        <Option value="Corner">Corner</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="reinforcement_ton" label="Reinforcement (Ton)">
                                    <Input type="number" step="0.01" placeholder="Leave blank to keep" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Divider orientation="left">Dimensions — fill all three to recalculate BOQ</Divider>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="length" label="Length (L)">
                                    <Input type="number" step="0.01" placeholder="e.g. 2.8" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="width" label="Width (W)">
                                    <Input type="number" step="0.01" placeholder="e.g. 0.8" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="depth" label="Depth (D)">
                                    <Input type="number" step="0.1" placeholder="e.g. 22.0" />
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
                        <Divider orientation="left">Anchors</Divider>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="no_of_anchors" label="No. of Anchors">
                                    <Input type="number" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="anchor_length" label="Anchor Length (m)">
                                    <Input type="number" step="0.01" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="anchor_capacity" label="Anchor Capacity (kN)">
                                    <Input type="number" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Modal>

                {/* Edit Panel Modal */}
                <Modal
                    title={`Edit Panel: ${editingPanel?.panel_identifier || ''}`}
                    open={editModalVisible}
                    onOk={() => editForm.submit()}
                    onCancel={() => { setEditModalVisible(false); setEditingPanel(null); editForm.resetFields() }}
                    confirmLoading={loading}
                    width={800}
                >
                    <Form
                        form={editForm}
                        layout="vertical"
                        onFinish={handleEditPanel}
                        onValuesChange={(changedValues, allValues) => {
                            let L = Number(allValues.length || 0)
                            let W = Number(allValues.width || 0)
                            let D = Number(allValues.depth || 0)
                            if (changedValues.top_rl !== undefined || changedValues.bottom_rl !== undefined) {
                                const top = Number(allValues.top_rl)
                                const bottom = Number(allValues.bottom_rl)
                                if (!isNaN(top) && !isNaN(bottom)) {
                                    D = Number((top - bottom).toFixed(2))
                                    editForm.setFieldsValue({ depth: D })
                                }
                            }
                            editForm.setFieldsValue({
                                concrete_design_qty: Number((L * W * D).toFixed(2)),
                                grabbing_qty: Number((L * D).toFixed(2)),
                                stop_end_area: Number((L * D).toFixed(2)),
                                guide_wall_rm: Number(L.toFixed(2)),
                                ramming_qty: Number((L * W).toFixed(2)),
                            })
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="panel_identifier" label="Panel ID" rules={[{ required: true }]}>
                                    <Input placeholder="e.g. P1" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="panel_type" label="Panel Type">
                                    <Select>
                                        <Option value="Primary">Primary (P)</Option>
                                        <Option value="Secondary">Secondary (S)</Option>
                                        <Option value="Closing">Closing (C)</Option>
                                        <Option value="End">End (E)</Option>
                                        <Option value="Corner">Corner</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider orientation="left">Dimensions (m)</Divider>
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
                                <Form.Item name="depth" label="Depth / Design Depth (D)" rules={[{ required: true }]}>
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
                        <Row gutter={16}>
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
        </div >
    )
}

export default ProjectBOQManager
