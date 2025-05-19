import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { getIcon } from '../utils/iconUtils';
import MainFeature from '../components/MainFeature';

// Import icons
const UserIcon = getIcon('user');
const UsersIcon = getIcon('users');
const BriefcaseIcon = getIcon('briefcase');
const CalendarIcon = getIcon('calendar');
const FileTextIcon = getIcon('file-text');
const TrendingUpIcon = getIcon('trending-up');

// Mock data for dashboard
const initialStats = [
  { id: 1, name: 'Active Clients', value: 12, icon: 'users', color: 'bg-blue-100 dark:bg-blue-900/20', textColor: 'text-blue-600 dark:text-blue-400' },
  { id: 2, name: 'Current Projects', value: 8, icon: 'briefcase', color: 'bg-purple-100 dark:bg-purple-900/20', textColor: 'text-purple-600 dark:text-purple-400' },
  { id: 3, name: 'Upcoming Meetings', value: 5, icon: 'calendar', color: 'bg-green-100 dark:bg-green-900/20', textColor: 'text-green-600 dark:text-green-400' },
  { id: 4, name: 'Pending Invoices', value: 3, icon: 'file-text', color: 'bg-amber-100 dark:bg-amber-900/20', textColor: 'text-amber-600 dark:text-amber-400' },
];

// Custom hook for managing clients
function useClientManagement() {
  const [clients, setClients] = useState([
    { id: 1, name: 'Acme Corporation', contactName: 'John Smith', email: 'john@acme.com', phone: '(555) 123-4567', status: 'active', lastContact: '2023-06-15' },
    { id: 2, name: 'Globex Industries', contactName: 'Jane Brown', email: 'jane@globex.com', phone: '(555) 987-6543', status: 'active', lastContact: '2023-06-12' },
    { id: 3, name: 'Stark Enterprises', contactName: 'Tony Rogers', email: 'tony@stark.com', phone: '(555) 111-2222', status: 'inactive', lastContact: '2023-05-28' },
  ]);
  
  const addClient = (client) => {
    const newClient = {
      id: Date.now(),
      ...client,
      status: 'active',
      lastContact: new Date().toISOString().split('T')[0]
    };
    setClients([...clients, newClient]);
    toast.success(`Added ${client.name} to your clients!`);
    return newClient;
  };
  
  const updateClientStatus = (id, status) => {
    setClients(clients.map(client => 
      client.id === id ? { ...client, status } : client
    ));
    const client = clients.find(c => c.id === id);
    toast.info(`Updated ${client.name}'s status to ${status}`);
  };
  
  return { clients, addClient, updateClientStatus };
}

function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { clients, addClient, updateClientStatus } = useClientManagement();
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      {/* Tabs */}
      <div className="mb-8 border-b dark:border-surface-700">
        <div className="flex flex-wrap -mb-px">
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`inline-flex items-center pb-3 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'dashboard'
                ? 'border-primary text-primary'
                : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            }`}
          >
            <TrendingUpIcon className="w-4 h-4 mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => handleTabChange('clients')}
            className={`inline-flex items-center pb-3 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'clients'
                ? 'border-primary text-primary'
                : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            }`}
          >
            <UsersIcon className="w-4 h-4 mr-2" />
            Clients
          </button>
        </div>
      </div>

      {/* Dashboard */}
      {activeTab === 'dashboard' && (
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Dashboard</h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {initialStats.map((stat) => {
              const StatIcon = getIcon(stat.icon);
              return (
                <div key={stat.id} className={`card ${stat.color} border-none`}>
                  <div className="flex items-center">
                    <div className={`p-3 rounded-full ${stat.textColor}`}>
                      <StatIcon className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                        {stat.name}
                      </p>
                      <p className="text-2xl font-semibold">{stat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Main Feature Section */}
          <MainFeature onAddClient={addClient} />
          
          {/* Recent Activity */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="card">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full text-blue-600 dark:text-blue-400 mr-3">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Meeting with Acme Corp</p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      Tomorrow at 10:00 AM
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-full text-green-600 dark:text-green-400 mr-3">
                    <FileTextIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Invoice #INV-2023-06 paid</p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      Globex Industries - $3,250.00
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-full text-purple-600 dark:text-purple-400 mr-3">
                    <BriefcaseIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Project milestone reached</p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      Website Redesign - Phase 1 complete
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clients */}
      {activeTab === 'clients' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Clients</h1>
            <button 
              onClick={() => handleTabChange('dashboard')}
              className="btn-primary"
            >
              Add New Client
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full bg-white dark:bg-surface-800 rounded-xl overflow-hidden shadow-card">
              <thead className="bg-surface-100 dark:bg-surface-700 text-left">
                <tr>
                  <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Client Name</th>
                  <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Contact</th>
                  <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium hidden lg:table-cell">Phone</th>
                  <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Status</th>
                  <th className="px-4 py-3 text-surface-600 dark:text-surface-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-surface-700">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/50">
                    <td className="px-4 py-3 font-medium">{client.name}</td>
                    <td className="px-4 py-3">{client.contactName}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                        {client.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">{client.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          client.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="text-sm border border-surface-300 dark:border-surface-600 rounded-md bg-transparent px-2 py-1"
                        value={client.status}
                        onChange={(e) => updateClientStatus(client.id, e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Home;