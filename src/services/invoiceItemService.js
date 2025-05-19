/**
 * Invoice Item Service
 * Handles all operations related to invoice items using the Apper SDK
 */

// Get the table name and fields from the database schema
const TABLE_NAME = 'invoice_item';

// Fields that can be updated by users (explicitly exclude system fields)
const UPDATEABLE_FIELDS = [
  'Name', 
  'Tags', 
  'Owner',
  'invoice',
  'description',
  'quantity',
  'rate',
  'amount'
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
 * Fetch all invoice items with optional filters
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} - The invoice items
 */
export const fetchInvoiceItems = async (filters = {}) => {
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
    console.error("Error fetching invoice items:", error);
    throw error;
  }
};

/**
 * Create a new invoice item
 * @param {Object} invoiceItemData - The invoice item data
 * @returns {Promise<Object>} - The created invoice item
 */
export const createInvoiceItem = async (invoiceItemData) => {
  try {
    const apperClient = getApperClient();
    const filteredData = filterUpdateableFields(invoiceItemData);
    
    const response = await apperClient.createRecord(TABLE_NAME, {
      records: [filteredData]
    });
    
    return response.results[0].data;
  } catch (error) {
    console.error("Error creating invoice item:", error);
    throw error;
  }
};

/**
 * Create multiple invoice items in a batch operation
 * @param {Array<Object>} items - The array of invoice item data objects
 * @returns {Promise<Array>} - The created invoice items
 */
export const createInvoiceItems = async (items) => {
  try {
    const apperClient = getApperClient();
    const filteredItems = items.map(item => filterUpdateableFields(item));
    
    const response = await apperClient.createRecord(TABLE_NAME, {
      records: filteredItems
    });
    
    // Return array of successfully created items
    return response.results
      .filter(result => result.success)
      .map(result => result.data);
      
  } catch (error) {
    console.error("Error bulk creating invoice items:", error);
    throw error;
  }
};

/**
 * Delete an invoice item
 * @param {string} id - The ID of the invoice item to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteInvoiceItem = async (id) => {
  try {
    const apperClient = getApperClient();
    const response = await apperClient.deleteRecord(TABLE_NAME, {
      RecordIds: [id]
    });
    
    return response.success;
  } catch (error) {
    console.error(`Error deleting invoice item ${id}:`, error);
    throw error;
  }
};