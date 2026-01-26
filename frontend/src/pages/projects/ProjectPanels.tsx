import { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, Space, Typography, Tag, message, Empty, Row, Col, Upload, Progress, Divider } from 'antd'
import {
    PlusOutlined,
    FileImageOutlined,
    UploadOutlined,
    EyeOutlined,
    BuildOutlined,
    SettingOutlined
} from '@ant-design/icons'
import { drawingService } from '../../services/api/drawings'
import { theme } from '../../styles/theme'

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

    const handleAddPanel = async (values: any) => {
        setLoading(true)
        try {
            let drawingId = selectedDrawing?.id;

            // Auto-create a default layout if none exists
            if (!drawingId) {
                const newDrawing = await drawingService.uploadDrawing(
                    { project_id: projectId, drawing_name: 'Master Panel Schedule', drawing_type: 'General Layout' },
                    null as any // Handle case where no file is provided for auto-generated layout
                );
                drawingId = newDrawing.drawing.id;
                await fetchDrawings();
            }

            await drawingService.markPanel(drawingId, {
                panel_identifier: values.panel_identifier,
                panel_type: values.panel_type,
                coordinates_json: { length: values.length, width: values.width, depth: values.depth }
            })
            message.success('Panel details added')
            setPanelModalVisible(false)
            panelForm.resetFields()
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

            if (!drawingId) {
                const newDrawing = await drawingService.uploadDrawing(
                    { project_id: projectId, drawing_name: 'Master Panel Schedule', drawing_type: 'General Layout' },
                    null as any
                );
                drawingId = newDrawing.drawing.id;
                await fetchDrawings();
            }

            const { prefix, start_no, end_no, panel_type, length, width, depth } = values
            const panelsToCreate = []

            for (let i = start_no; i <= end_no; i++) {
                panelsToCreate.push({
                    panel_identifier: `${prefix}${i}`,
                    panel_type,
                    dimensions: { length, width, depth }
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

    const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !selectedDrawing) return

        const reader = new FileReader()
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string
                const lines = text.split('\n')
                const bulkPanels = []

                // Skip header line
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim()
                    if (!line) continue

                    const [id, type, l, w, d] = line.split(',')
                    bulkPanels.push({
                        panel_identifier: id,
                        panel_type: type || 'Primary',
                        dimensions: { length: Number(l), width: Number(w), depth: Number(d) }
                    })
                }

                if (bulkPanels.length > 0) {
                    setLoading(true)
                    await drawingService.bulkCreatePanels(selectedDrawing.id, bulkPanels)
                    message.success(`Imported ${bulkPanels.length} panels from CSV`)
                    fetchPanels(selectedDrawing.id)
                }
            } catch (error) {
                message.error('Invalid CSV format. Use: PanelID,Type,Length,Width,Depth')
            } finally {
                setLoading(false)
                e.target.value = '' // Reset input
            }
        }
        reader.readAsText(file)
    }

    // handleUpdateProgress removed as progress is auto-calculated from DPR


    const getStatusTag = (status: string) => {
        switch (status) {
            case 'completed': return <Tag color="success">COMPLETED</Tag>
            case 'in_progress': return <Tag color="processing">IN PROGRESS</Tag>
            default: return <Tag color="default">NOT STARTED</Tag>
        }
    }

    const panelColumns = [
        {
            title: 'Panel ID',
            dataIndex: 'panel_identifier',
            key: 'panel_identifier',
            render: (text: string) => <Text strong>{text}</Text>
        },
        {
            title: 'Type',
            dataIndex: 'panel_type',
            key: 'panel_type',
            render: (type: string) => <Tag color="blue">{type?.toUpperCase() || 'STANDARD'}</Tag>
        },
        {
            title: 'Dimensions (LxWxD)',
            key: 'dimensions',
            render: (_: any, record: any) => {
                const dims = record.coordinates_json ? (typeof record.coordinates_json === 'string' ? JSON.parse(record.coordinates_json) : record.coordinates_json) : {}
                return `${dims.length || '-'}m × ${dims.width || '-'}mm × ${dims.depth || '-'}m`
            }
        },
        {
            title: 'Progress (from DPR)',
            key: 'progress',
            width: 250,
            render: (_: any, record: any) => {
                const latest = record.dprRecords?.[0]
                const percentage = latest?.work_completion_percentage || 0
                const status = percentage >= 100 ? 'completed' : (percentage > 0 ? 'in_progress' : 'not_started')

                return (
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            {getStatusTag(status)}
                            <Text type="secondary" style={{ fontSize: 12 }}>{percentage}%</Text>
                        </div>
                        <Progress
                            percent={Number(percentage)}
                            size="small"
                            status={status === 'completed' ? 'success' : 'active'}
                            showInfo={false}
                        />
                        {latest && (
                            <div style={{ fontSize: 10, color: theme.colors.neutral.gray500, marginTop: 4 }}>
                                Last Update: {new Date(latest.report_date).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                )
            }
        }
    ]

    // Action column removed - progress is view only here

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
                                <BuildOutlined style={{ color: theme.colors.primary.main }} />
                                <Title level={4} style={{ margin: 0 }}>
                                    {selectedDrawing ? `Panels in ${selectedDrawing.drawing_name}` : 'D-Wall Panel Details'}
                                </Title>
                            </Space>
                            <Space>
                                <Button
                                    icon={<SettingOutlined />}
                                    onClick={() => setBatchModalVisible(true)}
                                    style={{ background: '#f6ffed', color: '#52c41a', borderColor: '#b7eb8f' }}
                                >
                                    Generate Sequence
                                </Button>
                                <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                                    <Button icon={<UploadOutlined />}>Import CSV</Button>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleCSVImport}
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            opacity: 0,
                                            cursor: 'pointer',
                                            width: '100%',
                                            height: '100%'
                                        }}
                                    />
                                </div>
                                {selectedDrawing?.file_url && (
                                    <Button
                                        icon={<EyeOutlined />}
                                        href={`http://localhost:5000${selectedDrawing.file_url}`}
                                        target="_blank"
                                    >
                                        Full Screen
                                    </Button>
                                )}
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setPanelModalVisible(true)}
                                >
                                    Add One
                                </Button>
                            </Space>
                        </div>
                    }
                >
                    {!selectedDrawing ? (
                        <Empty description="Select a drawing to view and manage panels" style={{ padding: '60px' }} />
                    ) : (
                        <>
                            {selectedDrawing.file_url && (
                                <div style={{ marginBottom: 24, borderRadius: 8, overflow: 'hidden', border: `1px solid ${theme.colors.neutral.gray200}`, background: '#f9f9f9' }}>
                                    <div style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.colors.neutral.gray200}`, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text strong><FileImageOutlined /> Drawing Preview: {selectedDrawing.drawing_name}</Text>
                                        <Tag color="blue">{selectedDrawing.file_type?.toUpperCase()}</Tag>
                                    </div>
                                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                                        {selectedDrawing.file_type?.toLowerCase() === 'pdf' ? (
                                            <iframe
                                                src={`http://localhost:5000${selectedDrawing.file_url}#toolbar=0&navpanes=0`}
                                                width="100%"
                                                height="100%"
                                                style={{ border: 'none' }}
                                            />
                                        ) : (
                                            <img
                                                src={`http://localhost:5000${selectedDrawing.file_url}`}
                                                alt="Drawing Preview"
                                                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                            <Table
                                dataSource={panels}
                                columns={panelColumns}
                                rowKey="id"
                                loading={loading}
                                pagination={{ pageSize: 5 }}
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
                            <Option value="Guide Wall Layout">Guide Wall Layout</Option>
                            <Option value="Reinforcement Detail">Reinforcement Detail</Option>
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
            >
                <Form form={panelForm} layout="vertical" onFinish={handleAddPanel}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="panel_identifier" label="Panel ID/Identifier" rules={[{ required: true }]}>
                                <Input placeholder="e.g. P1, P-02" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="panel_type" label="Panel Type" initialValue="Primary">
                                <Select>
                                    <Option value="Primary">Primary (P)</Option>
                                    <Option value="Secondary">Secondary (S)</Option>
                                    <Option value="Corner">Corner (C)</Option>
                                    <Option value="L-Shape">L-Shape</Option>
                                    <Option value="T-Shape">T-Shape</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Title level={5} style={{ marginTop: 8, fontSize: 14 }}>Dimensional Details</Title>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="length" label="Length (m)">
                                <Input type="number" step="0.01" placeholder="e.g. 2.8" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="width" label="Width (mm)">
                                <Input type="number" placeholder="e.g. 600" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="depth" label="Depth (m)">
                                <Input type="number" step="0.1" placeholder="e.g. 22.5" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>



            {/* Batch Sequence Modal */}
            <Modal
                title="Smart Sequence Generator"
                open={batchModalVisible}
                onOk={() => batchForm.submit()}
                onCancel={() => setBatchModalVisible(false)}
                confirmLoading={loading}
                width={600}
            >
                <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">Quickly generate multiple panels in a numeric sequence (e.g. P1 to P60).</Text>
                </div>
                <Form form={batchForm} layout="vertical" onFinish={handleGenerateBatch} initialValues={{ prefix: 'P', start_no: 1, panel_type: 'Primary' }}>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="prefix" label="Prefix" tooltip="e.g. 'P' for P1, P2...">
                                <Input maxLength={5} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="start_no" label="Start From" rules={[{ required: true }]}>
                                <Input type="number" min={1} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="end_no" label="End At" rules={[{ required: true }]}>
                                <Input type="number" min={1} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="panel_type" label="Standard Panel Type">
                        <Select>
                            <Option value="Primary">Primary (P)</Option>
                            <Option value="Secondary">Secondary (S)</Option>
                            <Option value="Corner">Corner (C)</Option>
                        </Select>
                    </Form.Item>
                    <Divider orientation="left" style={{ fontSize: 13 }}>Standard Dimensions (Auto-filled for all)</Divider>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="length" label="Length (m)">
                                <Input type="number" step="0.01" placeholder="e.g. 2.8" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="width" label="Width (mm)">
                                <Input type="number" placeholder="e.g. 600" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="depth" label="Depth (m)">
                                <Input type="number" step="0.1" placeholder="e.g. 24.5" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </Row>
    )
}

export default ProjectPanels
