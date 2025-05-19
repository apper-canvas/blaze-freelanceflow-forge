import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

// Generate an invoice number with a specific format: INV-YYYY-XXXX
const generateInvoiceNumber = (invoices) => {
  const year = new Date().getFullYear();
  const lastInvoice = invoices
    .filter(inv => inv.invoiceNumber.includes(`INV-${year}`))
    .sort((a, b) => {
      const numA = parseInt(a.invoiceNumber.split('-')[2]);
      const numB = parseInt(b.invoiceNumber.split('-')[2]);
      return numB - numA;
    })[0];
  
  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }
  
  return `INV-${year}-${nextNumber.toString().padStart(4, '0')}`;
};

// Sample invoice data
const initialInvoices = [
  {
    id: uuidv4(),
    invoiceNumber: 'INV-2023-0001',
    clientId: 2,
    issueDate: '2023-06-30',
    dueDate: '2023-07-15',
    status: 'paid',
    items: [
      {
        id: uuidv4(),
        description: 'Development services',
        quantity: 20,
        rate: 95,
        amount: 1900,
        timeEntryIds: [],
      },
      {
        id: uuidv4(),
        description: 'Design consulting',
        quantity: 5,
        rate: 85,
        amount: 425,
        timeEntryIds: [],
      }
    ],
    subtotal: 2325,
    tax: 0,
    total: 2325,
    notes: 'Thank you for your business!',
    paymentTerms: 'Net 15',
  }
];

const initialState = {
  invoices: initialInvoices,
  currentInvoice: null,
  loading: false,
  error: null,
};

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    createInvoice: (state, action) => {
      const { clientId, timeEntryIds, items, issueDate, dueDate, notes, paymentTerms } = action.payload;
      
      // Calculate invoice totals
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const tax = action.payload.tax || 0;
      const total = subtotal + tax;
      
      const newInvoice = {
        id: uuidv4(),
        invoiceNumber: generateInvoiceNumber(state.invoices),
        clientId,
        issueDate: issueDate || new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft',
        items,
        subtotal,
        tax,
        total,
        notes: notes || 'Thank you for your business!',
        paymentTerms: paymentTerms || 'Net 15',
        timeEntryIds,
      };
      
      state.invoices.push(newInvoice);
      state.currentInvoice = newInvoice;
      return state;
    },
    updateInvoice: (state, action) => {
      const { id, ...updates } = action.payload;
      const index = state.invoices.findIndex(invoice => invoice.id === id);
      
      if (index !== -1) {
        // Recalculate totals if items are updated
        if (updates.items) {
          updates.subtotal = updates.items.reduce((sum, item) => sum + item.amount, 0);
          updates.total = updates.subtotal + (updates.tax || state.invoices[index].tax);
        }
        
        state.invoices[index] = { ...state.invoices[index], ...updates };
        
        if (state.currentInvoice && state.currentInvoice.id === id) {
          state.currentInvoice = state.invoices[index];
        }
      }
    },
    deleteInvoice: (state, action) => {
      state.invoices = state.invoices.filter(invoice => invoice.id !== action.payload);
      if (state.currentInvoice && state.currentInvoice.id === action.payload) {
        state.currentInvoice = null;
      }
    },
    setCurrentInvoice: (state, action) => {
      state.currentInvoice = state.invoices.find(invoice => invoice.id === action.payload) || null;
    },
    clearCurrentInvoice: (state) => {
      state.currentInvoice = null;
    }
  }
});

export const { createInvoice, updateInvoice, deleteInvoice, setCurrentInvoice, clearCurrentInvoice } = invoiceSlice.actions;

export default invoiceSlice.reducer;