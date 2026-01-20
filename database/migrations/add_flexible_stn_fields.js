const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Make warehouse_id nullable
        await queryInterface.changeColumn('store_transactions', 'warehouse_id', {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'warehouses',
                key: 'id',
            },
        });

        // 2. Add new columns for flexible transfers
        await queryInterface.addColumn('store_transactions', 'from_project_id', {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'projects',
                key: 'id',
            },
            onDelete: 'SET NULL',
        });

        await queryInterface.addColumn('store_transactions', 'to_project_id', {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'projects',
                key: 'id',
            },
            onDelete: 'SET NULL',
        });

        // We can interpret existing project_id as... generic? Or maybe migrate it? 
        // For now, let's just add explicit from/to fields to avoid ambiguity.

        await queryInterface.addColumn('store_transactions', 'source_type', {
            type: DataTypes.ENUM('warehouse', 'project', 'vendor'),
            allowNull: true, // Legacy records might be null, implying warehouse->warehouse default?
            defaultValue: 'warehouse'
        });

        await queryInterface.addColumn('store_transactions', 'destination_type', {
            type: DataTypes.ENUM('warehouse', 'project', 'vendor'),
            allowNull: true,
            defaultValue: 'warehouse'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('store_transactions', 'to_project_id');
        await queryInterface.removeColumn('store_transactions', 'from_project_id');
        await queryInterface.removeColumn('store_transactions', 'destination_type');
        await queryInterface.removeColumn('store_transactions', 'source_type');

        // Revert warehouse_id to NOT NULL (this might fail if we created records with nulls)
        // await queryInterface.changeColumn('store_transactions', 'warehouse_id', {
        //   type: DataTypes.INTEGER,
        //   allowNull: false,
        // });
    },
};
