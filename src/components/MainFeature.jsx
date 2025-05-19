import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { getIcon } from '../utils/iconUtils';

// Import icons
const PlusIcon = getIcon('plus');
const UserPlusIcon = getIcon('user-plus');
const XIcon = getIcon('x');
const CheckCircleIcon = getIcon('check-circle');

function MainFeature({ onAddClient }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Company name is required';
    }
    
    if (!formData.contactName.trim()) {
      errors.contactName = 'Contact name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    return errors;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the errors in the form');
      return;
    }
    
    // Submit form
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      try {
        onAddClient(formData);
        
        // Reset form
        setFormData({
          name: '',
          contactName: '',
          email: '',
          phone: '',
          notes: ''
        });
        
        // Close form
        setIsFormOpen(false);
        
        // Show success message
        toast.success('Client added successfully!');
      } catch (error) {
        toast.error('Failed to add client. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }, 800);
  };
  
  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
    setFormErrors({});
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Client Management</h2>
        <button 
          onClick={toggleForm}
          className={`btn ${isFormOpen ? 'btn-outline' : 'btn-primary'} transition-all`}
          disabled={isSubmitting}
        >
          {isFormOpen ? (
            <>
              <XIcon className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Add New Client
            </>
          )}
        </button>
      </div>
      
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="neu-card">
              <h3 className="text-lg font-semibold mb-4">Add New Client</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="input-group">
                    <label htmlFor="name" className="input-label">
                      Company Name <span className="text-accent">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`input-field ${formErrors.name ? 'border-accent' : ''}`}
                      placeholder="Acme Corporation"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-accent">{formErrors.name}</p>
                    )}
                  </div>
                  
                  <div className="input-group">
                    <label htmlFor="contactName" className="input-label">
                      Contact Name <span className="text-accent">*</span>
                    </label>
                    <input
                      type="text"
                      id="contactName"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      className={`input-field ${formErrors.contactName ? 'border-accent' : ''}`}
                      placeholder="John Smith"
                    />
                    {formErrors.contactName && (
                      <p className="mt-1 text-sm text-accent">{formErrors.contactName}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="input-group">
                    <label htmlFor="email" className="input-label">
                      Email Address <span className="text-accent">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`input-field ${formErrors.email ? 'border-accent' : ''}`}
                      placeholder="john@acme.com"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-accent">{formErrors.email}</p>
                    )}
                  </div>
                  
                  <div className="input-group">
                    <label htmlFor="phone" className="input-label">
                      Phone Number <span className="text-accent">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`input-field ${formErrors.phone ? 'border-accent' : ''}`}
                      placeholder="(555) 123-4567"
                    />
                    {formErrors.phone && (
                      <p className="mt-1 text-sm text-accent">{formErrors.phone}</p>
                    )}
                  </div>
                </div>
                
                <div className="input-group">
                  <label htmlFor="notes" className="input-label">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="input-field min-h-[100px]"
                    placeholder="Add any relevant notes about this client..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={toggleForm}
                    className="btn-outline"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary relative"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <span className="inline-flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Add Client
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!isFormOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quick actions cards */}
          <div className="card card-hover">
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-primary/10 p-3 rounded-full text-primary mb-4">
                <UserPlusIcon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Add New Client</h3>
              <p className="text-surface-500 dark:text-surface-400 text-sm mb-4">
                Create a new client record with contact details and notes
              </p>
              <button
                onClick={toggleForm}
                className="btn-outline mt-auto w-full"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Client
              </button>
            </div>
          </div>
          
          <div className="card card-hover">
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-secondary/10 p-3 rounded-full text-secondary mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Manage Projects</h3>
              <p className="text-surface-500 dark:text-surface-400 text-sm mb-4">
                Track progress, set milestones, and monitor deliverables
              </p>
              <button
                onClick={() => toast.info('Projects feature coming soon!')}
                className="btn-outline mt-auto w-full"
              >
                View Projects
              </button>
            </div>
          </div>
          
          <div className="card card-hover">
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full text-green-600 dark:text-green-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Invoice Clients</h3>
              <p className="text-surface-500 dark:text-surface-400 text-sm mb-4">
                Create and send professional invoices to your clients
              </p>
              <button
                onClick={() => toast.info('Invoicing feature coming soon!')}
                className="btn-outline mt-auto w-full"
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainFeature;