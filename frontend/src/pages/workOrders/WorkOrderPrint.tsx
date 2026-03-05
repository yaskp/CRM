import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Spin, Table, Button } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import { workOrderService } from '../../services/api/workOrders'
import { projectService } from '../../services/api/projects'
import { vendorService } from '../../services/api/vendors'
import { clientService } from '../../services/api/clients'


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

            let client = null
            if (project.client_id) {
                const clientRes = await clientService.getClient(project.client_id)
                client = clientRes.client
            }

            setData({ wo, project, vendor, client })
            setLoading(false)

            // Auto print after render
            setTimeout(() => { window.print() }, 1000)

        } catch (error) {
            console.error('Failed to fetch data', error)
            setLoading(false)
        }
    }

    if (loading) return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" /></div>
    if (!data) return <div>Failed to load data</div>

    const { wo, project, vendor, client } = data

    // The "To" party: vendor if sub-contractor WO, otherwise VH SHRI Enterprise (internal)
    const toParty = vendor ? vendor : { name: 'VH SHRI Enterprise', address: 'B-104, Rajhans Bonista, B/H Ramchowk, Ghod Dod Road, Surat-395007' }

    const styles = {
        page: { padding: '40px 48px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial, sans-serif', fontSize: 13 },
        title: { textAlign: 'center' as const, marginBottom: 2, fontSize: 22, fontWeight: 'bold', color: '#1a1a2e', letterSpacing: 2 },
        subtitle: { textAlign: 'center' as const, fontSize: 11, color: '#555', marginBottom: 12 },
        divider: { borderTop: '2px solid #1a1a2e', margin: '10px 0 18px' },
        infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', marginBottom: 16, fontSize: 12 },
        infoLabel: { fontWeight: 'bold', color: '#1a1a2e' },
        sectionTitle: { marginTop: 20, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #1a1a2e', fontSize: 13, fontWeight: 'bold', color: '#1a1a2e', textTransform: 'uppercase' as const },
        tableHeader: { background: '#2d3748', color: 'white', fontWeight: 'bold' as const },
        signatureSection: { marginTop: 70, display: 'flex', justifyContent: 'space-between' },
        signatureBox: { textAlign: 'center' as const, width: 200 },
        signatureLine: { borderTop: '1px solid #333', marginBottom: 6, paddingTop: 2 },
    }

    const columns = [
        { title: 'S.No', key: 'index', render: (_: any, __: any, index: number) => index + 1, width: 55 },
        { title: 'Description of Work', dataIndex: 'description', key: 'description' },
        { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 70 },
        { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'right' as const, render: (v: number) => Number(v).toFixed(2) },
        { title: 'Rate (₹)', dataIndex: 'rate', key: 'rate', width: 100, align: 'right' as const, render: (v: number) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 }) },
        { title: 'Amount (₹)', dataIndex: 'amount', key: 'amount', width: 120, align: 'right' as const, render: (v: number) => <strong>₹{Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> },
    ]

    const materialItems = (wo.items || []).filter((i: any) => i.category === 'material')
    const labourItems = (wo.items || []).filter((i: any) => i.category !== 'material')
    const subTotal = (wo.items || []).reduce((sum: number, i: any) => sum + Number(i.amount), 0)
    const discount = Number(wo.discount_percentage) > 0 ? (subTotal * Number(wo.discount_percentage)) / 100 : 0
    const grandTotal = subTotal - discount

    const renderSection = (title: string, content: string) => {
        if (!content) return null
        const lines = content.split('\n').filter(l => l.trim().length > 0)
        return (
            <div style={{ marginTop: 16 }}>
                <div style={styles.sectionTitle}>{title}</div>
                {lines.map((line, i) => (
                    <div key={i} style={{ fontSize: 12, marginBottom: 3, paddingLeft: 8 }}>
                        {i + 1}. {line.trim()}
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="print-page" style={{ background: 'white', minHeight: '100vh' }}>
            <div style={styles.page}>

                {/* ─── TITLE BLOCK — No company branding, printed on client letterhead ─── */}
                <div style={styles.title}>WORK ORDER</div>
                <div style={styles.subtitle}>(To be signed and returned by Client / Contractor)</div>
                <div style={styles.divider} />

                {/* ─── WO INFO GRID ─── */}
                <div style={styles.infoGrid}>
                    <div><span style={styles.infoLabel}>Work Order No.:</span> {wo.work_order_number}</div>
                    <div><span style={styles.infoLabel}>Project:</span> {project.name}</div>
                    <div><span style={styles.infoLabel}>Date:</span> {new Date(wo.created_at || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <div><span style={styles.infoLabel}>Project Code:</span> {project.project_code}</div>
                    <div><span style={styles.infoLabel}>Status:</span> {(wo.status || 'draft').toUpperCase()}</div>
                    {client && <div><span style={styles.infoLabel}>Client:</span> {client.company_name}</div>}
                    <div style={{ gridColumn: '1/-1' }}>
                        <span style={styles.infoLabel}>To:</span>&nbsp;
                        {toParty.name}
                        {toParty.address && <span style={{ color: '#555', marginLeft: 8 }}>— {toParty.address}</span>}
                        {vendor?.gstin_number && <span style={{ color: '#555', marginLeft: 8 }}>| GSTIN: {vendor.gstin_number}</span>}
                    </div>
                </div>

                <div style={{ fontSize: 12, marginBottom: 16 }}>
                    <strong>Subject:</strong> Work Order for Project: {project.name} {project.location && `— ${project.location}`}
                </div>

                <div style={{ borderTop: '1px solid #ccc', marginBottom: 12 }} />

                {/* ─── ITEMS TABLE ─── */}
                {labourItems.length > 0 && (
                    <>
                        <div style={{ ...styles.sectionTitle, marginTop: 8 }}>Scope of Work</div>
                        <Table
                            dataSource={labourItems}
                            columns={columns}
                            pagination={false}
                            bordered
                            size="small"
                            rowKey="id"
                        />
                    </>
                )}

                {materialItems.length > 0 && (
                    <>
                        <div style={{ ...styles.sectionTitle, marginTop: 16 }}>Material Items</div>
                        <Table
                            dataSource={materialItems}
                            columns={columns}
                            pagination={false}
                            bordered
                            size="small"
                            rowKey="id"
                        />
                    </>
                )}

                {/* ─── SUMMARY ─── */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <table style={{ fontSize: 12, borderCollapse: 'collapse', minWidth: 260 }}>
                        <tbody>
                            {labourItems.length > 0 && (
                                <tr>
                                    <td style={{ padding: '3px 16px 3px 8px', color: '#555' }}>A. Labour / Work Cost</td>
                                    <td style={{ textAlign: 'right', padding: '3px 4px' }}>₹{labourItems.reduce((s: number, i: any) => s + Number(i.amount), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            )}
                            {materialItems.length > 0 && (
                                <tr>
                                    <td style={{ padding: '3px 16px 3px 8px', color: '#555' }}>B. Material Cost</td>
                                    <td style={{ textAlign: 'right', padding: '3px 4px' }}>₹{materialItems.reduce((s: number, i: any) => s + Number(i.amount), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            )}
                            {discount > 0 && (
                                <tr>
                                    <td style={{ padding: '3px 16px 3px 8px', color: '#e53e3e' }}>Discount ({wo.discount_percentage}%)</td>
                                    <td style={{ textAlign: 'right', padding: '3px 4px', color: '#e53e3e' }}>- ₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            )}
                            <tr style={{ background: '#edf2f7', fontWeight: 'bold', fontSize: 13 }}>
                                <td style={{ padding: '6px 16px 6px 8px', borderTop: '2px solid #1a1a2e' }}>GRAND TOTAL</td>
                                <td style={{ textAlign: 'right', padding: '6px 4px', borderTop: '2px solid #1a1a2e' }}>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 4, textAlign: 'right' }}>* All taxes / GST will be charged extra as applicable</div>

                {/* ─── SCOPE & TERMS SECTIONS ─── */}
                {renderSection('Client Scope of Work', wo.client_scope)}
                {renderSection('Contractor Scope of Work', wo.contractor_scope)}
                {renderSection('Payment Terms', wo.payment_terms)}
                {renderSection('Terms & Conditions', wo.terms_conditions)}
                {wo.remarks && renderSection('Remarks', wo.remarks)}

                {/* ─── SIGNATURE BLOCKS ─── */}
                <div style={styles.signatureSection}>
                    <div style={styles.signatureBox}>
                        <div style={{ height: 50 }} />
                        <div style={styles.signatureLine} />
                        <strong>Authorized Signatory (Client)</strong>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{client?.company_name || 'Client'}</div>
                        <div style={{ fontSize: 10, color: '#999', marginTop: 8 }}>Date: _______________</div>
                    </div>

                    <div style={styles.signatureBox}>
                        <div style={{ height: 50 }} />
                        <div style={styles.signatureLine} />
                        <strong>Acknowledged & Accepted By</strong>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{vendor ? vendor.name : 'VH SHRI Enterprise'}</div>
                        <div style={{ fontSize: 10, color: '#999', marginTop: 8 }}>Date: _______________</div>
                    </div>
                </div>

            </div>

            {/* ─── Print Button (hidden on print) ─── */}
            <div className="no-print" style={{ position: 'fixed', top: 20, right: 20, display: 'flex', gap: 8 }}>
                <Button type="primary" icon={<PrinterOutlined />} size="large" onClick={() => window.print()}>
                    Print / Save as PDF
                </Button>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-page { padding: 0 !important; }
                    body { margin: 0; }
                }
                @page { margin: 12mm; }
            `}</style>
        </div>
    )
}

export default WorkOrderPrint
