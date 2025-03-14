import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { WakuProvider, useWaku } from './lib/waku/context'
import { APP_NAME } from './constants'

// Component to display Waku connection status
function WakuStatus() {
  const { isLoading, error, isConnected, peerCount, peerId } = useWaku();

  if (isLoading) {
    return <div className="waku-status loading">Connecting to Waku network...</div>;
  }

  if (error) {
    return <div className="waku-status error">Error connecting to Waku: {error.message}</div>;
  }

  return (
    <div className="waku-status-container">
      <div className={`waku-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected 
          ? `Connected to Waku (${peerCount} peer${peerCount !== 1 ? 's' : ''})` 
          : 'Disconnected from Waku'}
      </div>
      {peerId && (
        <div className="waku-peer-id">
          <span>Your Waku/libp2p Peer ID: </span>
          <code>{peerId}</code>
        </div>
      )}
    </div>
  );
}

function AppContent({ onStartOver }: { onStartOver: () => void }) {
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
      <button className="start-over-btn" onClick={onStartOver}>
        Start Over with Different Seed
      </button>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

function App() {
  const [seed, setSeed] = useState<string>('');
  const [showSeedInput, setShowSeedInput] = useState<boolean>(false);
  const [useSeed, setUseSeed] = useState<boolean>(false);
  const [submittedSeed, setSubmittedSeed] = useState<string | undefined>(undefined);

  const handleSeedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (seed.trim()) {
      setSubmittedSeed(seed);
      setUseSeed(true);
    }
  };

  const handleStartOver = () => {
    setUseSeed(false);
    setSubmittedSeed(undefined);
    setSeed('');
    setShowSeedInput(false);
  };

  if (!useSeed) {
    return (
      <div className="waku-init-container">
        <h1>{APP_NAME}</h1>
        <p>Initialize Waku with a custom seed or use the default behavior</p>
        
        {showSeedInput ? (
          <form onSubmit={handleSeedSubmit} className="seed-form">
            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Enter seed for Waku/libp2p Peer ID"
              className="seed-input"
            />
            <div className="seed-form-buttons">
              <button type="submit" className="set-seed-btn">Initialize with Seed</button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setShowSeedInput(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="init-buttons">
            <button 
              className="custom-seed-btn" 
              onClick={() => setShowSeedInput(true)}
            >
              Use Custom Seed
            </button>
            <button 
              className="default-init-btn" 
              onClick={() => setUseSeed(true)}
            >
              Use Default Behavior
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <WakuProvider usePersistentPeerId={true} seed={submittedSeed}>
      <AppContent onStartOver={handleStartOver} />
    </WakuProvider>
  )
}

export default App
