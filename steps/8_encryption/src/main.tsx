import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WakuProvider } from './lib/waku/context.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WakuProvider autoStart={false}>
      <App />
    </WakuProvider>
  </React.StrictMode>,
)
