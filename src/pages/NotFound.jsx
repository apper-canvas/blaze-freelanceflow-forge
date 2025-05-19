import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getIcon } from '../utils/iconUtils';

const AlertCircleIcon = getIcon('alert-circle');
const HomeIcon = getIcon('home');

function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="container mx-auto px-4 py-20 flex flex-col items-center justify-center"
    >
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="bg-primary/10 rounded-full p-6">
            <AlertCircleIcon className="w-16 h-16 text-primary" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4">404</h1>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Page Not Found</h2>
        <p className="text-surface-600 dark:text-surface-400 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <Link to="/" className="btn-primary inline-flex items-center justify-center">
          <HomeIcon className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
      </div>
      
      <div className="mt-16 w-full max-w-md">
        <div className="neu-card">
          <h3 className="text-xl font-semibold mb-4">Looking for something?</h3>
          <p className="text-surface-600 dark:text-surface-400 mb-4">
            FreelanceFlow helps you manage client relationships efficiently. Go back to the dashboard to access all your tools.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Link to="/" className="btn-outline text-center">
              Dashboard
            </Link>
            <Link to="/#clients" className="btn-outline text-center">
              Clients
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default NotFound;