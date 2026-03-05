import { CSSProperties } from 'react'
import { theme } from './theme'

// Form Input Styles
export const largeInputStyle: CSSProperties = {
    borderRadius: theme.borderRadius.base,
    fontSize: theme.typography.fontSize.base,
}

export const getLabelStyle = (fontWeight: number = 500): CSSProperties => ({
    fontWeight,
    fontSize: theme.typography.fontSize.base,
})

// Button Styles
export const getPrimaryButtonStyle = (minWidth: number = 160): CSSProperties => ({
    borderRadius: theme.borderRadius.base,
    minWidth,
    height: 44,
    fontWeight: theme.typography.fontWeight.medium,
    background: theme.gradients.primary,
    border: 'none',
    boxShadow: theme.shadows.primary,
})

export const getSecondaryButtonStyle = (minWidth: number = 120): CSSProperties => ({
    borderRadius: theme.borderRadius.base,
    minWidth,
    height: 44,
    fontWeight: theme.typography.fontWeight.medium,
})

// Card Styles
export const sectionCardStyle: CSSProperties = {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.base,
    border: `1px solid ${theme.colors.neutral.gray100}`,
    transition: theme.transitions.base,
}

export const actionCardStyle: CSSProperties = {
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.md,
    border: `1px solid ${theme.colors.neutral.gray100}`,
}

// Layout Styles
export const threeColumnGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
}

export const twoColumnGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: theme.spacing.md,
}

export const flexEndStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
}

export const flexBetweenStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
}

// Icon Styles
export const gradientIconStyle: CSSProperties = {
    fontSize: 24,
    background: theme.gradients.primary,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
}

export const prefixIconStyle: CSSProperties = {
    color: theme.colors.neutral.gray400,
}

// Section Header Styles
export const sectionHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottom: `2px solid ${theme.colors.neutral.gray100}`,
}

// Note: For responsive columns, use CSS media queries in a separate stylesheet
// or use Ant Design's responsive grid system (Row/Col with responsive props)
