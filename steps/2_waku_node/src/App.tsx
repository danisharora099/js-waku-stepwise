import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { WakuProvider, useWaku } from './lib/waku/context'
import { APP_NAME } from './constants'

// Component to display Waku connection status
function WakuStatus() {
  const { isLoading, error, isConnected, peerCount } = useWaku();

  if (isLoading) {
    return <div className="waku-status loading">Connecting to Waku network...</div>;
  }

  if (error) {
    return <div className="waku-status error">Error connecting to Waku: {error.message}</div>;
  }

  return (
    <div className={`waku-status ${isConnected ? 'connected' : 'disconnected'}`}>
      {isConnected 
        ? `Connected to Waku (${peerCount} peer${peerCount !== 1 ? 's' : ''})` 
        : 'Disconnected from Waku'}
    </div>
  );
}

function AppContent() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>{APP_NAME}</h1>
      <WakuStatus />
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

function App() {
  return (
    <WakuProvider>
      <AppContent />
    </WakuProvider>
  )
}

export default App
