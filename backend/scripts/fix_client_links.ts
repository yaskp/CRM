
import { sequelize } from '../src/database/connection';
import Client from '../src/models/Client';
import ClientGroup from '../src/models/ClientGroup';
import ClientContact from '../src/models/ClientContact';

const fixClientLinks = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Re-verify groups
        const groups = await ClientGroup.findAll();
        console.log('Available Groups:', groups.map(g => `${g.id}:${g.group_name}`));

        let defaultGroup = groups.find(g => g.group_type === 'corporate') || groups[0];

        if (!defaultGroup) {
            console.log('No groups found. Creating a default Corporate group...');
            defaultGroup = await ClientGroup.create({
                group_name: 'Standard Corporate',
                group_type: 'corporate',
                description: 'Default group for migration'
            });
        }

        const clients = await Client.findAll();
        console.log(`Found ${clients.length} clients.`);

        for (const client of clients) {
            console.log(`Checking Client ${client.id}: ${client.company_name} (Current Group ID: ${client.client_group_id})`);

            // Force Link to Group 1 (or default)
            if (!client.client_group_id) {
                console.log(`Updating Group to ${defaultGroup.id}...`);
                await client.update({ client_group_id: defaultGroup.id });
                // Double check bypass
                const reloaded = await Client.findByPk(client.id);
                console.log(`Verified Group ID after save: ${reloaded?.client_group_id}`);
            }

            // Fix Contact
            const existingContact = await ClientContact.findOne({ where: { client_id: client.id } });
            if (!existingContact && client.contact_person) {
                console.log(`Creating contact record for Client ${client.id}...`);
                await ClientContact.create({
                    client_id: client.id,
                    contact_name: client.contact_person,
                    email: client.email,
                    phone: client.phone,
                    is_primary: true,
                    designation: 'Primary Contact'
                });
            }
        }

        console.log('Repair process finished.');
        process.exit(0);
    } catch (error) {
        console.error('Repair failed:', error);
        process.exit(1);
    }
};

fixClientLinks();
