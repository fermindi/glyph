import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'
import { installWebApiMock } from './web-api-mock'

// In browser (no Electron), install mock API using file inputs
installWebApiMock()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
