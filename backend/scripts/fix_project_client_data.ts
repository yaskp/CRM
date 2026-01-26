
import { sequelize } from '../src/database/connection';
import Project from '../src/models/Project';
import Client from '../src/models/Client';
import { getStateCodeFromGST } from '../src/utils/gstCalculator';

const fixProjectClientData = async () => {
    try {
        console.log('Starting Project-Client Data Repair...');
        await sequelize.authenticate();
        console.log('Database connected.');

        const projects = await Project.findAll();
        console.log(`Found ${projects.length} projects to check.`);

        for (const project of projects) {
            if (!project.client_id) {
                console.log(`Skipping Project ID ${project.id} - No Client ID linked.`);
                continue;
            }

            const client = await Client.findByPk(project.client_id);
            if (!client) {
                console.log(`Project ID ${project.id} links to non-existent Client ID ${project.client_id}.`);
                continue;
            }

            // Prepare updates for the "Flat" redundant fields
            const updates: any = {};

            // Sync redundant client fields from master Client record
            if (project.client_name !== client.company_name) updates.client_name = client.company_name;
            if (project.client_contact_person !== client.contact_person) updates.client_contact_person = client.contact_person;
            if (project.client_email !== client.email) updates.client_email = client.email;
            if (project.client_phone !== client.phone) updates.client_phone = client.phone;
            if (project.client_address !== client.address) updates.client_address = client.address;
            if (project.client_gst_number !== client.gstin) updates.client_gst_number = client.gstin;
            if (project.client_pan_number !== client.pan) updates.client_pan_number = client.pan;

            // Sync compatibility fields
            if (project.client_gstin !== client.gstin) updates.client_gstin = client.gstin;
            if (project.client_ho_address !== client.address) updates.client_ho_address = client.address;

            // Site state code
            if (!project.site_state_code && client.gstin) {
                updates.site_state_code = getStateCodeFromGST(client.gstin);
            }

            if (Object.keys(updates).length > 0) {
                console.log(`Updating Project ${project.id} (${project.name})...`);
                await project.update(updates);
                console.log(`✅ Project ${project.id} fixed.`);
            } else {
                console.log(`Project ${project.id} is already synchronized.`);
            }
        }

        console.log('Repair process complete.');

    } catch (error) {
        console.error('Error repairing data:', error);
    } finally {
        process.exit();
    }
};

fixProjectClientData();
