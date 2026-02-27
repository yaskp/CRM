import { useId } from 'react'

interface DWallDimensionDiagramProps {
    highlight?: 'L' | 'W' | 'D' | null
}

const DWallDimensionDiagram = ({ highlight }: DWallDimensionDiagramProps) => {
    const id = useId().replace(/:/g, '')

    // Oblique projection: 35°, 55% foreshortening
    const CF = 0.451, SF = 0.316

    // Panel + earth dimensions
    const bL = 112, bW = 48, bD = 116, eT = 14  // panel: length, thickness, depth, guide-wall height
    const eL = 44, eR = 40                         // earth columns left/right of panel (wider = clearly soil)
    const OX = 68, OY = 59                         // front-top-left anchor in SVG

    const sc = (x: number, y: number, z: number) => ({
        px: +(OX + x + z * CF).toFixed(1),
        py: +(OY + y - z * SF).toFixed(1),
    })
    const pt = (v: { px: number; py: number }) => `${v.px},${v.py}`

    // Panel vertices
    const P = {
        ftl: sc(0, -eT, 0), ftr: sc(bL, -eT, 0),
        fbl: sc(0, bD, 0), fbr: sc(bL, bD, 0),
        btl: sc(0, -eT, bW), btr: sc(bL, -eT, bW),
        bbl: sc(0, bD, bW), bbr: sc(bL, bD, bW),
        gfl: sc(0, 0, 0), gfr: sc(bL, 0, 0),   // ground‑level line front
        gbl: sc(0, 0, bW), gbr: sc(bL, 0, bW),  // ground‑level line back
    }

    // Left earth column vertices (x: -eL … 0, same y & z range as panel)
    const LE = {
        ftl: sc(-eL, -eT, 0), ftr: P.ftl,
        fbl: sc(-eL, bD, 0), fbr: P.fbl,
        btl: sc(-eL, -eT, bW), btr: P.btl,
    }

    // Right earth column vertices (x: bL … bL+eR)
    const RE = {
        ftl: P.ftr, ftr: sc(bL + eR, -eT, 0),
        fbl: P.fbr, fbr: sc(bL + eR, bD, 0),
        btl: P.btr, btr: sc(bL + eR, -eT, bW),
        bbl: P.bbr, bbr: sc(bL + eR, bD, bW),
    }

    // Colour helpers
    const ac = (d: 'L' | 'W' | 'D') => highlight === d ? '#f59e0b' : '#16a34a'
    const tc = (d: 'L' | 'W' | 'D') => highlight === d ? '#78350f' : '#14532d'
    const sw = (d: 'L' | 'W' | 'D') => highlight === d ? 2.6 : 2.0
    const mE = (d: 'L' | 'W' | 'D') => highlight === d ? `mAE-${id}` : `mGE-${id}`
    const mS = (d: 'L' | 'W' | 'D') => highlight === d ? `mAS-${id}` : `mGS-${id}`
    const px90 = -SF / Math.sqrt(CF * CF + SF * SF) * 1   // perp to oblique axis
    const py90 = -CF / Math.sqrt(CF * CF + SF * SF) * 1

    return (
        <svg viewBox="0 0 348 236" width="100%" height="100%"
            style={{ maxHeight: 192, display: 'block' }} xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id={`gP-${id}`} x1="0" y1="0" x2="0.12" y2="1">
                    <stop offset="0%" stopColor="#dde2ea" /><stop offset="100%" stopColor="#b4bcc8" />
                </linearGradient>
                <linearGradient id={`gPUG-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#bec5d0" /><stop offset="100%" stopColor="#a5adb9" />
                </linearGradient>
                <linearGradient id={`gPT-${id}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#cdd2db" /><stop offset="100%" stopColor="#dde2ea" />
                </linearGradient>
                <linearGradient id={`gPR-${id}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#78889c" /><stop offset="100%" stopColor="#59697c" />
                </linearGradient>
                <linearGradient id={`gEF-${id}`} x1="0" y1="0" x2="0.05" y2="1">
                    <stop offset="0%" stopColor="#e8d07c" /><stop offset="100%" stopColor="#c8a048" />
                </linearGradient>
                <linearGradient id={`gET-${id}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ddc06a" /><stop offset="100%" stopColor="#e8d07c" />
                </linearGradient>
                <linearGradient id={`gER-${id}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#b89040" /><stop offset="100%" stopColor="#d4b060" />
                </linearGradient>
                <linearGradient id={`gSpec-${id}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="white" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                {(['G', 'A'] as const).map(k => {
                    const fill = k === 'G' ? '#16a34a' : '#f59e0b'
                    return [
                        <marker key={k + 'E'} id={`m${k}E-${id}`} markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto">
                            <path d="M0,1 L0,7 L7,4 z" fill={fill} />
                        </marker>,
                        <marker key={k + 'S'} id={`m${k}S-${id}`} markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto-start-reverse">
                            <path d="M0,1 L0,7 L7,4 z" fill={fill} />
                        </marker>,
                    ]
                })}
            </defs>

            {/* ── DRAWING ORDER: back → front ─────────────────────────────── */}

            {/* 1. Right‑earth RIGHT face (furthest back, visible from right angle) */}
            <polygon points={[RE.ftr, RE.btr, RE.bbr, RE.fbr].map(pt).join(' ')}
                fill={`url(#gER-${id})`} stroke="#8c6830" strokeWidth={0.7} />

            {/* 2. Right‑earth TOP face */}
            <polygon points={[RE.ftl, RE.ftr, RE.btr, RE.btl].map(pt).join(' ')}
                fill={`url(#gET-${id})`} stroke="#8c6830" strokeWidth={0.7} />

            {/* 3. Left‑earth TOP face */}
            <polygon points={[LE.ftl, LE.ftr, LE.btr, LE.btl].map(pt).join(' ')}
                fill={`url(#gET-${id})`} stroke="#8c6830" strokeWidth={0.7} />

            {/* 4. Panel RIGHT face (shows wall thickness W) */}
            <polygon points={[P.ftr, P.btr, P.bbr, P.fbr].map(pt).join(' ')}
                fill={`url(#gPR-${id})`} stroke="#3d4f63" strokeWidth={0.8} />

            {/* 5. Panel TOP face (guide‑wall top) */}
            <polygon points={[P.ftl, P.ftr, P.btr, P.btl].map(pt).join(' ')}
                fill={`url(#gPT-${id})`} stroke="#3d4f63" strokeWidth={0.8} />
            <line x1={P.ftl.px} y1={P.ftl.py} x2={P.ftr.px} y2={P.ftr.py}
                stroke="white" strokeWidth={1.2} opacity={0.5} />

            {/* 6. Left-earth FRONT face — clearly sandy soil  */}
            <polygon points={[LE.ftl, LE.ftr, LE.fbr, LE.fbl].map(pt).join(' ')}
                fill={`url(#gEF-${id})`} stroke="#9a7820" strokeWidth={1} />
            {/* Soil strata lines */}
            {[0.1, 0.22, 0.34, 0.46, 0.58, 0.70, 0.82, 0.94].map(t => (
                <line key={t}
                    x1={LE.ftl.px + 2} y1={LE.ftl.py + t * (bD + eT)}
                    x2={LE.ftr.px - 2} y2={LE.ftl.py + t * (bD + eT)}
                    stroke="#9a7820" strokeWidth={0.7} strokeDasharray="3,2" opacity={0.55} />
            ))}
            {/* 'SOIL' label on left earth face */}
            <text
                x={(LE.ftl.px + LE.ftr.px) / 2}
                y={(LE.ftl.py + LE.fbl.py) / 2 - 4}
                textAnchor="middle" fontSize={8.5} fontWeight={700}
                fill="#7a5c10" fontFamily="sans-serif" opacity={0.75}>SOIL</text>

            {/* 7. Panel FRONT face — guide‑wall zone (above GL) */}
            <polygon points={[P.ftl, P.ftr, P.gfr, P.gfl].map(pt).join(' ')}
                fill={`url(#gP-${id})`} stroke="none" />
            {/* 8. Panel FRONT face — underground zone (below GL) */}
            <polygon points={[P.gfl, P.gfr, P.fbr, P.fbl].map(pt).join(' ')}
                fill={`url(#gPUG-${id})`} stroke="none" />
            {/* Front face outline + specular */}
            <polygon points={[P.ftl, P.ftr, P.fbr, P.fbl].map(pt).join(' ')}
                fill="none" stroke="#3d4f63" strokeWidth={1.3} />
            <polygon points={[P.ftl, P.ftr, P.fbr, P.fbl].map(pt).join(' ')}
                fill={`url(#gSpec-${id})`} />
            <line x1={P.ftl.px} y1={P.ftl.py} x2={P.fbl.px} y2={P.fbl.py}
                stroke="white" strokeWidth={1.3} opacity={0.4} />

            {/* Rebar grid */}
            {[0.15, 0.3, 0.46, 0.62, 0.78, 0.92].map(t => (
                <line key={t} x1={P.ftl.px} y1={P.ftl.py + t * (bD + eT)}
                    x2={P.ftr.px} y2={P.ftl.py + t * (bD + eT)}
                    stroke="#8896aa" strokeWidth={0.4} strokeDasharray="6,5" opacity={0.5} />
            ))}
            {[0.2, 0.4, 0.6, 0.8].map(t => (
                <line key={t} x1={P.ftl.px + t * bL} y1={P.ftl.py}
                    x2={P.ftl.px + t * bL} y2={P.fbl.py}
                    stroke="#8896aa" strokeWidth={0.4} strokeDasharray="6,5" opacity={0.5} />
            ))}

            {/* 9. Right-earth FRONT face — same sandy soil */}
            <polygon points={[RE.ftl, RE.ftr, RE.fbr, RE.fbl].map(pt).join(' ')}
                fill={`url(#gEF-${id})`} stroke="#9a7820" strokeWidth={1} />
            {[0.1, 0.22, 0.34, 0.46, 0.58, 0.70, 0.82, 0.94].map(t => (
                <line key={t}
                    x1={RE.ftl.px + 2} y1={RE.ftl.py + t * (bD + eT)}
                    x2={RE.ftr.px - 2} y2={RE.ftl.py + t * (bD + eT)}
                    stroke="#9a7820" strokeWidth={0.7} strokeDasharray="3,2" opacity={0.55} />
            ))}
            <text
                x={(RE.ftl.px + RE.ftr.px) / 2}
                y={(RE.ftl.py + RE.fbl.py) / 2 - 4}
                textAnchor="middle" fontSize={8.5} fontWeight={700}
                fill="#7a5c10" fontFamily="sans-serif" opacity={0.75}>SOIL</text>

            {/* Ground‑level dashed line */}
            <line x1={LE.fbl.px - 2} y1={P.gfl.py} x2={RE.fbr.px + 2} y2={P.gfr.py}
                stroke="#7a5c28" strokeWidth={1.1} strokeDasharray="5,3" opacity={0.65} />
            <text x={LE.fbl.px - 4} y={P.gfl.py + 3.5} textAnchor="end"
                fontSize={7} fill="#7a5c28" fontFamily="sans-serif">GL</text>

            {/* Guide‑wall label */}
            <text x={(P.ftl.px + P.ftr.px) / 2} y={P.ftl.py - 7}
                textAnchor="middle" fontSize={7.5} fill="#475569"
                fontStyle="italic" fontFamily="sans-serif">guide wall / top RL</text>

            {/* ════ DIMENSION ARROWS ════ */}

            {/* L — below the panel bottom */}
            {(() => {
                const ay = P.fbl.py + 23, x0 = P.fbl.px, x1 = P.fbr.px, mid = (x0 + x1) / 2
                return (
                    <g>
                        <line x1={x0} y1={P.fbl.py + 9} x2={x0} y2={ay - 1} stroke={ac('L')} strokeWidth={1.3} />
                        <line x1={x1} y1={P.fbr.py + 9} x2={x1} y2={ay - 1} stroke={ac('L')} strokeWidth={1.3} />
                        <line x1={x0 + 8} y1={ay} x2={x1 - 8} y2={ay}
                            stroke={ac('L')} strokeWidth={sw('L')}
                            markerEnd={`url(#${mE('L')})`} markerStart={`url(#${mS('L')})`} />
                        <rect x={mid - 11} y={ay - 8} width={22} height={15} fill="white" rx={3} opacity={0.93} />
                        <text x={mid} y={ay + 5} textAnchor="middle" fontSize={13} fontWeight={700}
                            fill={tc('L')} fontFamily="sans-serif">L</text>
                    </g>
                )
            })()}

            {/* W — oblique above FTR→BTR edge */}
            {(() => {
                const GAP = 12
                const x0 = P.ftr.px + px90 * GAP, y0 = P.ftr.py + py90 * GAP
                const x1 = P.btr.px + px90 * GAP, y1 = P.btr.py + py90 * GAP
                const midX = (x0 + x1) / 2, midY = (y0 + y1) / 2, t = 0.14
                return (
                    <g>
                        <line x1={P.ftr.px} y1={P.ftr.py} x2={x0} y2={y0} stroke={ac('W')} strokeWidth={1.3} />
                        <line x1={P.btr.px} y1={P.btr.py} x2={x1} y2={y1} stroke={ac('W')} strokeWidth={1.3} />
                        <line x1={x0 + (x1 - x0) * t} y1={y0 + (y1 - y0) * t}
                            x2={x0 + (x1 - x0) * (1 - t)} y2={y0 + (y1 - y0) * (1 - t)}
                            stroke={ac('W')} strokeWidth={sw('W')}
                            markerEnd={`url(#${mE('W')})`} markerStart={`url(#${mS('W')})`} />
                        <rect x={midX - 11} y={midY - 8} width={22} height={15} fill="white" rx={3} opacity={0.93} />
                        <text x={midX} y={midY + 5} textAnchor="middle" fontSize={13} fontWeight={700}
                            fill={tc('W')} fontFamily="sans-serif">W</text>
                    </g>
                )
            })()}

            {/* D — vertical left of panel */}
            {(() => {
                const ax = P.ftl.px - 22, y0 = P.ftl.py, y1 = P.fbl.py, mid = (y0 + y1) / 2
                return (
                    <g>
                        <line x1={P.ftl.px - 2} y1={y0} x2={ax + 3} y2={y0} stroke={ac('D')} strokeWidth={1.3} />
                        <line x1={P.fbl.px - 2} y1={y1} x2={ax + 3} y2={y1} stroke={ac('D')} strokeWidth={1.3} />
                        <line x1={ax} y1={y0 + 8} x2={ax} y2={y1 - 8}
                            stroke={ac('D')} strokeWidth={sw('D')}
                            markerEnd={`url(#${mE('D')})`} markerStart={`url(#${mS('D')})`} />
                        <rect x={ax - 9} y={mid - 8} width={20} height={15} fill="white" rx={3} opacity={0.93} />
                        <text x={ax} y={mid + 5} textAnchor="middle" fontSize={13} fontWeight={700}
                            fill={tc('D')} fontFamily="sans-serif">D</text>
                    </g>
                )
            })()}

            {/* ── Legend ── */}
            <g transform={`translate(${(P.btr.px + 14).toFixed(0)},6)`}>
                <rect x={0} y={0} width={114} height={82} rx={6} fill="#f0fdf4" stroke="#bbf7d0" strokeWidth={1} />
                <text x={8} y={16} fontSize={8.5} fontWeight={700} fill="#15803d" fontFamily="sans-serif">D-WALL PANEL DIMS</text>
                {([
                    { d: 'L' as const, label: 'Length (panel span)' },
                    { d: 'W' as const, label: 'Thickness of wall' },
                    { d: 'D' as const, label: 'Excavation depth' },
                ]).map(({ d, label }, i) => (
                    <g key={d} transform={`translate(7,${28 + i * 18})`}>
                        <rect x={0} y={-9} width={14} height={13} rx={2}
                            fill={highlight === d ? '#fef3c7' : '#dcfce7'}
                            stroke={highlight === d ? '#f59e0b' : '#16a34a'} strokeWidth={1} />
                        <text x={7} y={1} textAnchor="middle" fontSize={8.5} fontWeight={700}
                            fill={highlight === d ? '#d97706' : '#15803d'} fontFamily="sans-serif">{d}</text>
                        <text x={21} y={1} fontSize={8.5}
                            fill={highlight === d ? '#92400e' : '#374151'} fontFamily="sans-serif">{label}</text>
                    </g>
                ))}
            </g>
        </svg>
    )
}

export default DWallDimensionDiagram
