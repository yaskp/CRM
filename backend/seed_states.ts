
import { State } from './src/models';

const indianStates = [
    { name: 'Jammu and Kashmir', state_code: '01' },
    { name: 'Himachal Pradesh', state_code: '02' },
    { name: 'Punjab', state_code: '03' },
    { name: 'Chandigarh', state_code: '04' },
    { name: 'Uttarakhand', state_code: '05' },
    { name: 'Haryana', state_code: '06' },
    { name: 'Delhi', state_code: '07' },
    { name: 'Rajasthan', state_code: '08' },
    { name: 'Uttar Pradesh', state_code: '09' },
    { name: 'Bihar', state_code: '10' },
    { name: 'Sikkim', state_code: '11' },
    { name: 'Arunachal Pradesh', state_code: '12' },
    { name: 'Nagaland', state_code: '13' },
    { name: 'Manipur', state_code: '14' },
    { name: 'Mizoram', state_code: '15' },
    { name: 'Tripura', state_code: '16' },
    { name: 'Meghalaya', state_code: '17' },
    { name: 'Assam', state_code: '18' },
    { name: 'West Bengal', state_code: '19' },
    { name: 'Jharkhand', state_code: '20' },
    { name: 'Odisha', state_code: '21' },
    { name: 'Chhattisgarh', state_code: '22' },
    { name: 'Madhya Pradesh', state_code: '23' },
    { name: 'Gujarat', state_code: '24' },
    { name: 'Dadra and Nagar Haveli and Daman and Diu', state_code: '26' },
    { name: 'Maharashtra', state_code: '27' },
    { name: 'Andhra Pradesh (Old)', state_code: '28' },
    { name: 'Karnataka', state_code: '29' },
    { name: 'Goa', state_code: '30' },
    { name: 'Lakshadweep', state_code: '31' },
    { name: 'Kerala', state_code: '32' },
    { name: 'Tamil Nadu', state_code: '33' },
    { name: 'Puducherry', state_code: '34' },
    { name: 'Andaman and Nicobar Islands', state_code: '35' },
    { name: 'Telangana', state_code: '36' },
    { name: 'Andhra Pradesh (New)', state_code: '37' },
    { name: 'Ladakh', state_code: '38' },
    { name: 'Other Territory', state_code: '97' },
];

const seedStates = async () => {
    try {
        console.log('Syncing State table...');
        await State.sync({ force: true });

        console.log('Seeding States...');
        await State.bulkCreate(indianStates);

        console.log('States seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedStates();
