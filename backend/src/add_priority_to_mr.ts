import { sequelize } from './database/connection';
import { DataTypes } from 'sequelize';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const queryInterface = sequelize.getQueryInterface();

        // Add priority column
        await queryInterface.addColumn('material_requisitions', 'priority', {
            type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
            defaultValue: 'medium',
            allowNull: false
        });

        console.log('Added priority column to material_requisitions table.');

    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        await sequelize.close();
    }
};

run();
