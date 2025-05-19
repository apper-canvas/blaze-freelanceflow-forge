import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

// Initial categories for time tracking
const initialCategories = [
  { id: 'dev', name: 'Development', color: '#3b82f6' },
  { id: 'design', name: 'Design', color: '#8b5cf6' },
  { id: 'meeting', name: 'Meeting', color: '#f43f5e' },
  { id: 'research', name: 'Research', color: '#10b981' },
  { id: 'admin', name: 'Administrative', color: '#f59e0b' },
];

// Sample time entries to demonstrate functionality
const initialTimeEntries = [
  {
    id: uuidv4(),
    clientId: 1,
    projectId: 101,
    description: 'Website redesign - Homepage',
    categoryId: 'dev',
    date: '2023-07-15',
    startTime: '09:00',
    endTime: '12:30',
    duration: 3.5, // in hours
    rate: 85, // hourly rate
    billable: true,
    invoiced: false,
    invoiceId: null,
  },
  {
    id: uuidv4(),
    clientId: 2,
    projectId: 201,
    description: 'Client consultation call',
    categoryId: 'meeting',
    date: '2023-07-15',
    startTime: '14:00',
    endTime: '15:00',
    duration: 1, // in hours
    rate: 95, // hourly rate
    billable: true,
    invoiced: false,
    invoiceId: null,
  },
];

const initialState = {
  timeEntries: initialTimeEntries,
  categories: initialCategories,
  activeTimer: null,
  loading: false,
  error: null,
};

const timeTrackingSlice = createSlice({
  name: 'timeTracking',
  initialState,
  reducers: {
    // Time entries CRUD operations
    addTimeEntry: (state, action) => {
      const newEntry = {
        id: uuidv4(),
        ...action.payload,
        invoiced: false,
        invoiceId: null,
      };
      state.timeEntries.push(newEntry);
    },
    updateTimeEntry: (state, action) => {
      const { id, ...updates } = action.payload;
      const index = state.timeEntries.findIndex(entry => entry.id === id);
      if (index !== -1) {
        state.timeEntries[index] = { ...state.timeEntries[index], ...updates };
      }
    },
    deleteTimeEntry: (state, action) => {
      state.timeEntries = state.timeEntries.filter(entry => entry.id !== action.payload);
    },
    // Timer operations
    startTimer: (state, action) => {
      state.activeTimer = {
        clientId: action.payload.clientId || null,
        projectId: action.payload.projectId || null,
        description: action.payload.description || '',
        categoryId: action.payload.categoryId || 'dev',
        startTime: new Date().toISOString(),
      };
    },
    stopTimer: (state) => {
      if (state.activeTimer && state.activeTimer.startTime) {
        const endTime = new Date().toISOString();
        const startDate = new Date(state.activeTimer.startTime);
        const endDate = new Date(endTime);
        const durationInHours = (endDate - startDate) / (1000 * 60 * 60);
        
        // Format the date and times for display and storage
        const date = startDate.toISOString().split('T')[0];
        const formattedStartTime = startDate.getHours().toString().padStart(2, '0') + ':' + startDate.getMinutes().toString().padStart(2, '0');
        const formattedEndTime = endDate.getHours().toString().padStart(2, '0') + ':' + endDate.getMinutes().toString().padStart(2, '0');
        
        // Create time entry from timer
        state.timeEntries.push({
          id: uuidv4(),
          clientId: state.activeTimer.clientId,
          projectId: state.activeTimer.projectId,
          description: state.activeTimer.description,
          categoryId: state.activeTimer.categoryId,
          date,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          duration: parseFloat(durationInHours.toFixed(2)),
          rate: 85, // Default rate, should be from project settings
          billable: true,
          invoiced: false,
          invoiceId: null,
        });
        state.activeTimer = null;
      }
    },
    cancelTimer: (state) => {
      state.activeTimer = null;
    },
    // Categories management
    addCategory: (state, action) => {
      state.categories.push({ ...action.payload, id: uuidv4() });
    },
  },
});

export const { addTimeEntry, updateTimeEntry, deleteTimeEntry, startTimer, stopTimer, cancelTimer, addCategory } = timeTrackingSlice.actions;

export default timeTrackingSlice.reducer;