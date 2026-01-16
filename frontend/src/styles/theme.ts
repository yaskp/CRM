// Premium Design System Theme Configuration

export const theme = {
    // Color Palette
    colors: {
        primary: {
            main: '#667eea',
            dark: '#764ba2',
            light: '#a8b5ff',
        },
        secondary: {
            main: '#f093fb',
            dark: '#f5576c',
        },
        success: {
            main: '#52c41a',
            light: '#95de64',
        },
        warning: {
            main: '#faad14',
            light: '#ffd666',
        },
        error: {
            main: '#ff4d4f',
            light: '#ff7875',
        },
        neutral: {
            white: '#ffffff',
            gray50: '#fafafa',
            gray100: '#f5f5f5',
            gray200: '#e8e8e8',
            gray300: '#d9d9d9',
            gray400: '#bfbfbf',
            gray500: '#8c8c8c',
            gray600: '#595959',
            gray700: '#434343',
            gray800: '#262626',
            gray900: '#1f1f1f',
        },
        background: {
            main: '#f5f7fa',
            light: '#fafbfc',
            card: '#ffffff',
        },
    },

    // Gradients
    gradients: {
        primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        success: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        info: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
        subtle: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        warm: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        cool: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    },

    // Spacing
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },

    // Typography
    typography: {
        fontFamily: {
            primary: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            mono: "'Courier New', Courier, monospace",
        },
        fontSize: {
            xs: 12,
            sm: 13,
            base: 14,
            md: 16,
            lg: 18,
            xl: 20,
            xxl: 24,
            xxxl: 32,
        },
        fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
        },
    },

    // Shadows
    shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        base: '0 2px 8px rgba(0, 0, 0, 0.06)',
        md: '0 4px 12px rgba(0, 0, 0, 0.08)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
        xl: '0 12px 32px rgba(0, 0, 0, 0.15)',
        primary: '0 4px 12px rgba(102, 126, 234, 0.4)',
        secondary: '0 4px 12px rgba(240, 147, 251, 0.4)',
    },

    // Border Radius
    borderRadius: {
        sm: 4,
        base: 8,
        md: 12,
        lg: 16,
        xl: 20,
        full: 9999,
    },

    // Transitions
    transitions: {
        fast: '0.15s ease',
        base: '0.3s ease',
        slow: '0.5s ease',
    },
}

export type Theme = typeof theme
