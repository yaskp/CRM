import React from 'react';
import dayjs from 'dayjs';

interface DprPrintTemplateProps {
    data: any; // Form values
    project: any;
    items: any[];
    manpower: any[];
    machinery: any[];
    rmcLogs: any[];
    selectedPanels: any[];
}

const DprPrintTemplate: React.FC<DprPrintTemplateProps> = ({
    data,
    project,
    items,
    manpower,
    machinery,
    rmcLogs,
    selectedPanels
}) => {
    const safeManpower = Array.isArray(manpower) ? manpower : [];
    const staff = safeManpower.filter(m => m.is_staff);
    const workers = safeManpower.filter(m => !m.is_staff);
    const safeItems = Array.isArray(items) ? items : [];
    const safeMachinery = Array.isArray(machinery) ? machinery : [];
    const safeRmcLogs = Array.isArray(rmcLogs) ? rmcLogs : [];
    const safeSelectedPanels = Array.isArray(selectedPanels) ? selectedPanels : [];

    // Helper to safely get value
    const val = (v: any) => v || '-';

    return (
        <div className="dpr-print-container" style={{ padding: '20px', fontFamily: '"Times New Roman", Times, serif', fontSize: '10pt', color: '#000' }}>
            {/* ... styles ... */}
            <style>{`
        @media print {
          @page { size: A4; margin: 5mm; }
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .only-print { display: block !important; }
        }
        .print-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .print-table th, .print-table td { border: 1px solid #000; padding: 4px; text-align: left; vertical-align: middle; }
        .print-table .section-header { font-weight: bold; background: #eee; text-align: center; }
        .header-logo { font-size: 24px; font-weight: bold; }
        .header-address { font-size: 10px; text-align: right; }
        .center-text { text-align: center; }
        .bold { font-weight: bold; }
      `}</style>

            {/* ... Header ... */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div className="header-logo">
                    vh shri <span style={{ fontSize: '12px', display: 'block' }}>ENTERPRISE</span>
                </div>
                <div className="header-address">
                    804, RAJHANS BONISTA, B/H RAMCHOWK,<br />
                    GHOD DOD ROAD, SURAT-395 007<br />
                    CONTACT : 0261-2666515, 2666515<br />
                    email : vhshrienterprise@gmail.com<br />
                    www.vhshrienterprise.com
                </div>
            </div>

            <h3 style={{ textAlign: 'center', margin: '5px 0', textTransform: 'uppercase', textDecoration: 'underline' }}>
                DAILY PROGRESS REPORT (DAY SHIFT)
            </h3>

            <table className="print-table">
                <tbody>
                    {/* Project Details */}
                    <tr>
                        <td className="bold" style={{ width: '15%' }}>NAME OF CLIENT :-</td>
                        <td style={{ width: '35%' }}>{project?.client?.name || '-'}</td>
                        <td className="bold" style={{ width: '15%' }}>LOCATION:-</td>
                        <td style={{ width: '35%' }}>{project?.location || '-'}</td>
                    </tr>
                    <tr>
                        <td className="bold">NAME OF PROJECT :-</td>
                        <td>{project?.name || '-'}</td>
                        <td className="bold">DATE:-</td>
                        <td>{data?.transaction_date ? dayjs(data.transaction_date).format('DD-MM-YYYY') : '-'}</td>
                    </tr>

                    {/* Staff Section */}
                    <tr>
                        <td rowSpan={Math.max(3, staff.length + 1)} className="bold center-text">STAFF</td>
                        <td colSpan={3} style={{ padding: 0 }}>
                            {staff.length > 0 ? (
                                staff.map((s, i) => (
                                    <div key={i} style={{ borderBottom: i < staff.length - 1 ? '1px solid #000' : 'none', padding: '4px' }}>
                                        {s.worker_type}: {s.count}
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div style={{ borderBottom: '1px solid #000', height: '24px' }}></div>
                                    <div style={{ borderBottom: '1px solid #000', height: '24px' }}></div>
                                    <div style={{ height: '24px' }}></div>
                                </>
                            )}
                        </td>
                    </tr>

                    {/* Manpower Section */}
                    <tr>
                        <td className="bold center-text" rowSpan={Math.max(workers.length + 2, 4)}>MANPOWER</td>
                        <td colSpan={2} className="bold center-text">STEEL AND SHUTTERING WORK</td>
                        <td className="bold center-text">CONCRETE WORK</td>
                    </tr>
                    {workers.map((w, i) => (
                        <tr key={i}>
                            <td colSpan={2}>{w.worker_type}: {w.count}</td>
                            <td></td> {/* Unknown categorization */}
                        </tr>
                    ))}
                    {[...Array(Math.max(0, 3 - workers.length))].map((_, i) => (
                        <tr key={`empty-worker-${i}`}>
                            <td colSpan={2} style={{ height: '24px' }}></td>
                            <td></td>
                        </tr>
                    ))}

                    {/* Machinery Section */}
                    <tr>
                        <td rowSpan={Math.max(safeMachinery.length + 1, 3)} className="bold center-text">MACHINERY</td>
                        <td colSpan={3} style={{ padding: 0 }}>
                            {safeMachinery.map((m, i) => (
                                <div key={i} style={{ borderBottom: '1px solid #000', padding: '4px' }}>
                                    {m.name}: {m.count} (Hrs: {m.hours || '-'})
                                </div>
                            ))}
                            {[...Array(Math.max(0, 2 - safeMachinery.length))].map((_, i) => (
                                <div key={`empty-mach-${i}`} style={{ borderBottom: i === 1 && safeMachinery.length === 0 ? 'none' : '1px solid #000', height: '24px' }}></div>
                            ))}
                        </td>
                    </tr>

                    {/* Progress Section */}
                    <tr>
                        <td rowSpan={Math.max(safeItems.length + 1, 4)} className="bold center-text">PROGRESS</td>
                        <td colSpan={3} style={{ padding: 0 }}>
                            {safeItems.map((it, i) => (
                                <div key={i} style={{ borderBottom: '1px solid #000', padding: '4px' }}>
                                    {it.material_name || 'Activity'}: {it.work_done_quantity} {it.unit}
                                </div>
                            ))}
                            {[...Array(Math.max(0, 3 - safeItems.length))].map((_, i) => (
                                <div key={`empty-prog-${i}`} style={{ borderBottom: '1px solid #000', height: '24px' }}></div>
                            ))}
                        </td>
                    </tr>

                    {/* Panel Details & RMC - Complex Nested Structure */}
                    {/* We will use a main row with two big cells */}
                    <tr>
                        <td colSpan={4} style={{ padding: 0 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
                                <tbody>
                                    <tr>
                                        {/* Left Side: PANEL DETAILS */}
                                        <td style={{ width: '40%', verticalAlign: 'top', borderRight: '1px solid #000', padding: 0 }}>
                                            <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #000', padding: '4px' }}>PANEL DETAILS</div>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <tbody>
                                                    <tr>
                                                        <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>PANEL IDENTIFIER :-</td>
                                                        <td style={{ borderBottom: '1px solid #000' }}>
                                                            {safeSelectedPanels.length > 0 ? safeSelectedPanels.map(p => p.panel_identifier).join(', ') : '-'}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>PANEL SIZE :-</td>
                                                        <td style={{ borderBottom: '1px solid #000' }}>
                                                            {(() => {
                                                                if (safeSelectedPanels.length === 0) return '-';
                                                                const totalLength = safeSelectedPanels.reduce((s, p) => {
                                                                    let d: any = {};
                                                                    try { d = typeof p.coordinates_json === 'string' ? JSON.parse(p.coordinates_json) : (p.coordinates_json || {}) } catch (e) { }
                                                                    return s + Number(p.length || d.length || 0)
                                                                }, 0);
                                                                const depth = safeSelectedPanels[0]?.depth || '-';
                                                                return `L:${totalLength.toFixed(2)} D:${depth}`;
                                                            })()}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>PANEL WIDTH :-</td>
                                                        <td style={{ borderBottom: '1px solid #000' }}>{safeSelectedPanels[0]?.width || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>GRABBING DEPTH :-</td>
                                                        <td style={{ borderBottom: '1px solid #000' }}>{val(data?.grabbing_depth)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>GRABBING (SQM)</td>
                                                        <td style={{ borderBottom: '1px solid #000' }}>{val(data?.grabbing_sqm)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>GRABBING START TIME :-</td>
                                                        <td style={{ borderBottom: '1px solid #000' }}>{data?.grabbing_start_time ? dayjs(data.grabbing_start_time).format('HH:mm') : '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>GRABBING END TIME :-</td>
                                                        <td style={{ borderBottom: '1px solid #000' }}>{data?.grabbing_end_time ? dayjs(data.grabbing_end_time).format('HH:mm') : '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>CONCRETING DEPTH:-</td>
                                                        <td style={{ borderBottom: '1px solid #000' }}>{val(data?.concreting_depth)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>CONCRETING (SQM)</td>
                                                        <td style={{ borderBottom: '1px solid #000' }}>{val(data?.concreting_sqm)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>CONCRETE START TIME :-</td>
                                                        <td style={{ borderBottom: '1px solid #000' }}>{data?.start_time ? dayjs(data.start_time).format('HH:mm') : '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>CONCRETE COMPLETE TIME:-</td>
                                                        <td style={{ borderBottom: '1px solid #000' }}>{data?.end_time ? dayjs(data.end_time).format('HH:mm') : '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ borderRight: '1px solid #000' }}>CONCRETE GRADE:-</td>
                                                        <td>{val(data?.concrete_grade)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                        {/* Right Side: RMC DETAILS */}
                                        <td style={{ width: '60%', verticalAlign: 'top', padding: 0 }}>
                                            <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #000', padding: '4px' }}>RMC DETAILS</div>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ background: '#eee' }}>
                                                        <th style={{ fontSize: '9px', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>SR.<br />NO.</th>
                                                        <th style={{ fontSize: '9px', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>VEHICLE NO.</th>
                                                        <th style={{ fontSize: '9px', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>QTY<br />(CUM)</th>
                                                        <th style={{ fontSize: '9px', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>SLUMP</th>
                                                        <th style={{ fontSize: '9px', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>IN TIME</th>
                                                        <th style={{ fontSize: '9px', borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>START TIME</th>
                                                        <th style={{ fontSize: '9px', borderBottom: '1px solid #000' }}>OUT TIME</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(safeRmcLogs.length > 0 ? safeRmcLogs : [...Array(10)]).map((log, i) => (
                                                        <tr key={i} style={{ height: '20px' }}>
                                                            <td style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', textAlign: 'center' }}>{i + 1}</td>
                                                            <td style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>{log?.vehicle_no || ''}</td>
                                                            <td style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>{log?.quantity || ''}</td>
                                                            <td style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>{log?.slump || ''}</td>
                                                            <td style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>{log?.in_time ? dayjs(log.in_time, 'HH:mm').format('HH:mm') : ''}</td>
                                                            <td style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>{log?.start_time ? dayjs(log.start_time, 'HH:mm').format('HH:mm') : ''}</td>
                                                            <td style={{ borderBottom: '1px solid #000' }}>{log?.out_time ? dayjs(log.out_time, 'HH:mm').format('HH:mm') : ''}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    {/* Remarks */}
                    <tr>
                        <td className="bold center-text" style={{ width: '15%' }}>REMARKS</td>
                        <td colSpan={3} style={{ height: '50px', verticalAlign: 'top' }}>
                            {data?.remarks}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Footer Signatures */}
            <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 20px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold' }}>VH SHRI ENTERPRISE</div>
                    <div style={{ marginTop: '30px', borderTop: '1px solid #000', paddingTop: '5px' }}>(ENGINEERS SIGNATURE)</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold' }}>CLIENT</div>
                    <div style={{ marginTop: '30px', borderTop: '1px solid #000', paddingTop: '5px' }}>(ENGINEERS SIGNATURE)</div>
                </div>
            </div>

        </div>
    );
};

export default DprPrintTemplate;
