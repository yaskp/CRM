import Client from '../Client'
import ClientGroup from '../ClientGroup'
import ClientContact from '../ClientContact'

// Client belongs to ClientGroup
Client.belongsTo(ClientGroup, {
    foreignKey: 'client_group_id',
    as: 'group',
})

// ClientGroup has many Clients
ClientGroup.hasMany(Client, {
    foreignKey: 'client_group_id',
    as: 'clients',
})

// Client has many ClientContacts
Client.hasMany(ClientContact, {
    foreignKey: 'client_id',
    as: 'contacts',
})

// ClientContact belongs to Client
ClientContact.belongsTo(Client, {
    foreignKey: 'client_id',
    as: 'client',
})

export { Client, ClientGroup, ClientContact }
