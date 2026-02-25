const { Sequelize } = require('sequelize');

/**
 * Migration: Update Material Requisitions for New Workflow
 * - Make from_warehouse_id nullable (not required at requisition stage)
 * - Add purpose field (TEXT)
 * - Add remarks field (TEXT)
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Make from_warehouse_id nullable
        await queryInterface.changeColumn('material_requisitions', 'from_warehouse_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'warehouses',
                key: 'id',
            },
        });

        // Add purpose field
        await queryInterface.addColumn('material_requisitions', 'purpose', {
            type: Sequelize.TEXT,
            allowNull: true,
        });

        // Add remarks field
        await queryInterface.addColumn('material_requisitions', 'remarks', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Remove remarks field
        await queryInterface.removeColumn('material_requisitions', 'remarks');

        // Remove purpose field
        await queryInterface.removeColumn('material_requisitions', 'purpose');

        // Make from_warehouse_id required again
        await queryInterface.changeColumn('material_requisitions', 'from_warehouse_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'warehouses',
                key: 'id',
            },
        });
    },
};
