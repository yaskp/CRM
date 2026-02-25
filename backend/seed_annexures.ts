
import Annexure from './src/models/Annexure';
import { sequelize } from './src/database/connection';

async function seedAnnexures() {
    try {
        console.log("Seeding standard annexure templates...");

        const standardScopes = [
            { description: 'ADMINISTRATION & SAFETY', is_category: true },
            { description: 'Site Medical Facilities/First Aid', is_category: false, client_scope: true, contractor_scope: false, remarks: 'Provided at site office' },
            { description: 'Safety officer and security for work', is_category: false, client_scope: false, contractor_scope: true, remarks: '' },
            { description: 'PF, ESI and Insurance for Contractor labor', is_category: false, client_scope: false, contractor_scope: true, remarks: '' },

            { description: 'SITE FACILITIES', is_category: true },
            { description: 'Temporary Electricity for construction', is_category: false, client_scope: true, contractor_scope: false, remarks: 'Single source point' },
            { description: 'Temporary Water for construction', is_category: false, client_scope: true, contractor_scope: false, remarks: '' },
            { description: 'Land for Labor Hutments', is_category: false, client_scope: true, contractor_scope: false, remarks: 'Within premises' },
            { description: 'Construction of Store / Labor Hutments', is_category: false, client_scope: false, contractor_scope: true, remarks: 'Temporary structure' },

            { description: 'EXECUTION (CIVIL)', is_category: true },
            { description: 'RCC Work (Columns, Beams, Slabs)', is_category: false, client_scope: false, contractor_scope: true, remarks: '' },
            { description: 'Formwork / Shuttering Material', is_category: false, client_scope: false, contractor_scope: true, remarks: '' },
            { description: 'Sand, Cement & Bricks for masonry', is_category: false, client_scope: false, contractor_scope: true, remarks: '' },
            { description: 'Reinforcement Steel Supply', is_category: false, client_scope: true, contractor_scope: false, remarks: 'Free supply by client' },

            { description: 'FINISHING WORK', is_category: true },
            { description: 'Plastering & Internal Painting', is_category: false, client_scope: false, contractor_scope: true, remarks: '' },
            { description: 'External Painting', is_category: false, client_scope: false, contractor_scope: true, remarks: '' },
            { description: 'Flooring Tiles / Marble Supply', is_category: false, client_scope: true, contractor_scope: false, remarks: 'Free supply' },

            { description: 'MISCELLANEOUS', is_category: true },
            { description: 'Debris Removal from site', is_category: false, client_scope: false, contractor_scope: true, remarks: 'Up to designated spot' },
            { description: 'Local Body / Liaison Approvals', is_category: false, client_scope: true, contractor_scope: false, remarks: '' }
        ];

        await Annexure.create({
            name: 'Standard Civil Work Scope Matrix',
            description: 'Comprehensive scope matrix for civil and construction projects',
            type: 'scope_matrix',
            scope_matrix: standardScopes,
            is_active: true
        });

        await Annexure.create({
            name: 'Standard Payment Terms',
            description: 'Default payment schedule for new projects',
            type: 'payment_terms',
            clauses: [
                '10% Advance with the work order.',
                '70% Progress payment against R.A. Bills within 7 days of submission.',
                '10% On completion of work and cleaning.',
                '10% After defect liability period (6 months).'
            ],
            is_active: true
        });

        await Annexure.create({
            name: 'Standard Terms & Conditions',
            description: 'General conditions of contract',
            type: 'general_terms',
            clauses: [
                'GST will be charged extra as per govt norms.',
                'Validity of this quotation is 30 days.',
                'Any extra work will be charged as per actual site measurements.',
                'Standard safety protocols must be followed at site.',
                'All disputes are subject to local jurisdiction.'
            ],
            is_active: true
        });

        console.log("Success: Standard annexures seeded successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding annexures:", error);
        process.exit(1);
    }
}

seedAnnexures();
