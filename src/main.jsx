import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider as ReduxProvider } from 'react-redux';
import store from './redux/store'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ReduxProvider store={store}><BrowserRouter><App /></BrowserRouter></ReduxProvider>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>
);