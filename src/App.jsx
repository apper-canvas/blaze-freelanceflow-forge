import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Sun, Moon } from 'lucide-react';

// Pages
import Home from './pages/Home';
import NotFound from './pages/NotFound';

function App() {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
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
  );
}

export default App;