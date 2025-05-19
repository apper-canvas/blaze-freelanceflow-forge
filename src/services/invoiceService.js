/**
 * Invoice Service
 * Handles all operations related to invoices using the Apper SDK
 */

// Get the table name and fields from the database schema
const TABLE_NAME = 'invoice';

// Fields that can be updated by users (explicitly exclude system fields)
const UPDATEABLE_FIELDS = [
  'Name', 
  'Tags', 
  'Owner', 
  'invoiceNumber', 
  'client', 
  'issueDate', 
  'dueDate', 
  'status', 
  'subtotal', 
  'tax', 
  'total', 
  'notes', 
  'paymentTerms'
];

/**
 * Initialize the ApperClient
 * @returns {Object} The initialized ApperClient
 */
const getApperClient = () => {
  const { ApperClient } = window.ApperSDK;
  return new ApperClient({
    apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
    apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
  });
};

/**
 * Filter an object to only include updateable fields
 * @param {Object} data - The record data
 * @returns {Object} - Data with only updateable fields
 */
const filterUpdateableFields = (data) => {
  return Object.keys(data).reduce((filtered, key) => {
    if (UPDATEABLE_FIELDS.includes(key)) {
      filtered[key] = data[key];
    }
    return filtered;
  }, {});
};

/**
 * Fetch all invoices with optional filters
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} - The invoices
 */
export const fetchInvoices = async (filters = {}) => {
  try {
    const apperClient = getApperClient();
    
    const params = {
      fields: "*", // Fetch all fields
      pagingInfo: {
        limit: 100 // Default limit
      }
    };
    
    // Add any provided filters
    if (Object.keys(filters).length > 0) {
      params.where = Object.entries(filters).map(([field, value]) => ({
        fieldName: field,
        operator: "ExactMatch",
        values: [value]
      }));
    }
    
    const response = await apperClient.fetchRecords(TABLE_NAME, params);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
};

/**
 * Create a new invoice
 * @param {Object} invoiceData - The invoice data
 * @returns {Promise<Object>} - The created invoice
 */
export const createInvoice = async (invoiceData) => {
  try {
    const apperClient = getApperClient();
    const filteredData = filterUpdateableFields(invoiceData);
    
    const response = await apperClient.createRecord(TABLE_NAME, {
      records: [filteredData]
    });
    
    return response.results[0].data;
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
};

/**
 * Update an existing invoice
 * @param {string} id - The ID of the invoice to update
 * @param {Object} invoiceData - The updated invoice data
 * @returns {Promise<Object>} - The updated invoice
 */
export const updateInvoice = async (id, invoiceData) => {
  try {
    const apperClient = getApperClient();
    const filteredData = filterUpdateableFields(invoiceData);
    
    const response = await apperClient.updateRecord(TABLE_NAME, {
      records: [{
        Id: id,
        ...filteredData
      }]
    });
    
    return response.results[0].data;
  } catch (error) {
    console.error(`Error updating invoice ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an invoice
 * @param {string} id - The ID of the invoice to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteInvoice = async (id) => {
  try {
    const apperClient = getApperClient();
    const response = await apperClient.deleteRecord(TABLE_NAME, {
      RecordIds: [id]
    });
    
    return response.success;
  } catch (error) {
    console.error(`Error deleting invoice ${id}:`, error);
    throw error;
  }
};