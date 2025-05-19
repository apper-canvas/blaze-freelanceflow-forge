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

// Mock client data - in a real app, this would come from an API
const clients = [
  { id: 1, name: 'Acme Corporation', contactName: 'John Smith', email: 'john@acme.com', phone: '(555) 123-4567', status: 'active', address: '123 Main St, Suite 100, San Francisco, CA 94105' },
  { id: 2, name: 'Globex Industries', contactName: 'Jane Brown', email: 'jane@globex.com', phone: '(555) 987-6543', status: 'active', address: '456 Market St, Chicago, IL 60601' },
  { id: 3, name: 'Stark Enterprises', contactName: 'Tony Rogers', email: 'tony@stark.com', phone: '(555) 111-2222', status: 'inactive', address: '789 Broadway, New York, NY 10003' },
];

function Invoices() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { invoices, currentInvoice, loading } = useSelector((state) => state.invoices);
  const { timeEntries, loading: timeEntriesLoading } = useSelector((state) => state.timeTracking);
  const { isAuthenticated } = useContext(AuthContext);
  
  // Local state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTimeEntries, setSelectedTimeEntries] = useState([]);
  const [invoiceFormData, setInvoiceFormData] = useState({
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Thank you for your business!',
    paymentTerms: 'Net 15',
    tax: 0
  });
  
  // Fetch invoices when component mounts
  useEffect(() => {
    async function loadInvoices() {
      try {
        // Fetch invoices from the service
        const data = await fetchInvoices();
        
        // Transform API data to match component's expected structure
        const formattedInvoices = data.map(invoice => ({
          id: invoice.Id,
          invoiceNumber: invoice.invoiceNumber,
          client: invoice.client,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          status: invoice.status || 'draft',
          subtotal: parseFloat(invoice.subtotal) || 0,
          tax: parseFloat(invoice.tax) || 0,
          total: parseFloat(invoice.total) || 0,
          notes: invoice.notes,
          paymentTerms: invoice.paymentTerms
        }));
        
        // Set the invoices in Redux store
        dispatch(setInvoices(formattedInvoices));
      } catch (error) {
        console.error("Error loading invoices:", error);
      }
    }
  }, [user?.Id]);
  
  // Get client by ID
  const getClient = (clientId) => {
    return clients.find(c => c.id === clientId) || null;
  };
  
  // Get billable, uninvoiced time entries for a client
  const getClientTimeEntries = (clientId) => {
    return timeEntries.filter(entry => 
      entry.clientId === parseInt(clientId) && 
      entry.billable && 
      !entry.invoiced
    );
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Handle client selection change
  const handleClientChange = (e) => {
    const clientId = e.target.value;
    setSelectedClient(clientId);
    setSelectedTimeEntries([]);
    
    if (clientId) {
      // Get available time entries for this client
      const clientEntries = getClientTimeEntries(clientId);
      if (clientEntries.length === 0) {
        toast.info('No billable, uninvoiced time entries found for this client');
      }
    }
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
      setSelectedTimeEntries(allEntryIds);
    }
  };
  
  // Generate invoice from selected time entries
  const handleGenerateInvoice = () => {
    if (!selectedClient || selectedTimeEntries.length === 0) {
      toast.error('Please select a client and at least one time entry');
      return;
    }
    
    // Get selected time entries
    const selectedEntries = timeEntries.filter(entry => 
      selectedTimeEntries.includes(entry.id)
    );
    
    // Group entries by project and description
    const entriesByProject = {};
    for (const entry of selectedEntries) {
      const key = `${entry.projectId}-${entry.description}`;
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
      tax: taxAmount,
      subtotal,
      total
    };
    
    dispatch(createInvoice(newInvoice));
    
    // Mark time entries as invoiced
    for (const entryId of selectedTimeEntries) {
      dispatch(updateTimeEntry({ 
        id: entryId,
        invoiced: true,
        invoiceId: newInvoice.id
      }));
    }
    
    toast.success('Invoice generated successfully!');
    setShowInvoiceForm(false);
    setSelectedClient('');
    setSelectedTimeEntries([]);
  };
  
  // Handle delete invoice
  const handleDeleteInvoice = (id) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      // Find time entries associated with this invoice
      const invoiceTimeEntries = timeEntries.filter(entry => entry.invoiceId === id);
      
      // Update time entries to mark them as not invoiced
      for (const entry of invoiceTimeEntries) {
        dispatch(updateTimeEntry({
          id: entry.id,
          invoiced: false,
          invoiceId: null
        }));
      }
      
      dispatch(deleteInvoice(id));
      toast.success('Invoice deleted successfully!');
    }
  };
  
  // Handle preview invoice
  const handlePreviewInvoice = (id) => {
    dispatch(setCurrentInvoice(id));
    setShowInvoicePreview(true);
  };
  
  // Close invoice preview
  const handleClosePreview = () => {
    setShowInvoicePreview(false);
    dispatch(clearCurrentInvoice());
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="container mx-auto px-4 py-8"
    >
      <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8 mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0">Invoices</h1>
        <button 
          onClick={() => setShowInvoiceForm(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" /> Generate Invoice
        </button>
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
                <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Issue Date</th>
                <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Due Date</th>
                <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Amount</th>
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
                      <td className="px-4 py-3 font-medium">{formatCurrency(invoice.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : invoice.status === 'overdue'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handlePreviewInvoice(invoice.id)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Preview Invoice"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => {/* Download invoice - would integrate with PDF generation */}}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            title="Download Invoice"
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete Invoice"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-surface-500 dark:text-surface-400">
                    No invoices found. Generate a new invoice using your tracked time.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Generate Invoice Modal */}
      {showInvoiceForm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl bg-white dark:bg-surface-800 rounded-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Generate New Invoice</h3>
              <button 
                onClick={() => setShowInvoiceForm(false)}
                className="text-surface-500 hover:text-surface-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="input-group">
                <label className="input-label">Client</label>
                <select 
                  value={selectedClient} 
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
                <div className="input-group">
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
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Select Time Entries</h4>
                  <button 
                    onClick={handleSelectAllEntries}
                    className="text-sm text-primary hover:text-primary-dark"
                  >
                    {getClientTimeEntries(selectedClient).length === selectedTimeEntries.length && 
                     getClientTimeEntries(selectedClient).length > 0 
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
                        <th className="px-4 py-2">Duration</th>
                        <th className="px-4 py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-surface-700">
                      {getClientTimeEntries(selectedClient).length > 0 ? (
                        getClientTimeEntries(selectedClient).map(entry => (
                          <tr 
                            key={entry.id} 
                            className={`hover:bg-surface-50 dark:hover:bg-surface-700/50 cursor-pointer
                              ${selectedTimeEntries.includes(entry.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            onClick={() => handleTimeEntrySelection(entry.id)}
                          >
                            <td className="px-4 py-2">
                              <input 
                                type="checkbox" 
                                checked={selectedTimeEntries.includes(entry.id)}
                                onChange={() => {}}
                                className="h-4 w-4 rounded border-surface-300 dark:border-surface-600 text-primary focus:ring-primary"
                              />
                            </td>
                            <td className="px-4 py-2">{formatDate(entry.date)}</td>
                            <td className="px-4 py-2">{entry.description}</td>
                            <td className="px-4 py-2">{entry.duration.toFixed(2)} hours</td>
                            <td className="px-4 py-2">{formatCurrency(entry.duration * entry.rate)}</td>
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
                
                {selectedTimeEntries.length > 0 && (
                  <div className="mt-4 text-right">
                    <p className="font-medium">
                      Total: {formatCurrency(
                        timeEntries
                          .filter(entry => selectedTimeEntries.includes(entry.id))
                          .reduce((sum, entry) => sum + (entry.duration * entry.rate), 0)
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
                onClick={handleGenerateInvoice}
                className="btn-primary"
                disabled={!selectedClient || selectedTimeEntries.length === 0}
              >
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Invoice Preview Modal */}
      {showInvoicePreview && currentInvoice && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
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
                Close
              </button>
              <button 
                onClick={() => {/* This would download the invoice as PDF */}}
                className="btn-primary"
              >
                <Download size={16} className="mr-2" />
                Download Invoice
              </button>
            </div>
          </div>
      )}
      </motion.div>
      )}
}
  );
}
export default Invoices;