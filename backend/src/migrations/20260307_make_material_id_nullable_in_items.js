const { Sequelize } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Make material_id nullable in store_transaction_items
        await queryInterface.changeColumn('store_transaction_items', 'material_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'materials',
                key: 'id',
            },
        });

        // 2. Ensure quotation_item_id exists and handles nullable as well
        // (It already exists, but good to be explicit if doing a batch fix)
    },

    down: async (queryInterface, Sequelize) => {
        // Re-enforce NOT NULL for material_id
        await queryInterface.changeColumn('store_transaction_items', 'material_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'materials',
                key: 'id',
            },
        });
    },
};
