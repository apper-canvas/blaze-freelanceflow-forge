import { createContext, useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, clearUser } from './redux/slices/userSlice';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Sun, Moon } from 'lucide-react';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Invoices from './pages/Invoices';
import Callback from './pages/Callback';
import ErrorPage from './pages/ErrorPage';
import NotFound from './pages/NotFound';
import TimeTracking from './pages/TimeTracking';
// Create auth context
export const AuthContext = createContext(null);

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.user);
  const currentPath = window.location.pathname + window.location.search;
  
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${currentPath}`} />;
  }
  
  return children;
};

function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true';
  });
  
   // Initialize ApperUI once when the app loads
   useEffect(() => {
      try {
        const { ApperClient, ApperUI } = window.ApperSDK;
        const client = new ApperClient({
          apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
          apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
        });
  
        // Initialize but don't show login yet
        ApperUI.setup(client, {
          target: '#authentication',
          clientId: import.meta.env.VITE_APPER_PROJECT_ID,
          view: 'both',
          onSuccess: function (user) {
            setIsInitialized(true);
            // CRITICAL: This exact currentPath logic must be preserved in all implementations
            // DO NOT simplify or modify this pattern as it ensures proper redirection flow
            let currentPath = window.location.pathname + window.location.search;
            let redirectPath = new URLSearchParams(window.location.search).get('redirect');
            const isAuthPage = currentPath.includes('/login') || currentPath.includes('/signup') || currentPath.includes(
              '/callback') || currentPath.includes('/error');
            if (user) {
              // User is authenticated
              if (redirectPath) {
                navigate(redirectPath);
              } else if (!isAuthPage) {
                if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
                  navigate(currentPath);
                } else {
                  navigate('/');
                }
              } else {
                navigate('/');
              }
              // Store user information in Redux
              dispatch(setUser(JSON.parse(JSON.stringify(user))));
              toast.success(`Welcome, ${user.firstName || 'User'}!`);
            } else {
              // User is not authenticated
              if (!isAuthPage) {
                navigate(
                  currentPath.includes('/signup')
                    ? `/signup?redirect=${currentPath}`
                    : currentPath.includes('/login')
                      ? `/login?redirect=${currentPath}`
                      : '/login');
              } else if (redirectPath) {
                if (
                  ![
                    'error',
                    'signup',
                    'login',
                    'callback'
                  ].some((path) => currentPath.includes(path)))
                  navigate(`/login?redirect=${redirectPath}`);
                else {
                  navigate(currentPath);
                }
              } else if (isAuthPage) {
                navigate(currentPath);
              } else {
                navigate('/login');
              }
              dispatch(clearUser());
            }
          },
          onError: function(error) {
            console.error("Authentication failed:", error);
            toast.error("Authentication failed. Please try again.");
            setIsInitialized(true);
          }
        });
      } catch (error) {
        console.error("Error initializing authentication:", error);
        setIsInitialized(true);
      }
    }, [dispatch, navigate]);
  
    // Effect for dark mode
    useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);
  
    // Authentication methods to share via context
    const authMethods = {
      isInitialized,
      logout: async () => {
        try {
          const { ApperUI } = window.ApperSDK;
          await ApperUI.logout();
          dispatch(clearUser());
          navigate('/login');
          toast.info("You have been logged out");
        } catch (error) {
          console.error("Logout failed:", error);
          toast.error("Logout failed. Please try again.");
        }
      }
    };
  
    // Don't render routes until initialization is complete
    if (!isInitialized) {
      return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg font-medium">Initializing application...</div>
      </div>;
    }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <AuthContext.Provider value={authMethods}>
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-surface-800 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl text-primary">FreelanceFlow</span>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-surface-600 hover:text-primary transition-colors">Dashboard</a>
            <a href="#clients" className="text-surface-600 hover:text-primary transition-colors">Clients</a>
            <a href="#projects" className="text-surface-600 hover:text-primary transition-colors">Projects</a>
            <a href="/time-tracking" className="text-surface-600 hover:text-primary transition-colors">Time Tracking</a>
            <a href="/invoices" className="text-surface-600 hover:text-primary transition-colors">Invoices</a>
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </nav>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden space-x-2">
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-surface-800 border-t dark:border-surface-700"
            >
              <div className="container mx-auto px-4 py-3 flex flex-col space-y-3">
                <a href="/" className="py-2 text-surface-600 hover:text-primary transition-colors">Dashboard</a>
                <a href="#clients" className="py-2 text-surface-600 hover:text-primary transition-colors">Clients</a>
                <a href="#projects" className="py-2 text-surface-600 hover:text-primary transition-colors">Projects</a>
                <a href="/time-tracking" className="py-2 text-surface-600 hover:text-primary transition-colors">Time Tracking</a>
                <a href="/invoices" className="py-2 text-surface-600 hover:text-primary transition-colors">Invoices</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/callback" element={<Callback />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="/" element={
              <ProtectedRoute><Home /></ProtectedRoute>
            } />
            <Route path="/time-tracking" element={<ProtectedRoute><TimeTracking /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-surface-800 border-t dark:border-surface-700 py-6">
        <div className="container mx-auto px-4">
          <div className="text-center text-surface-500 text-sm">
            <p>&copy; {new Date().getFullYear()} FreelanceFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Toast Container */}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? "dark" : "light"}
      />
    </div>
    </AuthContext.Provider>
  );
}

export default App;