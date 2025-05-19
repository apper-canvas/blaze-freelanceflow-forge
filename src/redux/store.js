import { configureStore } from '@reduxjs/toolkit';
import timeTrackingReducer from './slices/timeTrackingSlice';
import invoiceReducer from './slices/invoiceSlice';

const store = configureStore({
  reducer: {
    timeTracking: timeTrackingReducer,
    invoices: invoiceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;