import { useState, useEffect, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus, FileText, Download, Eye, Edit, Trash2, DollarSign, 
  CheckCircle, AlertCircle, Clock, Calendar 
} from 'lucide-react';
import { X } from 'lucide-react';
import { AuthContext } from '../App';

import {
  createInvoice, 
  updateInvoice, 
  setInvoices,
  deleteInvoice,
  setCurrentInvoice,
  clearCurrentInvoice
} from '../redux/slices/invoiceSlice';
import { updateTimeEntry } from '../redux/slices/timeTrackingSlice';
import { format } from 'date-fns';

// Services
import { fetchInvoices, createInvoice as createInvoiceService, updateInvoice as updateInvoiceService, deleteInvoice as deleteInvoiceService } from '../services/invoiceService';
import { createInvoiceItems } from '../services/invoiceItemService';
import {
  fetchTimeEntries, 
  updateTimeEntry as updateTimeEntryService 
} from '../services/timeEntryService';
import { fetchClients } from '../services/clientService';

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error("Date formatting error:", error);
    return dateString;
  }
};

// Initial form data
const initialInvoiceFormData = {
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  notes: 'Thank you for your business!',
  paymentTerms: 'Net 15',
  tax: 0,
  status: 'draft'
};

function Invoices() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { invoices, currentInvoice, loading } = useSelector((state) => state.invoices);
  const { timeEntries } = useSelector((state) => state.timeTracking);
  const { isAuthenticated, logout } = useContext(AuthContext);
  
  // Local state
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTimeEntries, setSelectedTimeEntries] = useState([]);
  const [availableTimeEntries, setAvailableTimeEntries] = useState([]);
  const [invoiceFormData, setInvoiceFormData] = useState(initialInvoiceFormData);
  const [formErrors, setFormErrors] = useState({});
  
  // Fetch clients for dropdown
  useEffect(() => {
    async function loadClients() {
      try {
        const clientData = await fetchClients();
        setClients(clientData.map(client => ({
          id: client.Id,
          name: client.Name,
          contactName: client.contactName || 'Contact Not Available',
          email: client.email || 'Email Not Available',
          phone: client.phone || 'Phone Not Available',
          status: client.status || 'active',
          address: client.address || 'Address Not Available'
        })));
      } catch (error) {
        console.error("Error loading clients:", error);
        toast.error("Failed to load client data. Please refresh the page.");
        
        // Fallback for development: if client service fails, use sample data
        if (import.meta.env.DEV) {
          setClients([
            { id: 1, name: 'Acme Corporation', contactName: 'John Smith', email: 'john@acme.com', phone: '(555) 123-4567', status: 'active', address: '123 Main St, Suite 100, San Francisco, CA 94105' },
            { id: 2, name: 'Globex Industries', contactName: 'Jane Brown', email: 'jane@globex.com', phone: '(555) 987-6543', status: 'active', address: '456 Market St, Chicago, IL 60601' },
            { id: 3, name: 'Stark Enterprises', contactName: 'Tony Rogers', email: 'tony@stark.com', phone: '(555) 111-2222', status: 'inactive', address: '789 Broadway, New York, NY 10003' },
          ]);
        }
      }
    }
    loadClients();
  }, [user?.Id]);
  
  // Fetch invoices when component mounts
  useEffect(() => {
    async function loadInvoices() {
      try {
        setIsLoading(true);
        dispatch(setLoading(true));
        
        // Fetch time entries first to make sure we have current data
        const timeEntryData = await fetchTimeEntries();
        
        // Now fetch invoices
        const invoiceData = await fetchInvoices();
        
        // Transform API data to match component's expected structure
        const formattedInvoices = invoiceData.map(invoice => ({
          id: invoice.Id,
          invoiceNumber: invoice.invoiceNumber || `INV-${new Date().getFullYear()}-0001`,
          clientId: clients.find(c => c.name === invoice.client)?.id || null,
          client: invoice.client,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          status: invoice.status || 'draft',
          subtotal: parseFloat(invoice.subtotal) || 0,
          tax: parseFloat(invoice.tax) || 0,
          total: parseFloat(invoice.total) || 0,
          notes: invoice.notes,
          paymentTerms: invoice.paymentTerms,
          // For newly fetched invoices, we might not have items yet
          items: invoice.items || []
        }));
        
        // Set the invoices in Redux store
        dispatch(setInvoices(formattedInvoices));
      } catch (error) {
        console.error("Error loading invoices:", error);
        toast.error("Failed to load invoices. Please refresh the page.");
      } finally {
        setIsLoading(false);
        dispatch(setLoading(false));
      }
    }
    
    if (clients.length > 0) {
      loadInvoices();
    }
  }, [dispatch, clients, user?.Id]);
  
  // Handle client selection change
  const handleClientChange = (e) => {
    const clientId = e.target.value;
    setSelectedClient(clientId);
    setSelectedTimeEntries([]);
    setFormErrors({});
    
    if (clientId) {
      // Get available time entries for this client
      const clientEntries = getClientTimeEntries(parseInt(clientId));
      setAvailableTimeEntries(clientEntries);
      if (clientEntries.length === 0) {
        toast.info('No billable, uninvoiced time entries found for this client');
      }
    }
  };

  // Get client by ID
  const getClient = (clientId) => {
    return clients.find(c => c.id === clientId || c.id === parseInt(clientId)) || null;
  };
  
  // Get billable, uninvoiced time entries for a client
  const getClientTimeEntries = (clientId) => {
    if (!clientId) return [];
    
    return timeEntries.filter(entry => 
      (entry.clientId === clientId || entry.client === getClient(clientId)?.name) && 
      entry.billable && 
      !entry.invoiced
    );
  };
  
  // Handle time entry selection
  const handleTimeEntrySelection = (entryId) => {
    setSelectedTimeEntries(prev => {
      if (prev.includes(entryId)) {
        return prev.filter(id => id !== entryId);
      } else {
        return [...prev, entryId];
      }
    });
  };
  
  // Select all time entries
  const handleSelectAllEntries = () => {
    if (!selectedClient) return;
    
    const clientEntries = getClientTimeEntries(selectedClient);
    const allEntryIds = clientEntries.map(entry => entry.id);
    
    // If all are already selected, deselect all
    if (allEntryIds.length === selectedTimeEntries.length && 
        allEntryIds.every(id => selectedTimeEntries.includes(id))) {
      setSelectedTimeEntries([]);
    } else {
    setFormErrors({});
      setSelectedTimeEntries(allEntryIds);
    }
  };
  
  // Generate invoice from selected time entries
  const handleGenerateInvoice = () => {
    const clientEntries = availableTimeEntries;
      toast.error('Please select a client and at least one time entry');
      return;
    }
    
    // Get selected time entries
    const selectedEntries = timeEntries.filter(entry => 
      selectedTimeEntries.includes(entry.id)
    );
    
    setFormErrors({});
    // Group entries by project and description
    const entriesByProject = {};
    for (const entry of selectedEntries) {
  const handleGenerateInvoice = async () => {
      if (!entriesByProject[key]) {
        entriesByProject[key] = {
          entries: [],
          projectId: entry.projectId,
          description: entry.description,
          rate: entry.rate,
          quantity: 0,
          amount: 0
        };
      }
      entriesByProject[key].entries.push(entry);
      entriesByProject[key].quantity += entry.duration;
      entriesByProject[key].amount += entry.duration * entry.rate;
    }
    
    // Create invoice items
    const items = Object.values(entriesByProject).map(group => ({
      id: uuidv4(),
      description: `${group.description} (Project #${group.projectId})`,
      quantity: parseFloat(group.quantity.toFixed(2)),
      rate: group.rate,
      amount: parseFloat(group.amount.toFixed(2)),
      timeEntryIds: group.entries.map(e => e.id)
    }));
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = parseFloat(invoiceFormData.tax) || 0;
    const taxAmount = subtotal * (tax / 100);
    const total = subtotal + taxAmount;
    
    // Create invoice
    const newInvoice = {
      id: uuidv4(),
      clientId: parseInt(selectedClient),
      timeEntryIds: selectedTimeEntries,
      items,
      ...invoiceFormData,

    try {
      setIsSubmitting(true);
      // Prepare invoice data for the API
      const client = getClient(parseInt(selectedClient));
      const invoiceData = {
        Name: `Invoice for ${client?.name || 'Client'}`,
        client: client?.name,
        issueDate: invoiceFormData.issueDate,
        dueDate: invoiceFormData.dueDate,
        status: 'draft',
        subtotal: subtotal.toFixed(2),
        tax: taxAmount.toFixed(2),
        total: total.toFixed(2),
        notes: invoiceFormData.notes,
        paymentTerms: invoiceFormData.paymentTerms
      };
      
      // Create invoice in the backend
      const createdInvoice = await createInvoiceService(invoiceData);
      
      // Prepare invoice items
      const invoiceItemsData = items.map(item => ({
        Name: item.description,
        invoice: createdInvoice.Id,
        description: item.description,
        quantity: item.quantity.toString(),
        rate: item.rate.toString(),
        amount: item.amount.toString()
      }));
      
      // Create invoice items
      if (invoiceItemsData.length > 0) {
        await createInvoiceItems(invoiceItemsData);
      }
      
      // Mark time entries as invoiced
      for (const entryId of selectedTimeEntries) {
        await updateTimeEntryService(entryId, {
          invoiced: true,
          invoiceId: createdInvoice.Id
        });
        
        // Update in Redux state as well
        dispatch(updateTimeEntry({ 
          id: entryId,
          invoiced: true,
          invoiceId: createdInvoice.Id
        }));
      }
      
      // Create the full invoice object for Redux
      const newInvoice = {
        id: createdInvoice.Id,
        invoiceNumber: createdInvoice.invoiceNumber || `INV-${new Date().getFullYear()}-0001`,
        clientId: parseInt(selectedClient),
        client: client?.name,
        timeEntryIds: selectedTimeEntries,
        items,
        ...invoiceFormData,
        tax: taxAmount,
        subtotal,
        total,
        status: 'draft'
      };
      
      // Update Redux state
      dispatch(createInvoice(newInvoice));
      
      toast.success('Invoice generated successfully!');
      resetForm();
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice. Please try again.");
    } finally {
      setIsSubmitting(false);
  // Handle delete invoice
  };
  
  // Reset form to initial state
  const resetForm = () => {
      // Find time entries associated with this invoice
      const invoiceTimeEntries = timeEntries.filter(entry => entry.invoiceId === id);
      
    setInvoiceFormData(initialInvoiceFormData);
    setFormErrors({});
      // Update time entries to mark them as not invoiced
      for (const entry of invoiceTimeEntries) {
        dispatch(updateTimeEntry({
  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      // Delete invoice from the backend
      await deleteInvoiceService(id);
      
      // Find time entries associated with this invoice
      const invoiceTimeEntries = timeEntries.filter(entry => 
        entry.invoiceId === id || entry.invoiceId === parseInt(id)
      );
      
      // Update time entries in the backend and Redux
      for (const entry of invoiceTimeEntries) {
        try {
          // Update in the backend
          await updateTimeEntryService(entry.id, {
            invoiced: false,
            invoiceId: null
          });
          
          // Update in Redux
          dispatch(updateTimeEntry({
            id: entry.id,
            invoiced: false,
            invoiceId: null
          }));
        } catch (entryError) {
          console.error(`Error updating time entry ${entry.id}:`, entryError);
        }
  const handlePreviewInvoice = (id) => {
    dispatch(setCurrentInvoice(id));
      // Update Redux state
    setShowInvoicePreview(true);
  };
    } catch (error) {
      console.error(`Error deleting invoice ${id}:`, error);
      toast.error("Failed to delete invoice. Please try again.");
    } finally {
      setIsDeleting(false);
  
  // Close invoice preview
  const handleClosePreview = () => {
    setShowInvoicePreview(false);
    dispatch(clearCurrentInvoice());
    try {
      dispatch(setCurrentInvoice(id));
      setShowInvoicePreview(true);
    } catch (error) {
      console.error("Error previewing invoice:", error);
      toast.error("Failed to preview invoice. Please try again.");
    }
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="container mx-auto px-4 py-8"
    >
  
  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    if (!selectedClient) {
      errors.client = "Please select a client";
    }
    
    if (selectedTimeEntries.length === 0) {
      errors.timeEntries = "Please select at least one time entry";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
      initial={{ opacity: 1 }}
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="container mx-auto px-4 py-8">
      </div>
      
      {/* Invoice List */}
      <div className="card mb-8 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-surface-800/70 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        <h3 className="text-lg font-semibold mb-4">Invoice List</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-100 dark:bg-surface-700 text-left">
              <tr>
                <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Invoice #</th>
                <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Client</th>

                <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Due Date</th>
      <div className="card mb-8 relative overflow-hidden">
                <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Status</th>
                <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-surface-700">
              {invoices.length > 0 ? (
                invoices.map(invoice => {
                  const client = getClient(invoice.clientId);
                  return (
                    <tr key={invoice.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/50">
                      <td className="px-4 py-3 font-medium">{invoice.invoiceNumber}</td>
                      <td className="px-4 py-3">{client ? client.name : 'Unknown Client'}</td>
                      <td className="px-4 py-3">{formatDate(invoice.issueDate)}</td>
                      <td className="px-4 py-3">{formatDate(invoice.dueDate)}</td>
                <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium hidden md:table-cell">Issue Date</th>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : invoice.status === 'overdue'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mr-3"></div>
                      Loading invoices...
                    </div>
                  </td>
                </tr>
              ) : invoices.length > 0 ? (
                          }`}
                  const client = getClient(invoice.clientId) || { name: invoice.client || 'Unknown Client' };
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{client.name}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{formatDate(invoice.issueDate)}</td>
                          <button 
                            onClick={() => handlePreviewInvoice(invoice.id)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Preview Invoice"
                          ${invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}
                          >
                          {invoice.status || 'draft'}
                          </button>
                          <button 
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          <button onClick={() => handlePreviewInvoice(invoice.id)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" title="Preview Invoice">
                      </td>
                    </tr>
                          <button onClick={() => toast.info("PDF generation would be implemented here")} 
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300" 
                            title="Download Invoice" 
                  <td colSpan="7" className="px-4 py-6 text-center text-surface-500 dark:text-surface-400">
                    No invoices found. Generate a new invoice using your tracked time.
                  </td>
                </tr>
              )}
            </tbody>
                            disabled={isDeleting}
                            aria-busy={isDeleting}
                            >
        </div>
      </div>
      
      {/* Generate Invoice Modal */}
      {showInvoiceForm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl bg-white dark:bg-surface-800 rounded-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Generate New Invoice</h3>
                  <td colSpan="7" className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FileText size={48} className="text-surface-400 mb-3" />
                      <p className="text-surface-500 dark:text-surface-400">No invoices found. Generate a new invoice using your tracked time.</p>
                    </div>                  </td>
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="input-group">
                <label className="input-label">Client</label>
                <select 
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
                  onChange={handleClientChange}
                  className="input-field"
                  required
                >
                  <option value="">Select Client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className={`input-group ${formErrors.client ? 'mb-1' : ''}`}>
                  <label className="input-label">Issue Date</label>
                  <input 
                    type="date" 
                    value={invoiceFormData.issueDate}
                    onChange={(e) => setInvoiceFormData({...invoiceFormData, issueDate: e.target.value})}
                    className="input-field"
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label">Due Date</label>
                  <input 
                    type="date" 
              {formErrors.client && (
                <p className="text-red-600 text-sm mt-1">{formErrors.client}</p>
              )}
                    value={invoiceFormData.dueDate}
                    onChange={(e) => setInvoiceFormData({...invoiceFormData, dueDate: e.target.value})}
                    className="input-field"
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label">Payment Terms</label>
                  <input 
                    type="text" 
                    value={invoiceFormData.paymentTerms}
                    onChange={(e) => setInvoiceFormData({...invoiceFormData, paymentTerms: e.target.value})}
                    className="input-field"
                    placeholder="e.g. Net 15, Net 30"
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label">Tax Rate (%)</label>
                  <input 
                    type="number" 
                    value={invoiceFormData.tax}
                    onChange={(e) => setInvoiceFormData({...invoiceFormData, tax: e.target.value})}
                    className="input-field"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="input-group">
                <label className="input-label">Notes</label>
                <textarea 
                  value={invoiceFormData.notes}
                  onChange={(e) => setInvoiceFormData({...invoiceFormData, notes: e.target.value})}
                  className="input-field"
                  rows="3"
                ></textarea>
              </div>
            </div>

            {selectedClient && (
              <div className="mb-6">
                <div className={`flex items-center justify-between mb-3 ${formErrors.timeEntries ? 'mb-1' : ''}`}>
                  <h4 className="font-semibold">Select Time Entries</h4>
                  <button 
                    type="button"
                    onClick={handleSelectAllEntries}
                    className="text-sm text-primary hover:text-primary-dark"
                    disabled={availableTimeEntries.length === 0}
                  >
                    {availableTimeEntries.length === selectedTimeEntries.length && 
                     availableTimeEntries.length > 0 
                     ? 'Deselect All' 
                     : 'Select All'}
                  </button>
                </div>
                
                <div className="max-h-64 overflow-y-auto border border-surface-200 dark:border-surface-700 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-surface-100 dark:bg-surface-700 text-left">
                      <tr>
                        <th className="px-4 py-2 w-6"></th>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Description</th>
                        <th className="px-4 py-2 text-right">Duration</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-surface-700">
                      {availableTimeEntries.length > 0 ? (
                        availableTimeEntries.map(entry => (
                          <tr 
                            key={entry.id} 
                            className={`hover:bg-surface-50 dark:hover:bg-surface-700/50 cursor-pointer
                              ${selectedTimeEntries.includes(entry.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            onClick={() => handleTimeEntrySelection(entry.id)}
                          >
                            <td className="px-4 py-2 text-center">
                              <input 
                                type="checkbox" 
                                checked={selectedTimeEntries.includes(entry.id)}
                                readOnly
                                className="h-4 w-4 rounded border-surface-300 dark:border-surface-600 text-primary focus:ring-primary"
                              />
                            </td>
                            <td className="px-4 py-2">{formatDate(entry.date)}</td>
                            <td className="px-4 py-2">{entry.description || `Work for ${getClient(entry.clientId)?.name || 'client'}`}</td>
                            <td className="px-4 py-2 text-right">{parseFloat(entry.duration).toFixed(2)} hrs</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(entry.duration * entry.rate)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-4 py-3 text-center text-surface-500 dark:text-surface-400">
                            No billable, uninvoiced time entries for this client.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {formErrors.timeEntries && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.timeEntries}</p>
                )}
                
                {selectedTimeEntries.length > 0 && (
                  <div className="mt-4 text-right">
                    <p className="font-medium">
                      Total: {formatCurrency(
                        timeEntries
                          .filter(entry => selectedTimeEntries.includes(entry.id))
                          .reduce((sum, entry) => sum + (parseFloat(entry.duration) * parseFloat(entry.rate)), 0)
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowInvoiceForm(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button 
                onClick={() => validateForm() && handleGenerateInvoice()}
                className="btn-primary"
                disabled={isSubmitting || !selectedClient || selectedTimeEntries.length === 0}
                aria-busy={isSubmitting}
              >
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Invoice Preview Modal */}
      {showInvoicePreview && currentInvoice && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-surface-800 rounded-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Invoice Preview</h3>
              <button 
                onClick={handleClosePreview}
                className="text-surface-500 hover:text-surface-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="card bg-white dark:bg-surface-800 p-6 max-w-4xl mx-auto">
              <div className="flex justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-1">FreelanceFlow</h2>
                  <p className="text-surface-500 dark:text-surface-400">Your Business Address</p>
                  <p className="text-surface-500 dark:text-surface-400">City, State ZIP</p>
                  <p className="text-surface-500 dark:text-surface-400">Phone: (123) 456-7890</p>
                  <p className="text-surface-500 dark:text-surface-400">Email: contact@yourcompany.com</p>
                </div>
                <div className="text-right">
                  <h1 className="text-2xl font-bold mb-2">INVOICE</h1>
                  <p className="text-lg font-semibold">{currentInvoice.invoiceNumber}</p>
                  <p className="text-surface-500 dark:text-surface-400">
                    Issue Date: {formatDate(currentInvoice.issueDate)}
                  </p>
                  <p className="text-surface-500 dark:text-surface-400">
                    Due Date: {formatDate(currentInvoice.dueDate)}
                  </p>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2">Bill To:</h3>
                {(() => {
                  const client = getClient(currentInvoice.clientId);
                  return client ? (
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-surface-500 dark:text-surface-400">Attn: {client.contactName}</p>
                      <p className="text-surface-500 dark:text-surface-400">{client.address}</p>
                      <p className="text-surface-500 dark:text-surface-400">
                        Email: {client.email}
                      </p>
                      <p className="text-surface-500 dark:text-surface-400">
                        Phone: {client.phone}
                      </p>
                    </div>
                  ) : (
                    <p>Client information not available</p>
                  );
                })()}
              </div>
              
              <div className="mb-6">
                <table className="w-full">
                  <thead className="bg-surface-100 dark:bg-surface-700 text-left border-b dark:border-surface-600">
                    <tr>
                      <th className="px-4 py-2 text-surface-600 dark:text-surface-300 font-semibold">Description</th>
                      <th className="px-4 py-2 text-surface-600 dark:text-surface-300 font-semibold text-right">Qty (hrs)</th>
                      <th className="px-4 py-2 text-surface-600 dark:text-surface-300 font-semibold text-right">Rate</th>
                      <th className="px-4 py-2 text-surface-600 dark:text-surface-300 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-surface-700">
                    {currentInvoice.items.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">{item.description}</td>
                        <td className="px-4 py-3 text-right">{item.quantity.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(item.rate)}/hr</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-surface-300 dark:border-surface-600 font-medium">
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right">Subtotal:</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(currentInvoice.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right">Tax:</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(currentInvoice.tax)}</td>
                    </tr>
                    <tr className="text-lg">
                      <td colSpan="3" className="px-4 py-3 text-right font-bold">Total:</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(currentInvoice.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="border-t border-surface-300 dark:border-surface-600 pt-4">
                <h4 className="font-semibold mb-2">Payment Terms</h4>
                <p className="text-surface-600 dark:text-surface-400 mb-4">{currentInvoice.paymentTerms}</p>
                
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-surface-600 dark:text-surface-400">{currentInvoice.notes}</p>
              </div>
            </div>
            
            <div className="flex justify-end mt-6 space-x-2">
              <button 
                onClick={handleClosePreview}
                className="btn-outline"
              >
                onClick={() => toast.info("PDF generation would be implemented here")}
              </button>
              <button 
                onClick={() => {/* This would download the invoice as PDF */}}
                className="btn-primary"
              >
                <Download size={16} className="mr-2" />
                Download Invoice
        </div>
              </button>
    </motion.div>
  );}export default Invoices;
      </motion.div>
export default Invoices;
  );