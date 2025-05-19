/**
 * Time Entry Service
 * Handles all operations related to time entries using the Apper SDK
 */

// Get the table name and fields from the database schema
const TABLE_NAME = 'time_entry';

// Fields that can be updated by users (explicitly exclude system fields)
const UPDATEABLE_FIELDS = [
  'Name', 
  'Tags', 
  'Owner', 
  'description', 
  'date', 
  'startTime', 
  'endTime', 
  'duration', 
  'client', 
  'project', 
  'category', 
  'rate', 
  'billable', 
  'invoiced', 
  'invoiceId'
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
 * Fetch all time entries with optional filters
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} - The time entries
 */
export const fetchTimeEntries = async (filters = {}) => {
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
    console.error("Error fetching time entries:", error);
    throw error;
  }
};

/**
 * Create a new time entry
 * @param {Object} timeEntryData - The time entry data
 * @returns {Promise<Object>} - The created time entry
 */
export const createTimeEntry = async (timeEntryData) => {
  try {
    const apperClient = getApperClient();
    const filteredData = filterUpdateableFields(timeEntryData);
    
    const response = await apperClient.createRecord(TABLE_NAME, {
      records: [filteredData]
    });
    
    return response.results[0].data;
  } catch (error) {
    console.error("Error creating time entry:", error);
    throw error;
  }
};

/**
 * Update an existing time entry
 * @param {string} id - The ID of the time entry to update
 * @param {Object} timeEntryData - The updated time entry data
 * @returns {Promise<Object>} - The updated time entry
 */
export const updateTimeEntry = async (id, timeEntryData) => {
  try {
    const apperClient = getApperClient();
    const filteredData = filterUpdateableFields(timeEntryData);
    
    const response = await apperClient.updateRecord(TABLE_NAME, {
      records: [{
        Id: id,
        ...filteredData
      }]
    });
    
    return response.results[0].data;
  } catch (error) {
    console.error(`Error updating time entry ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a time entry
 * @param {string} id - The ID of the time entry to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteTimeEntry = async (id) => {
  try {
    const apperClient = getApperClient();
    const response = await apperClient.deleteRecord(TABLE_NAME, {
      RecordIds: [id]
    });
    
    return response.success;
  } catch (error) {
    console.error(`Error deleting time entry ${id}:`, error);
    throw error;
  }
};