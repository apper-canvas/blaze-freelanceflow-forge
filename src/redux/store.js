import { configureStore } from '@reduxjs/toolkit';
import timeTrackingReducer from './slices/timeTrackingSlice';
import invoiceReducer from './slices/invoiceSlice';
import userReducer from './slices/userSlice';

const store = configureStore({
  reducer: {
    timeTracking: timeTrackingReducer,
    invoices: invoiceReducer,
    user: userReducer,
  },
  // Ensure complex objects like date objects can be stored in Redux
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;