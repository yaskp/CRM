# Design System Quick Reference

## 🚀 Quick Start

```typescript
// 1. Import components and utilities
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
  threeColumnGridStyle,
  twoColumnGridStyle,
  flexBetweenStyle,
  actionCardStyle,
  prefixIconStyle
} from '../../styles/styleUtils'

// 2. Basic structure
<PageContainer>
  <PageHeader title="Page Title" subtitle="Description" icon={<Icon />} />
  
  <Form>
    <div style={threeColumnGridStyle}>
      <SectionCard title="Section 1" icon={<Icon />}>
        {/* Form fields */}
      </SectionCard>
      
      <SectionCard title="Section 2" icon={<Icon />}>
        {/* Form fields */}
      </SectionCard>
      
      <SectionCard title="Section 3" icon={<Icon />}>
        {/* Form fields */}
        <InfoCard title="💡 Tip">Helpful information</InfoCard>
      </SectionCard>
    </div>
    
    <Card style={actionCardStyle}>
      <div style={flexBetweenStyle}>
        <Text>Required fields note</Text>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button style={getSecondaryButtonStyle()}>Cancel</Button>
          <Button style={getPrimaryButtonStyle()}>Submit</Button>
        </div>
      </div>
    </Card>
  </Form>
</PageContainer>
```

## 📋 Common Patterns

### Form Input with Icon
```typescript
<Form.Item label={<span style={getLabelStyle()}>Label</span>} name="field">
  <Input 
    prefix={<Icon style={prefixIconStyle} />}
    size="large"
    style={largeInputStyle}
    placeholder="Enter value"
  />
</Form.Item>
```

### Select Dropdown
```typescript
<Form.Item label={<span style={getLabelStyle()}>Label</span>} name="field">
  <Select size="large" style={largeInputStyle}>
    <Option value="1">Option 1</Option>
  </Select>
</Form.Item>
```

### Date Picker
```typescript
<Form.Item label={<span style={getLabelStyle()}>Date</span>} name="date">
  <DatePicker 
    style={{ width: '100%', ...largeInputStyle }}
    size="large"
    format="DD/MM/YYYY"
  />
</Form.Item>
```

### Text Area
```typescript
<Form.Item label={<span style={getLabelStyle()}>Notes</span>} name="notes">
  <TextArea rows={4} style={largeInputStyle} />
</Form.Item>
```

## 🎨 Common Icons

```typescript
import {
  UserOutlined,          // User/person
  ProjectOutlined,       // Projects
  MailOutlined,          // Email
  PhoneOutlined,         // Phone
  BankOutlined,          // Company/bank
  CalendarOutlined,      // Calendar/dates
  FileTextOutlined,      // Documents
  EnvironmentOutlined,   // Location
  SafetyOutlined,        // Security
  TeamOutlined,          // Teams/groups
  LockOutlined,          // Password/lock
  DollarOutlined,        // Money/currency
  ContactsOutlined,      // Contacts
  HomeOutlined,          // Home/address
  IdcardOutlined,        // ID card
} from '@ant-design/icons'
```

## 🎯 Layout Options

### 3-Column Grid
```typescript
<div style={threeColumnGridStyle}>
  <SectionCard>...</SectionCard>
  <SectionCard>...</SectionCard>
  <SectionCard>...</SectionCard>
</div>
```

### 2-Column Grid
```typescript
<div style={twoColumnGridStyle}>
  <SectionCard>...</SectionCard>
  <SectionCard>...</SectionCard>
</div>
```

### Flex Space Between
```typescript
<div style={flexBetweenStyle}>
  <div>Left content</div>
  <div>Right content</div>
</div>
```

## 🎨 Gradient Options

```typescript
<PageHeader gradient="primary" />    // Purple (default)
<PageHeader gradient="secondary" />  // Pink
<PageHeader gradient="success" />    // Green
<PageHeader gradient="info" />       // Blue
<PageHeader gradient="warm" />       // Warm colors
<PageHeader gradient="cool" />       // Cool colors

<InfoCard gradient="subtle" />       // Light gray (default)
<InfoCard gradient="primary" />      // Purple
```

## 📏 Spacing Values

```typescript
theme.spacing.xs    // 4px
theme.spacing.sm    // 8px
theme.spacing.md    // 16px
theme.spacing.lg    // 24px
theme.spacing.xl    // 32px
theme.spacing.xxl   // 48px
```

## 🎨 Common Colors

```typescript
theme.colors.primary.main      // #667eea
theme.colors.neutral.gray400   // #bfbfbf
theme.colors.neutral.gray600   // #595959
theme.colors.error.main        // #ff4d4f
```

## ✅ Checklist for New Forms

- [ ] Wrap in `PageContainer`
- [ ] Add `PageHeader` with title, subtitle, and icon
- [ ] Use `SectionCard` for grouping fields
- [ ] Apply `largeInputStyle` to all inputs
- [ ] Use `getLabelStyle()` for labels
- [ ] Add prefix icons to inputs
- [ ] Include at least one `InfoCard` with tips
- [ ] Use `actionCardStyle` for button section
- [ ] Apply `getPrimaryButtonStyle()` to submit button
- [ ] Apply `getSecondaryButtonStyle()` to cancel button
- [ ] Use appropriate grid layout (2 or 3 columns)

## 🔧 Troubleshooting

**Issue**: Components not found  
**Solution**: Check import path - should be from `../../components/common/PremiumComponents`

**Issue**: Styles not applying  
**Solution**: Ensure you're spreading `largeInputStyle` with `style={{ ...largeInputStyle }}`

**Issue**: Icons not showing  
**Solution**: Import from `@ant-design/icons`

**Issue**: TypeScript errors  
**Solution**: Ensure all required props are provided

---

For detailed documentation, see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
