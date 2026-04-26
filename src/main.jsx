import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// One-time wipe of all saved data so app starts completely fresh
if (!localStorage.getItem('krm-wiped-v2')) {
  localStorage.removeItem('krm-ledger-v1')
  localStorage.removeItem('krm-ledger-v2')
  localStorage.setItem('krm-wiped-v2', '1')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
