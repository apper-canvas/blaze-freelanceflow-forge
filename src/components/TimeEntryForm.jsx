import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';

function TimeEntryForm({ 
  clients, 
  categories, 
  entry = null, 
  onSubmit, 
  onCancel 
}) {
  // State for form fields
  const [formData, setFormData] = useState({
    clientId: '',
    projectId: '',
    description: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    duration: 0,
    rate: 85,
    billable: true
  });

  // Projects state (would normally be fetched from API based on client)
  const [availableProjects, setAvailableProjects] = useState([]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // If client changes, update available projects
    if (name === 'clientId' && value) {
      // Mock projects - in a real app, you would fetch these from the server
      const clientProjects = [
        { id: 101, clientId: 1, name: 'Website Redesign' },
        { id: 102, clientId: 1, name: 'Mobile App Development' },
        { id: 201, clientId: 2, name: 'Branding Campaign' },
        { id: 202, clientId: 2, name: 'Marketing Strategy' },
        { id: 301, clientId: 3, name: 'Infrastructure Upgrade' }
      ].filter(project => project.clientId === parseInt(value));
      
      setAvailableProjects(clientProjects);
    }
  };

  // Calculate duration when start/end times change
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}:00`);
      const end = new Date(`2000-01-01T${formData.endTime}:00`);
      
      // Handle case where end time is on the next day
      let diff = (end - start) / (1000 * 60 * 60);
      if (diff < 0) diff += 24;
      
      setFormData(prev => ({
        ...prev,
        duration: parseFloat(diff.toFixed(2))
      }));
    }
  }, [formData.startTime, formData.endTime]);

  // If editing an existing entry, populate form
  useEffect(() => {
    if (entry) {
      setFormData({
        clientId: entry.clientId.toString(),
        projectId: entry.projectId.toString(),
        description: entry.description || '',
        categoryId: entry.categoryId || '',
        date: entry.date || new Date().toISOString().split('T')[0],
        startTime: entry.startTime || '',
        endTime: entry.endTime || '',
        duration: entry.duration || 0,
        rate: entry.rate || 85,
        billable: entry.billable !== undefined ? entry.billable : true
      });
      
      // Set projects for selected client
      if (entry.clientId) {
        const clientProjects = [
          { id: 101, clientId: 1, name: 'Website Redesign' },
          { id: 102, clientId: 1, name: 'Mobile App Development' },
          { id: 201, clientId: 2, name: 'Branding Campaign' },
          { id: 202, clientId: 2, name: 'Marketing Strategy' },
          { id: 301, clientId: 3, name: 'Infrastructure Upgrade' }
        ].filter(project => project.clientId === entry.clientId);
        
        setAvailableProjects(clientProjects);
      }
    }
  }, [entry]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.clientId || !formData.description || !formData.date || 
        !formData.startTime || !formData.endTime || formData.duration <= 0) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // Convert clientId and projectId to numbers
    const submissionData = {
      ...formData,
      clientId: parseInt(formData.clientId),
      projectId: parseInt(formData.projectId),
      duration: parseFloat(formData.duration),
      rate: parseFloat(formData.rate)
    };
    
    // Submit form
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{entry ? 'Edit Time Entry' : 'New Time Entry'}</h3>
        <button type="button" onClick={onCancel} className="text-surface-500 hover:text-surface-700">
          <X size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="input-group">
          <label className="input-label">Client</label>
          <select name="clientId" value={formData.clientId} onChange={handleChange} className="input-field" required>
            <option value="">Select a client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
        
        <div className="input-group">
          <label className="input-label">Project</label>
          <select name="projectId" value={formData.projectId} onChange={handleChange} className="input-field" required>
            <option value="">Select a project</option>
            {availableProjects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>
        
        <div className="input-group md:col-span-2">
          <label className="input-label">Description</label>
          <input 
            type="text" 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            className="input-field" 
            placeholder="What did you work on?" 
            required 
          />
        </div>
        
        <div className="input-group">
          <label className="input-label">Category</label>
          <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="input-field" required>
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        
        <div className="input-group">
          <label className="input-label">Date</label>
          <input 
            type="date" 
            name="date" 
            value={formData.date} 
            onChange={handleChange} 
            className="input-field" 
            required 
          />
        </div>
        
        <div className="input-group">
          <label className="input-label">Start Time</label>
          <input 
            type="time" 
            name="startTime" 
            value={formData.startTime} 
            onChange={handleChange} 
            className="input-field" 
            required 
          />
        </div>
        
        <div className="input-group">
          <label className="input-label">End Time</label>
          <input 
            type="time" 
            name="endTime" 
            value={formData.endTime} 
            onChange={handleChange} 
            className="input-field" 
            required 
          />
        </div>
        
        <div className="input-group">
          <label className="input-label">Duration (hours)</label>
          <input 
            type="number" 
            name="duration" 
            value={formData.duration} 
            onChange={handleChange} 
            className="input-field" 
            step="0.01" 
            min="0.01" 
            required 
            readOnly 
          />
        </div>
        
        <div className="input-group">
          <label className="input-label">Hourly Rate ($)</label>
          <input 
            type="number" 
            name="rate" 
            value={formData.rate} 
            onChange={handleChange} 
            className="input-field" 
            step="0.01" 
            min="0" 
            required 
          />
        </div>
        
        <div className="input-group flex items-center space-x-2 mt-4">
          <input 
            type="checkbox" 
            id="billable" 
            name="billable" 
            checked={formData.billable} 
            onChange={handleChange} 
            className="h-4 w-4 rounded border-surface-300 dark:border-surface-600 text-primary focus:ring-primary" 
          />
          <label htmlFor="billable" className="text-sm font-medium text-surface-700 dark:text-surface-300">
            Billable
          </label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 mt-6">
        <button type="button" onClick={onCancel} className="btn-outline">Cancel</button>
        <button type="submit" className="btn-primary">Save Entry</button>
      </div>
    </form>
  );
}

export default TimeEntryForm;