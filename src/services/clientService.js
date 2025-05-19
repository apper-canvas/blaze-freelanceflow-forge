/**
 * Client Service
 * 
 * This is a temporary service that provides client data.
 * In a real implementation, this would fetch from a client database table.
 */

// Mock client data until we implement a clients table
const clients = [
  { id: 1, name: 'Acme Corporation', contactName: 'John Smith', email: 'john@acme.com', phone: '(555) 123-4567', status: 'active', address: '123 Main St, Suite 100, San Francisco, CA 94105' },
  { id: 2, name: 'Globex Industries', contactName: 'Jane Brown', email: 'jane@globex.com', phone: '(555) 987-6543', status: 'active', address: '456 Market St, Chicago, IL 60601' },
  { id: 3, name: 'Stark Enterprises', contactName: 'Tony Rogers', email: 'tony@stark.com', phone: '(555) 111-2222', status: 'inactive', address: '789 Broadway, New York, NY 10003' },
];

/**
 * Get all clients
 * @returns {Array} List of clients
 */
export const getClients = () => clients;

/**
 * Get a client by ID
 * @param {number} id - Client ID
 * @returns {Object|null} Client or null if not found
 */
export const getClientById = (id) => {
  return clients.find(client => client.id === Number(id)) || null;
};