# Premium Design System Documentation

## Overview

This design system provides a comprehensive set of reusable components, styles, and utilities to create beautiful, consistent user interfaces across the CRM application.

## 🎨 Core Principles

1. **Consistency**: Unified visual language across all pages
2. **Premium Feel**: Modern gradients, shadows, and animations
3. **Accessibility**: Clear labels, proper contrast, and intuitive interactions
4. **Responsiveness**: Adapts to different screen sizes
5. **Maintainability**: Reusable components and centralized theme

## 📁 File Structure

```
src/
├── styles/
│   ├── theme.ts              # Core theme configuration
│   └── styleUtils.ts         # Reusable style utilities
├── components/
│   ├── common/
│   │   └── PremiumComponents.tsx  # Premium UI components
│   └── index.ts              # Exports all design system items
```

## 🎨 Theme Configuration

### Colors

```typescript
import { theme } from '../styles/theme'

// Primary colors
theme.colors.primary.main      // #667eea
theme.colors.primary.dark      // #764ba2
theme.colors.primary.light     // #a8b5ff

// Neutral colors
theme.colors.neutral.gray100   // #f5f5f5
theme.colors.neutral.gray400   // #bfbfbf
theme.colors.neutral.gray600   // #595959
```

### Gradients

```typescript
// Available gradients
theme.gradients.primary        // Purple gradient
theme.gradients.secondary      // Pink gradient
theme.gradients.success        // Green gradient
theme.gradients.subtle         // Light gray gradient
theme.gradients.warm           // Warm gradient
theme.gradients.cool           // Cool gradient
```

### Spacing

```typescript
theme.spacing.xs    // 4px
theme.spacing.sm    // 8px
theme.spacing.md    // 16px
theme.spacing.lg    // 24px
theme.spacing.xl    // 32px
theme.spacing.xxl   // 48px
```

### Typography

```typescript
theme.typography.fontSize.xs      // 12px
theme.typography.fontSize.base    // 14px
theme.typography.fontSize.lg      // 18px
theme.typography.fontSize.xxxl    // 32px

theme.typography.fontWeight.normal    // 400
theme.typography.fontWeight.medium    // 500
theme.typography.fontWeight.semibold  // 600
```

### Shadows

```typescript
theme.shadows.sm        // Subtle shadow
theme.shadows.base      // Default shadow
theme.shadows.md        // Medium shadow
theme.shadows.lg        // Large shadow
theme.shadows.primary   // Primary colored shadow
```

### Border Radius

```typescript
theme.borderRadius.sm    // 4px
theme.borderRadius.base  // 8px
theme.borderRadius.md    // 12px
theme.borderRadius.lg    // 16px
```

## 🧩 Components

### PageContainer

Wraps the entire page content with consistent background and max-width.

```typescript
import { PageContainer } from '../../components/common/PremiumComponents'

<PageContainer maxWidth={1400}>
  {/* Your page content */}
</PageContainer>
```

**Props:**
- `children`: React.ReactNode (required)
- `maxWidth`: number (default: 1400)
- `style`: CSSProperties (optional)

### PageHeader

Beautiful gradient header with title, subtitle, and icon.

```typescript
import { PageHeader } from '../../components/common/PremiumComponents'
import { ProjectOutlined } from '@ant-design/icons'

<PageHeader
  title="Create New Project"
  subtitle="Fill in the details below to create a new construction project"
  icon={<ProjectOutlined />}
  gradient="primary"
/>
```

**Props:**
- `title`: string (required)
- `subtitle`: string (optional)
- `icon`: React.ReactNode (optional)
- `gradient`: keyof theme.gradients (default: 'primary')
- `style`: CSSProperties (optional)

### SectionCard

Card component with icon and title for organizing form sections.

```typescript
import { SectionCard } from '../../components/common/PremiumComponents'
import { UserOutlined } from '@ant-design/icons'

<SectionCard title="Basic Information" icon={<UserOutlined />}>
  {/* Form fields */}
</SectionCard>
```

**Props:**
- `title`: string (required)
- `icon`: React.ReactNode (optional)
- `children`: React.ReactNode (required)
- `hoverable`: boolean (default: true)
- `style`: CSSProperties (optional)

### InfoCard

Informational card with gradient background for tips and notes.

```typescript
import { InfoCard } from '../../components/common/PremiumComponents'

<InfoCard title="💡 Quick Tip" gradient="subtle">
  Ensure all compliance documents are ready before project creation
</InfoCard>
```

**Props:**
- `title`: string (optional)
- `icon`: string (optional)
- `children`: React.ReactNode (required)
- `gradient`: keyof theme.gradients (default: 'subtle')
- `style`: CSSProperties (optional)

## 🎯 Style Utilities

### Form Input Styles

```typescript
import { largeInputStyle, getLabelStyle, prefixIconStyle } from '../../styles/styleUtils'

<Form.Item label={<span style={getLabelStyle()}>Name</span>} name="name">
  <Input 
    prefix={<UserOutlined style={prefixIconStyle} />}
    size="large"
    style={largeInputStyle}
  />
</Form.Item>
```

### Button Styles

