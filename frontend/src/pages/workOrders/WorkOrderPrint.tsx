import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Spin, Typography, Table, Row, Col, Divider, Space, Button } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import { workOrderService } from '../../services/api/workOrders'
import { projectService } from '../../services/api/projects'
import { vendorService } from '../../services/api/vendors'
import { clientService } from '../../services/api/clients'

const { Title, Text, Paragraph } = Typography

const WorkOrderPrint = () => {
    const { id } = useParams<{ id: string }>()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        fetchData()
    }, [id])

    const fetchData = async () => {
        try {
            const woResponse = await workOrderService.getWorkOrder(Number(id))
            const wo = woResponse.workOrder

            const projectResponse = await projectService.getProject(wo.project_id)
            const project = projectResponse.project

            let vendor = null
            if (wo.vendor_id) {
                const vendorResponse = await vendorService.getVendorById(wo.vendor_id)
                vendor = vendorResponse.vendor
            }

            // Fetch client if project has one
            let client = null
            if (project.client_id) {
                const clientRes = await clientService.getClient(project.client_id)
                client = clientRes.client
            }

            setData({ wo, project, vendor, client })
            setLoading(false)

            // Auto print after small delay to ensure render
            setTimeout(() => {
                window.print()
            }, 1000)

        } catch (error) {
            console.error('Failed to fetch data', error)
            setLoading(false)
        }
    }

    if (loading) return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" /></div>
    if (!data) return <div>Failed to load data</div>

    const { wo, project, vendor, client } = data

    const styles = {
        page: { padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
        header: { marginBottom: 30, borderBottom: '2px solid #333', paddingBottom: 20 },
        row: { marginBottom: 15 },
        label: { fontWeight: 'bold' as const, display: 'inline-block', width: '150px' },
        sectionTitle: { marginTop: 30, marginBottom: 15, borderBottom: '1px solid #ddd', paddingBottom: 5, fontSize: '18px', fontWeight: 'bold' as const },
        tableHeader: { background: '#f5f5f5', fontWeight: 'bold' as const },
        signatureBox: { marginTop: 80, borderTop: '1px solid #333', paddingTop: 10, width: '200px', textAlign: 'center' as const }
    }

    const columns = [
        { title: 'S.No', key: 'index', render: (_: any, __: any, index: number) => index + 1, width: 60 },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 100 },
        { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 100, align: 'right' as const },
        { title: 'Rate', dataIndex: 'rate', key: 'rate', width: 120, align: 'right' as const, render: (val: number) => `₹${Number(val).toLocaleString('en-IN')}` },
        { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 150, align: 'right' as const, render: (val: number) => `₹${Number(val).toLocaleString('en-IN')}` },
    ]

    return (
        <div className="print-page" style={{ background: 'white', minHeight: '100vh' }}>
            <div style={styles.page}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', ...styles.header }}>
                    <div>
                        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>VHSHRI</Title>
                        <Text>Construction & Engineering</Text><br />
                        <Text type="secondary">123, Business Park, Mumbai, India</Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <Title level={3} style={{ margin: 0 }}>WORK ORDER</Title>
                        <Text strong>#{wo.work_order_number}</Text><br />
                        <Text>Date: {new Date(wo.created_at || new Date()).toLocaleDateString()}</Text>
                    </div>
                </div>

                {/* Info Grid */}
                <Row gutter={24}>
                    <Col span={12}>
                        <div style={styles.sectionTitle}>To: {vendor ? 'Subcontractor / Vendor' : 'Project Team'}</div>
                        {vendor ? (
                            <>
                                <Text strong style={{ fontSize: 16 }}>{vendor.name}</Text><br />
                                <Text>{vendor.address}</Text><br />
                                <Text>GSTIN: {vendor.gstin_number || 'N/A'}</Text><br />
                                <Text>Contact: {vendor.phone}</Text>
                            </>
                        ) : (
                            <Text>Internal Execution Team</Text>
                        )}
                    </Col>
                    <Col span={12}>
                        <div style={styles.sectionTitle}>Project Details</div>
                        <div style={styles.row}><span style={styles.label}>Project Name:</span> {project.name}</div>
                        <div style={styles.row}><span style={styles.label}>Location:</span> {project.location}, {project.city}</div>
                        {client && <div style={styles.row}><span style={styles.label}>Client:</span> {client.company_name}</div>}
                        <div style={styles.row}><span style={styles.label}>Project Code:</span> {project.project_code}</div>
                    </Col>
                </Row>

                {/* Item Table */}
                <div style={{ marginTop: 30 }}>
                    <Table
                        dataSource={wo.items}
                        columns={columns}
                        pagination={false}
                        bordered
                        summary={() => (
                            <Table.Summary>
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={5} align="right"><Text strong>Sub Total</Text></Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} align="right"><Text>₹{Number(wo.total_amount).toLocaleString('en-IN')}</Text></Table.Summary.Cell>
                                </Table.Summary.Row>
                                {Number(wo.discount_percentage) > 0 && (
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={5} align="right"><Text>Less: Discount ({wo.discount_percentage}%)</Text></Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} align="right"><Text type="danger">- ₹{(Number(wo.total_amount) - Number(wo.final_amount)).toLocaleString('en-IN')}</Text></Table.Summary.Cell>
                                    </Table.Summary.Row>
                                )}
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={5} align="right"><Title level={5} style={{ margin: 0 }}>Grand Total</Title></Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} align="right"><Title level={5} style={{ margin: 0 }}>₹{Number(wo.final_amount).toLocaleString('en-IN')}</Title></Table.Summary.Cell>
                                </Table.Summary.Row>
                            </Table.Summary>
                        )}
                    />
                </div>

                {/* Terms */}
                <div style={{ marginTop: 20 }}>
                    {wo.client_scope && (
                        <>
                            <div style={styles.sectionTitle}>Client Scope</div>
                            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{wo.client_scope}</Paragraph>
                        </>
                    )}

                    {wo.contractor_scope && (
                        <>
                            <div style={styles.sectionTitle}>Contractor (VHSHRI) Scope</div>
                            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{wo.contractor_scope}</Paragraph>
                        </>
                    )}

                    {wo.payment_terms && (
                        <>
                            <div style={styles.sectionTitle}>Payment Terms</div>
                            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{wo.payment_terms}</Paragraph>
                        </>
                    )}

                    {wo.terms_conditions && (
                        <>
                            <div style={styles.sectionTitle}>Terms & Conditions</div>
                            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{wo.terms_conditions}</Paragraph>
                        </>
                    )}
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 100 }}>
                    <div style={styles.signatureBox}>
                        <Text strong>Authorized Signatory</Text><br />
                        <Text type="secondary">VHSHRI</Text>
                    </div>

                    <div style={styles.signatureBox}>
                        <Text strong>Accepted By</Text><br />
                        <Text type="secondary">{vendor ? vendor.name : 'Internal Team'}</Text>
                    </div>
                </div>

                {/* Print Button (Hidden in Print) */}
                <div className="no-print" style={{ position: 'fixed', top: 20, right: 20 }}>
                    <Button type="primary" icon={<PrinterOutlined />} size="large" onClick={() => window.print()}>Print / Download PDF</Button>
                </div>
                <style>{`
            @media print {
                .no-print { display: none !important; }
                .print-page { padding: 0 !important; }
            }
        `}</style>
            </div>
        </div>
    )
}

export default WorkOrderPrint
