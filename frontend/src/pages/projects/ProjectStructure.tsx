import { useState, useEffect } from 'react'
import { Tree, Card, Button, Modal, Form, Input, Select, Space, Typography, Tag, Divider, message, Empty, Row, Col } from 'antd'
import type { TreeDataNode } from 'antd'
import {
    PlusOutlined,
    HomeOutlined,
    ApartmentOutlined,
    BlockOutlined,
    EnvironmentOutlined
} from '@ant-design/icons'
import { projectHierarchyService, ProjectBuilding } from '../../services/api/projectHierarchy'
import { workItemTypeService } from '../../services/api/workItemTypes'
import { theme } from '../../styles/theme'

const { Text, Title } = Typography

interface ProjectStructureProps {
    projectId: number
    initialHierarchy: ProjectBuilding[]
    onUpdate: () => void
}

const ProjectStructure = ({ projectId, initialHierarchy, onUpdate }: ProjectStructureProps) => {
    const [modalVisible, setModalVisible] = useState(false)
    const [modalType, setModalType] = useState<'building' | 'floor' | 'zone'>('building')
    const [parentId, setParentId] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [workItemTypes, setWorkItemTypes] = useState<any[]>([])
    const [form] = Form.useForm()

    useEffect(() => {
        fetchWorkItemTypes()
    }, [])

    const fetchWorkItemTypes = async () => {
        try {
            const res = await workItemTypeService.getWorkItemTypes()
            // Backend returns { success: true, data: [...] }
            setWorkItemTypes(res.data || res.workItemTypes || [])
        } catch (e) {
            console.error("Failed to fetch work item types", e)
        }
    }

    const openModal = (type: 'building' | 'floor' | 'zone', parent?: number) => {
        setModalType(type)
        setParentId(parent || null)
        form.resetFields()
        setModalVisible(true)
    }

    const handleSave = async (values: any) => {
        setLoading(true)
        try {
            if (modalType === 'building') {
                await projectHierarchyService.createBuilding({ ...values, project_id: projectId })
                message.success('Building added successfully')
            } else if (modalType === 'floor') {
                await projectHierarchyService.createFloor({ ...values, building_id: parentId! })
                message.success('Floor added successfully')
            } else if (modalType === 'zone') {
                await projectHierarchyService.createZone({ ...values, floor_id: parentId! })
                message.success('Zone/Flat added successfully')
            }
            onUpdate()
            setModalVisible(false)
        } catch (error) {
            message.error('Failed to save')
        } finally {
            setLoading(false)
        }
    }

    const renderTreeNodes = (data: any[]): TreeDataNode[] => {
        return data.map((item) => {
            const isBuilding = !!item.floors
            const isFloor = !!item.zones

            let icon = <HomeOutlined />
            let extra: any = null

            if (isBuilding) {
                icon = <ApartmentOutlined style={{ color: theme.colors.primary.main }} />
                extra = (
                    <Button
                        type="text"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={(e) => { e.stopPropagation(); openModal('floor', item.id); }}
                    >
                        Add Floor
                    </Button>
                )
            } else if (isFloor) {
                icon = <BlockOutlined style={{ color: '#52c41a' }} />
                extra = (
                    <Button
                        type="text"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={(e) => { e.stopPropagation(); openModal('zone', item.id); }}
                    >
                        Add Zone/Flat
                    </Button>
                )
            } else {
                icon = <EnvironmentOutlined style={{ color: '#faad14' }} />
            }

            return {
                title: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: '400px' }}>
                        <Space>
                            {icon}
                            <Text strong={isBuilding}>{item.name}</Text>
                            {item.building_code && <Tag>{item.building_code}</Tag>}
                            {item.floor_type && <Tag color="blue">{item.floor_type}</Tag>}
                            {item.zone_type && <Tag color="orange">{item.zone_type}</Tag>}
                            {item.workItemType && (
                                <Tag color="geekblue">
                                    {item.workItemType.name}
                                    {item.workItemType.uom ? ` (${item.workItemType.uom})` : ''}
                                </Tag>
                            )}
                        </Space>
                        {extra}
                    </div>
                ),
                key: `${isBuilding ? 'B' : isFloor ? 'F' : 'Z'}-${item.id}`,
                children: isBuilding ? renderTreeNodes(item.floors) : isFloor ? renderTreeNodes(item.zones) : undefined
            }
        })
    }

    const treeData = renderTreeNodes(initialHierarchy)

    return (
        <Card title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>Project Physical Structure</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('building')}>
                    Add Building
                </Button>
            </div>
        }>
            <Text type="secondary">Define towers, floors, and specific flats or areas for precise progress and inventory tracking.</Text>
            <Divider />

            {treeData.length > 0 ? (
                <Tree
                    showLine={{ showLeafIcon: false }}
                    showIcon={false}
                    defaultExpandAll
                    selectable={false}
                    treeData={treeData}
                    style={{ padding: '16px', background: 'transparent' }}
                />
            ) : (
                <Empty description="No structure defined yet. Start by adding a tower or building." style={{ padding: '40px' }} />
            )}

            <Modal
                title={`Add New ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`}
                open={modalVisible}
                onOk={() => form.submit()}
                onCancel={() => setModalVisible(false)}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter a name' }]}>
                        <Input placeholder={`e.g. ${modalType === 'building' ? 'Tower A' : modalType === 'floor' ? 'Floor 1' : 'Flat 101'}`} />
                    </Form.Item>

                    {modalType === 'building' && (
                        <>
                            <Form.Item name="building_code" label="Building Code">
                                <Input placeholder="e.g. Block-A" />
                            </Form.Item>

                            <Form.Item name="work_item_type_id" label="Linked Work Type (Structure)" tooltip="If this entire building represents a specific work item (e.g. Boundary Wall)">
                                <Select
                                    placeholder="Select structural type"
                                    allowClear
                                    showSearch
                                    optionFilterProp="children"
                                >
                                    {workItemTypes.map(type => (
                                        <Select.Option key={type.id} value={type.id}>
                                            {type.name} {type.uom ? `(${type.uom})` : ''}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </>
                    )}

                    {modalType === 'floor' && (
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="floor_number" label="Floor Number">
                                    <Input type="number" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="floor_type" label="Type" initialValue="typical">
                                    <Select>
                                        <Select.Option value="basement">Basement</Select.Option>
                                        <Select.Option value="ground">Ground</Select.Option>
                                        <Select.Option value="parking">Parking</Select.Option>
                                        <Select.Option value="typical">Typical Floor</Select.Option>
                                        <Select.Option value="terrace">Terrace</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    )}

                    {modalType === 'zone' && (
                        <>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="zone_type" label="Zone Type" initialValue="flat">
                                        <Select>
                                            <Select.Option value="flat">Residential Flat</Select.Option>
                                            <Select.Option value="office">Office Space</Select.Option>
                                            <Select.Option value="shop">Commercial Shop</Select.Option>
                                            <Select.Option value="common_area">Common Area</Select.Option>
                                            <Select.Option value="parking_slot">Parking Slot</Select.Option>
                                            <Select.Option value="other">Other</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="area_sqft" label="Area (Sq. Ft.)">
                                        <Input type="number" step="0.01" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item name="work_item_type_id" label="Linked Work Type (Structure)" tooltip="Define if this zone represents a specific structural element like a Wall">
                                        <Select
                                            placeholder="Select structural type e.g. 600mm Wall"
                                            allowClear
                                            showSearch
                                            optionFilterProp="children"
                                        >
                                            {workItemTypes.map(type => (
                                                <Select.Option key={type.id} value={type.id}>
                                                    {type.name} {type.uom ? `(${type.uom})` : ''}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </>
                    )}
                </Form>
            </Modal>
        </Card>
    )
}

export default ProjectStructure
