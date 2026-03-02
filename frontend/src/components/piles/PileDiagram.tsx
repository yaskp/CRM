import { Typography } from 'antd'
import { theme } from '../../styles/theme'

const { Text } = Typography

interface PileDiagramProps {
    diameter?: number
    depth?: number
    rockSocket?: number
    topRL?: number
    bottomRL?: number
}

const PileDiagram = ({ diameter = 1000, depth = 28, rockSocket = 1.5, topRL, bottomRL }: PileDiagramProps) => {
    // Scaling logic (simple)
    const viewWidth = 280
    const viewHeight = 350

    // Normalize values for visual representation
    const visualDia = Math.max(40, Math.min(80, (diameter / 1000) * 50))
    const visualDepth = 250 // Fixed height for diagram
    const visualRockSocket = rockSocket > 0 ? (rockSocket / depth) * visualDepth : 0

    const centerX = viewWidth / 2
    const startY = 40

    return (
        <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: `1px solid ${theme.colors.neutral.gray200}`,
            height: '100%'
        }}>
            <Text strong style={{ marginBottom: 16, color: theme.colors.primary.main }}>Pile Physical Structure</Text>

            <svg width={viewWidth} height={viewHeight} viewBox={`0 0 ${viewWidth} ${viewHeight}`}>
                {/* Ground Surface */}
                <line x1="20" y1={startY} x2={viewWidth - 20} y2={startY} stroke="#8c8c8c" strokeWidth="2" strokeDasharray="4" />
                <text x="25" y={startY - 5} fontSize="10" fill="#8c8c8c">GL / Cut-off Level</text>
                {topRL !== undefined && <text x="25" y={startY + 15} fontSize="11" fontWeight="bold" fill="#595959">RL: {topRL} m</text>}

                {/* Main Pile Body */}
                <rect
                    x={centerX - visualDia / 2}
                    y={startY}
                    width={visualDia}
                    height={visualDepth - visualRockSocket}
                    fill="#d9d9d9"
                    stroke="#595959"
                    strokeWidth="2"
                />

                {/* Rock Socket Part */}
                {rockSocket > 0 && (
                    <rect
                        x={centerX - visualDia / 2}
                        y={startY + visualDepth - visualRockSocket}
                        width={visualDia}
                        height={visualRockSocket}
                        fill="#8c8c8c"
                        stroke="#262626"
                        strokeWidth="2"
                    />
                )}

                {/* Labels and Arrows */}
                {/* Diameter Arrow */}
                <line x1={centerX - visualDia / 2} y1={startY + 20} x2={centerX + visualDia / 2} y2={startY + 20} stroke="#1890ff" strokeWidth="1.5" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x={centerX} y={startY + 15} fontSize="10" textAnchor="middle" fill="#1890ff" fontWeight="bold">Ø {diameter}mm</text>

                {/* Depth Arrow */}
                <line x1={centerX + visualDia / 2 + 15} y1={startY} x2={centerX + visualDia / 2 + 15} y2={startY + visualDepth} stroke="#1890ff" strokeWidth="1.5" />
                <text x={centerX + visualDia / 2 + 20} y={startY + visualDepth / 2} fontSize="10" fill="#1890ff" fontWeight="bold" transform={`rotate(90, ${centerX + visualDia / 2 + 20}, ${startY + visualDepth / 2})`}>Length: {depth}m</text>

                {/* Rock Socket Label */}
                {rockSocket > 0 && (
                    <>
                        <line x1={centerX - visualDia / 2 - 15} y1={startY + visualDepth - visualRockSocket} x2={centerX - visualDia / 2 - 15} y2={startY + visualDepth} stroke="#fa8c16" strokeWidth="1.5" />
                        <text x={centerX - visualDia / 2 - 20} y={startY + visualDepth - (visualRockSocket / 2)} fontSize="9" fill="#fa8c16" fontWeight="bold" textAnchor="end">Rock: {rockSocket}m</text>
                    </>
                )}

                {/* Bottom RL */}
                <line x1={centerX - visualDia / 2 - 10} y1={startY + visualDepth} x2={centerX + visualDia / 2 + 10} y2={startY + visualDepth} stroke="#262626" strokeWidth="2" />
                <text x={centerX} y={startY + visualDepth + 15} fontSize="11" textAnchor="middle" fontWeight="bold" fill="#262626">Toe Level</text>
                {bottomRL !== undefined && <text x={centerX} y={startY + visualDepth + 30} fontSize="11" textAnchor="middle" fill="#595959">RL: {bottomRL} m</text>}

                {/* Rebar (subtle) */}
                <line x1={centerX - visualDia / 4} y1={startY} x2={centerX - visualDia / 4} y2={startY + visualDepth - 20} stroke="#434343" strokeWidth="1" strokeDasharray="2" />
                <line x1={centerX + visualDia / 4} y1={startY} x2={centerX + visualDia / 4} y2={startY + visualDepth - 20} stroke="#434343" strokeWidth="1" strokeDasharray="2" />

                {/* Define Arrow Marker */}
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#1890ff" />
                    </marker>
                </defs>
            </svg>

            <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '11px', color: '#8c8c8c', fontStyle: 'italic' }}>
                Note: 3D Visualization of Design Parameters
            </div>
        </div>
    )
}

export default PileDiagram
