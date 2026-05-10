import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-right" toastOptions={{ duration: 3500,
          style: { fontSize: '14px', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }
        }} />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
