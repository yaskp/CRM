import React, { CSSProperties } from 'react'
import { Card as AntCard, Typography, Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { theme } from '../../styles/theme'

const { Title } = Typography

interface PageHeaderProps {
    title: string
    subtitle?: React.ReactNode
    icon?: React.ReactNode
    extra?: React.ReactNode
    onBack?: () => void
    gradient?: keyof typeof theme.gradients
    style?: CSSProperties
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    icon,
    extra,
    onBack,
    gradient = 'primary',
    style,
}) => {
    return (
        <div
            className="premium-page-header"
            style={{
                marginBottom: theme.spacing.xl,
                background: theme.gradients[gradient],
                borderRadius: theme.borderRadius.lg,
                boxShadow: theme.shadows.primary,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: theme.spacing.md,
                ...style,
            }}
        >
            <div>
                <Title
                    level={2}
                    style={{
                        color: 'white',
                        margin: 0,
                        fontSize: theme.typography.fontSize.xxxl,
                        fontWeight: theme.typography.fontWeight.semibold,
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.md,
                    }}
                >
                    {onBack && (
                        <Button
                            type="text"
                            icon={<ArrowLeftOutlined style={{ color: 'white' }} />}
                            onClick={onBack}
                            style={{
                                padding: 0,
                                marginRight: theme.spacing.sm,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        />
                    )}
                    {icon}
                    {title}
                </Title>
                {subtitle && (
                    <div
                        style={{
                            color: 'rgba(255,255,255,0.9)',
                            fontSize: theme.typography.fontSize.md,
                            marginTop: theme.spacing.sm,
                        }}
                    >
                        {subtitle}
                    </div>
                )}
            </div>
            {extra && <div>{extra}</div>}
        </div>
    )
}

interface SectionCardProps {
    title: string
    icon?: React.ReactNode
    extra?: React.ReactNode
    children: React.ReactNode
    hoverable?: boolean
    style?: CSSProperties
}

export const SectionCard: React.FC<SectionCardProps> = ({
    title,
    icon,
    extra,
    children,
    hoverable = true,
    style,
}) => {
    const iconStyle: CSSProperties = {
        fontSize: 24,
        background: theme.gradients.primary,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    }

    const sectionHeaderStyle: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        borderBottom: `2px solid ${theme.colors.neutral.gray100}`,
    }

    return (
        <AntCard
            hoverable={hoverable}
            style={{
                marginBottom: theme.spacing.lg,
                borderRadius: theme.borderRadius.md,
                boxShadow: theme.shadows.base,
                border: `1px solid ${theme.colors.neutral.gray100}`,
                transition: theme.transitions.base,
                ...style,
            }}
        >
            <div style={sectionHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                    {icon && <div style={iconStyle}>{icon}</div>}
                    <Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                        {title}
                    </Title>
                </div>
                {extra && <div>{extra}</div>}
            </div>
            {children}
        </AntCard>
    )
}

interface PageContainerProps {
    children: React.ReactNode
    maxWidth?: number
    style?: CSSProperties
}

export const PageContainer: React.FC<PageContainerProps> = ({
    children,
    maxWidth = 1150,
    style,
}) => {
    return (
        <div
            className="premium-page-container"
            style={{
                background: theme.colors.background.main,
                minHeight: '100vh',
                // padding handled by CSS class for responsiveness
                ...style,
            }}
        >
            <div style={{ maxWidth, margin: '0 auto' }}>{children}</div>
        </div>
    )
}

interface InfoCardProps {
    title?: string
    icon?: React.ReactNode
    children: React.ReactNode
    gradient?: keyof typeof theme.gradients
    style?: CSSProperties
}

export const InfoCard: React.FC<InfoCardProps> = ({
    title,
    icon,
    children,
    gradient = 'subtle',
    style,
}) => {
    return (
        <div
            style={{
                marginTop: theme.spacing.lg,
                padding: theme.spacing.md,
                background: theme.gradients[gradient],
                borderRadius: theme.borderRadius.base,
                border: `1px solid ${theme.colors.neutral.gray200}`,
                ...style,
            }}
        >
            {title && (
                <div
                    style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.neutral.gray600,
                        display: 'block',
                        marginBottom: theme.spacing.xs,
                    }}
                >
                    {icon} {title}
                </div>
            )}
            <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.neutral.gray800 }}>
                {children}
            </div>
        </div>
    )
}
