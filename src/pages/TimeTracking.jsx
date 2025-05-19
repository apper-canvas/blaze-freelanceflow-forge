import { useState, useEffect, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { AuthContext } from '../App';
import { format } from 'date-fns';
import { Plus, Clock, Filter, Edit, Trash2, Calendar, Briefcase, Tag, DollarSign } from 'lucide-react';

// Components
import Timer from '../components/Timer';
import TimeEntryForm from '../components/TimeEntryForm';

// Redux actions
import { 
  setTimeEntries,
  setLoading,
  addTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  startTimer, 
  stopTimer, 
  cancelTimer 
} from '../redux/slices/timeTrackingSlice';

// Services
import { 
  fetchTimeEntries, 
  createTimeEntry, 
  updateTimeEntry as updateTimeEntryService,
  deleteTimeEntry as deleteTimeEntryService
} from '../services/timeEntryService';
import { getClients, getClientById } from '../services/clientService';

// Mock client data - in a real app, this would come from an API
const clients = [
  { id: 1, name: 'Acme Corporation', contactName: 'John Smith', email: 'john@acme.com', phone: '(555) 123-4567', status: 'active' },
  { id: 2, name: 'Globex Industries', contactName: 'Jane Brown', email: 'jane@globex.com', phone: '(555) 987-6543', status: 'active' },
  { id: 3, name: 'Stark Enterprises', contactName: 'Tony Rogers', email: 'tony@stark.com', phone: '(555) 111-2222', status: 'inactive' },
];

function TimeTracking() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { timeEntries, categories, activeTimer, loading } = useSelector((state) => state.timeTracking);
  const { isAuthenticated } = useContext(AuthContext);
  
  // Local state
  const [showForm, setShowForm] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [filterClient, setFilterClient] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBillable, setFilterBillable] = useState('all');
  const [filterDate, setFilterDate] = useState(''); 
  
  // Fetch time entries when component mounts
  useEffect(() => {
    async function loadTimeEntries() {
      try {
        dispatch(setLoading(true));
        const entries = await fetchTimeEntries();
        
        // Transform entries to match the component's expected structure
        const formattedEntries = entries.map(entry => ({
          id: entry.Id,
          client: entry.client,
          projectId: entry.project,
          description: entry.description,
          categoryId: entry.category,
          date: entry.date,
          startTime: entry.startTime,
          endTime: entry.endTime,
          duration: parseFloat(entry.duration),
          rate: parseFloat(entry.rate),
          billable: entry.billable === true,
          invoiced: entry.invoiced === true,
          invoiceId: entry.invoiceId
        }));
        
        dispatch(setTimeEntries(formattedEntries));
      } catch (error) {
        console.error('Error loading time entries:', error);
        toast.error('Failed to load time entries. Please try again later.');
        dispatch(setLoading(false));
      }
    }
    
    if (user?.Id) {
      loadTimeEntries();
    }
  }, [dispatch, user?.Id]);
  
  // Filtered entries
  const filteredEntries = timeEntries.filter(entry => {
    // Updated to handle string client values from database
    if (filterClient && entry.client !== filterClient) return false;
    if (filterCategory && entry.categoryId !== filterCategory &&
      entry.category !== filterCategory) return false;
    if (filterBillable !== 'all' && entry.billable !== (filterBillable === 'billable')) return false; 
    if (filterDate && entry.date !== filterDate) return false;
    return true;
  });
  
  // Sort entries by date and start time (newest first)
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (a.date !== b.date) return new Date(b.date) - new Date(a.date);
    return a.startTime > b.startTime ? 1 : -1; 
  });
  
  // Get client name by ID
  const getClientName = (client) => {
    // If client is already a name string, just return it
    return client || 'Unknown Client';
  };
  
  // Get category by ID
  const getCategory = (categoryId) => {
    return categories.find(c => c.id === categoryId) || { name: 'Uncategorized', color: '#777777' };
  };
  
  // Format duration
  const formatDuration = (hours) => {
    const totalMinutes = Math.round(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };
  
  // Handle timer actions
  const handleStartTimer = () => {
    dispatch(startTimer({
      clientId: filterClient ? parseInt(filterClient) : null,
      categoryId: filterCategory || 'dev'
    }));
    toast.info('Timer started!');
  };
  
  const handleStopTimer = () => {
    dispatch(stopTimer());
    toast.success('Time entry saved!');
  };
  
  const handleCancelTimer = () => {
    dispatch(cancelTimer());
    toast.info('Timer cancelled');
  };
  
  // Handle form actions
  const handleOpenForm = (entry = null) => {
    setCurrentEntry(entry);
    setShowForm(true);

  
    // Show loading state
    dispatch(setLoading(true));
    
    async function saveTimeEntry() {
      try {
        if (currentEntry) {
          // Update existing entry
          const updatedEntry = await updateTimeEntryService(currentEntry.id, {
            Name: `Time entry for ${formData.client}`,
            ...formData,
            // Ensure we're using the right field names for the database
            client: formData.client,
            category: formData.categoryId
          });
          
          dispatch(updateTimeEntry({
            id: currentEntry.id,
            ...formData
          }));
          toast.success('Time entry updated!');
        } else {
          // Add new entry
          const newEntry = await createTimeEntry({
            Name: `Time entry for ${formData.client}`,
            ...formData,
            // Ensure we're using the right field names for the database
            client: formData.client,
            category: formData.categoryId
          });
          
          dispatch(addTimeEntry({
            id: newEntry.Id,
            ...formData
          }));
          toast.success('Time entry added!');
        }
      } catch (error) {
        console.error('Error saving time entry:', error);
        toast.error('Failed to save time entry. Please try again.');
      } finally {
        dispatch(setLoading(false));
        handleCloseForm();
      }
      dispatch(updateTimeEntry({ id: currentEntry.id, ...formData }));
    
    saveTimeEntry();
    } else {

    if (confirm('Are you sure you want to delete this time entry?')) {
      dispatch(deleteTimeEntry(id));
      toast.success('Time entry deleted!');
    }
  };
  
    
  // Handle delete entry
  const handleDeleteEntry = (id) => {
    if (confirm('Are you sure you want to delete this time entry?')) {
      // Show loading state
      dispatch(setLoading(true));
      
      deleteTimeEntryService(id)
        .then(() => {
          dispatch(deleteTimeEntry(id));
          toast.success('Time entry deleted!');
        })
        .catch(error => {
          console.error('Error deleting time entry:', error);
          toast.error('Failed to delete time entry. Please try again.');
        })
        .finally(() => {
          dispatch(setLoading(false));
        });
    }
  };
  // Calculate total hours
  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.duration, 0);
  
  // Calculate billable amount
  const billableAmount = filteredEntries
    .filter(entry => entry.billable)
    .reduce((sum, entry) => sum + (entry.duration * entry.rate), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0">Time Tracking</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => handleOpenForm()}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" /> New Entry
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Timer */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Timer</h3>
            <Timer 
              isRunning={!!activeTimer} 
              startTime={activeTimer?.startTime} 
              onStart={handleStartTimer} 
              onStop={handleStopTimer} 
              onCancel={handleCancelTimer} 
            />
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="lg:col-span-3">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-blue-600 dark:text-blue-400 p-2 rounded-full bg-blue-200 dark:bg-blue-800/30">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-xs uppercase font-semibold text-blue-700 dark:text-blue-300">Total Hours</span>
                </div>
                <p className="mt-2 text-2xl font-semibold">{totalHours.toFixed(1)}</p>
              </div>
              
              <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-green-600 dark:text-green-400 p-2 rounded-full bg-green-200 dark:bg-green-800/30">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-xs uppercase font-semibold text-green-700 dark:text-green-300">Billable</span>
                </div>
                <p className="mt-2 text-2xl font-semibold">${billableAmount.toFixed(2)}</p>
              </div>
              
              <div className="bg-purple-100 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-purple-600 dark:text-purple-400 p-2 rounded-full bg-purple-200 dark:bg-purple-800/30">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span className="text-xs uppercase font-semibold text-purple-700 dark:text-purple-300">Projects</span>
                </div>
                <p className="mt-2 text-2xl font-semibold">
                  {new Set(filteredEntries.map(e => e.projectId)).size}
                </p>
              </div>
              
              <div className="bg-amber-100 dark:bg-amber-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-amber-600 dark:text-amber-400 p-2 rounded-full bg-amber-200 dark:bg-amber-800/30">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-xs uppercase font-semibold text-amber-700 dark:text-amber-300">Days</span>
                </div>
                <p className="mt-2 text-2xl font-semibold">
                  {new Set(filteredEntries.map(e => e.date)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and Time Entries */}
      <div className="card mb-8 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-surface-800/70 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row md:items-center mb-6 space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex items-center text-surface-600 dark:text-surface-400">
            <Filter className="w-4 h-4 mr-2" /> Filters:
          </div>
          
          <select 
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)} 
            className="input-field max-w-xs"
          >
            <option value="">All Clients</option>
            <option value="Acme Corporation">Acme Corporation</option>
            <option value="Globex Industries">Globex Industries</option>
            <option value="Stark Enterprises">Stark Enterprises</option>
          </select>
          
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field max-w-xs"
          >
            <option value="">All Categories</option>
            <option value="Development">Development</option>
            <option value="Design">Design</option>
            <option value="Meeting">Meeting</option>
            <option value="Research">Research</option>
            <option value="Administrative">Administrative</option>
          </select>
          
          <select 
            value={filterBillable}
            onChange={(e) => setFilterBillable(e.target.value)}
            className="input-field max-w-xs" 
          >
            <option value="all">All Entries</option>
            <option value="billable">Billable Only</option>
            <option value="non-billable">Non-billable Only</option>
          </select>
          
          <input 
            type="date" 
            value={filterDate} 
            onChange={(e) => setFilterDate(e.target.value)}
            className="input-field max-w-xs"
            placeholder="Filter by date"
          />
        </div>
        
        {/* Time entries table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-100 dark:bg-surface-700 text-left">
              <tr> 
                <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Date</th>
                <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Client / Project</th>
                <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Description</th>
                <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Category</th>
                <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Duration</th>
                <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Billable</th>
                <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-surface-700">
              {sortedEntries.length > 0 ? (
                sortedEntries.map((entry) => {
                  const category = getCategory(entry.categoryId);
                  return (
                    <tr key={entry.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{getClientName(entry.clientId)}</div>
                          <div className="text-sm text-surface-500 dark:text-surface-400"> 
                            {entry.projectId ? `Project #${entry.projectId}` : 'No Project'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{entry.description}</td>
                      <td className="px-4 py-3">
                        <span 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                          style={{ 
                            backgroundColor: `${category.color}20`, 
                            color: category.color 
                          }}
                        >
                          {category.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDuration(entry.duration)}
                        <div className="text-sm text-surface-500 dark:text-surface-400">
                          {entry.startTime} - {entry.endTime}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {entry.billable ? (
                          <span className="text-green-600 dark:text-green-400">
                            ${(entry.duration * entry.rate).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-surface-500 dark:text-surface-400">
                            Non-billable
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleOpenForm(entry)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
                    No time entries found. Use the timer or add entries manually.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Time entry form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl">
            <TimeEntryForm 
              clients={clients}
              categories={categories}
              entry={currentEntry}
              onSubmit={handleSubmitForm}
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default TimeTracking;