```typescript
import { getPrimaryButtonStyle, getSecondaryButtonStyle } from '../../styles/styleUtils'

<Button size="large" style={getPrimaryButtonStyle()}>
  Create Project
</Button>

<Button size="large" style={getSecondaryButtonStyle()}>
  Cancel
</Button>
```

### Layout Styles

```typescript
import { 
  threeColumnGridStyle, 
  twoColumnGridStyle, 
  flexBetweenStyle 
} from '../../styles/styleUtils'

// 3-column grid
<div style={threeColumnGridStyle}>
  <SectionCard>...</SectionCard>
  <SectionCard>...</SectionCard>
  <SectionCard>...</SectionCard>
</div>

// 2-column grid
<div style={twoColumnGridStyle}>
  <SectionCard>...</SectionCard>
  <SectionCard>...</SectionCard>
</div>

// Flex space-between
<div style={flexBetweenStyle}>
  <Text>Left content</Text>
  <Button>Right content</Button>
</div>
```

### Card Styles

```typescript
import { sectionCardStyle, actionCardStyle } from '../../styles/styleUtils'

<Card style={sectionCardStyle}>
  {/* Section content */}
</Card>

<Card style={actionCardStyle}>
  {/* Action buttons */}
</Card>
```

## 📝 Complete Example

Here's a complete example of a form using the design system:

```typescript
import { useState } from 'react'
import { Form, Input, Button, Card, Typography } from 'antd'
import { UserOutlined, MailOutlined } from '@ant-design/icons'
import { 
  PageContainer, 
  PageHeader, 
  SectionCard, 
  InfoCard 
} from '../../components/common/PremiumComponents'
import { 
  largeInputStyle, 
  getLabelStyle, 
  getPrimaryButtonStyle, 
  getSecondaryButtonStyle,
  twoColumnGridStyle,
  flexBetweenStyle,
  actionCardStyle,
  prefixIconStyle
} from '../../styles/styleUtils'

const { Text } = Typography

const MyForm = () => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const onFinish = async (values: any) => {
    // Handle form submission
  }

  return (
    <PageContainer maxWidth={1200}>
      <PageHeader
        title="Create New Item"
        subtitle="Fill in the details below"
        icon={<UserOutlined />}
      />

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div style={twoColumnGridStyle}>
          <SectionCard title="Basic Info" icon={<UserOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Name</span>}
              name="name"
              rules={[{ required: true }]}
            >
              <Input 
                prefix={<UserOutlined style={prefixIconStyle} />}
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>

            <InfoCard title="💡 Tip">
              Enter your full name
            </InfoCard>
          </SectionCard>

          <SectionCard title="Contact" icon={<MailOutlined />}>
            <Form.Item
              label={<span style={getLabelStyle()}>Email</span>}
              name="email"
            >
              <Input 
                prefix={<MailOutlined style={prefixIconStyle} />}
                size="large"
                style={largeInputStyle}
              />
            </Form.Item>
          </SectionCard>
        </div>

        <Card style={actionCardStyle}>
          <div style={flexBetweenStyle}>
            <Text style={{ color: '#666' }}>
              All fields marked with * are required
            </Text>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button size="large" style={getSecondaryButtonStyle()}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
                style={getPrimaryButtonStyle()}
              >
                Create
              </Button>
            </div>
          </div>
        </Card>
      </Form>
    </PageContainer>
  )
}
```

## 🎨 Icon Guidelines

Use Ant Design icons with consistent styling:

```typescript
import { 
  UserOutlined,
  ProjectOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  CalendarOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
  TeamOutlined,
  LockOutlined,
  DollarOutlined
} from '@ant-design/icons'
```

## 🚀 Best Practices

1. **Always use the design system components** instead of creating custom ones
2. **Use theme values** instead of hardcoded colors, spacing, etc.
3. **Apply consistent icon usage** - prefix icons for inputs, section icons for cards
4. **Use large size inputs** (`size="large"`) for better UX
5. **Include InfoCards** for helpful tips and guidance
6. **Maintain 3-column or 2-column layouts** for forms
7. **Use gradient headers** for all pages
8. **Apply consistent button styling** with the utility functions

## 🔄 Migration Guide

To migrate an existing form to the design system:

1. Import the required components and utilities
2. Wrap content in `PageContainer`
3. Replace the title with `PageHeader`
4. Group form fields into `SectionCard` components
5. Apply style utilities to inputs and buttons
6. Add icons to form fields
7. Include an `InfoCard` for helpful tips
8. Use `actionCardStyle` for the button section

## 📱 Responsive Design

The design system is mobile-friendly by default. For custom responsive behavior, use CSS media queries or the `getResponsiveColumns` utility.

## 🎯 Color Usage Guidelines

- **Primary Gradient**: Main actions, headers, important elements
- **Secondary Gradient**: Alternative actions, highlights
- **Success Gradient**: Confirmations, success states
- **Subtle Gradient**: Info cards, backgrounds
- **Neutral Colors**: Text, borders, backgrounds

## 🛠️ Customization

To customize the theme, edit `src/styles/theme.ts`:

```typescript
export const theme = {
  colors: {
    primary: {
      main: '#YOUR_COLOR',
      // ...
    }
  }
  // ...
}
```

All components will automatically use the updated theme values.

## 📞 Support

For questions or issues with the design system, please refer to this documentation or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: January 2026
