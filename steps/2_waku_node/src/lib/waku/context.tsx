import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { LightNode } from "@waku/sdk";
import { wakuNodeManager } from "./node";

// Define the shape of our Waku context
interface WakuContextType {
  node: LightNode | null;
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  peerCount: number;
}

// Create the context with default values
const WakuContext = createContext<WakuContextType>({
  node: null,
  isLoading: false,
  error: null,
  isConnected: false,
  peerCount: 0,
});

// Props for the WakuProvider component
interface WakuProviderProps {
  children: ReactNode;
}

// Provider component that wraps the app and provides Waku functionality
export function WakuProvider({ children }: WakuProviderProps) {
  const [node, setNode] = useState<LightNode | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [peerCount, setPeerCount] = useState<number>(0);
  const [connected, setConnected] = useState<boolean>(false);
  const initializingRef = useRef<boolean>(false);

  // Initialize the Waku node when the component mounts
  useEffect(() => {
    let mounted = true;
    let intervalId: number | undefined;

    const init = async () => {
      // Prevent duplicate initialization
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
        setIsLoading(true);
        setError(null);

        // Initialize the Waku node
        const wakuNode = await wakuNodeManager.initWakuNode({
          defaultBootstrap: true
        });
        
        if (mounted) {
          setNode(wakuNode);
          setConnected(wakuNodeManager.isConnected());
          setPeerCount(wakuNodeManager.getPeerCount());
          setIsLoading(false);
          
          // Set up an interval to update connection status and peer count
          intervalId = window.setInterval(() => {
            if (wakuNode) {
              setConnected(wakuNodeManager.isConnected());
              setPeerCount(wakuNodeManager.getPeerCount());
            }
          }, 5000); // Update every 5 seconds
        }
      } catch (err) {
        console.error("Failed to initialize Waku node:", err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      } finally {
        if (mounted) {
          initializingRef.current = false;
        }
      }
    };

    init();

    // Clean up when the component unmounts
    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (node) {
        wakuNodeManager.stopWakuNode().catch(console.error);
      }
    };
  }, []);

  // The value that will be provided to consumers of this context
  const contextValue: WakuContextType = {
    node,
    isLoading,
    error,
    isConnected: connected,
    peerCount,
  };

  return (
    <WakuContext.Provider value={contextValue}>
      {children}
    </WakuContext.Provider>
  );
}

// Custom hook to use the Waku context
export function useWaku() {
  const context = useContext(WakuContext);
  if (context === undefined) {
    throw new Error("useWaku must be used within a WakuProvider");
  }
  return context;
} 