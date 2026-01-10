# Documentation Structure

This directory contains all project documentation organized by module and purpose.

## 📁 Folder Structure

```
docs/
├── modules/                    # Module-specific documentation
│   ├── DAY1_AUTH_VENDOR.md    # Day 1: Authentication & Vendor Management
│   ├── authentication/         # (Future) Auth module details
│   └── vendor-management/      # (Future) Vendor module details
│
├── standards/                  # Standards and comparisons
│   └── CRM_COMPARISON.md      # Comparison with Indian CRMs
│
└── README.md                  # This file
```

## 📋 Documentation Guidelines

### Module Documentation
- **One document per day/module** - Keep it consolidated
- **Name format:** `DAYX_MODULE_NAME.md`
- **Content:** Overview, implementation, testing, issues fixed
- **Update:** Only update when module changes significantly

### Standards Documentation
- Industry comparisons
- Validation standards
- Best practices
- Compliance requirements

### Avoid
- ❌ Multiple small docs for same module
- ❌ Docs in project root
- ❌ Creating docs for every small change
- ❌ Scattered documentation

## 📖 Current Documentation

### Day 1 (Complete)
- **DAY1_AUTH_VENDOR.md** - Authentication & Vendor Management
  - Username-based login
  - Vendor CRUD operations
  - Indian standards validation
  - GST toggle feature

### Standards
- **CRM_COMPARISON.md** - Comparison with Tally, Odoo, Zoho, BuildersMart

## 🔄 Future Modules

Each new module will get ONE consolidated document:
- `DAY2_MATERIAL_REQUISITION.md`
- `DAY3_STORE_TRANSACTIONS.md`
- `DAY4_INVENTORY.md`
- etc.

---

**Last Updated:** January 10, 2026
