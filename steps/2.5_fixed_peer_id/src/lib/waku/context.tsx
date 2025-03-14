import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from "react";
import { LightNode } from "@waku/sdk";
import { wakuNodeManager } from "./node";

// Define the shape of our Waku context
interface WakuContextType {
  node: LightNode | null;
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  peerCount: number;
  peerId: string | null;
}

// Create the context with default values
const WakuContext = createContext<WakuContextType>({
  node: null,
  isLoading: false,
  error: null,
  isConnected: false,
  peerCount: 0,
  peerId: null,
});

// Props for the WakuProvider component
interface WakuProviderProps {
  children: ReactNode;
  usePersistentPeerId?: boolean;
  seed?: string;
}

// Provider component that wraps the app and provides Waku functionality
export function WakuProvider({ 
  children, 
  usePersistentPeerId = true,
  seed
}: WakuProviderProps) {
  const [node, setNode] = useState<LightNode | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [peerCount, setPeerCount] = useState<number>(0);
  const [connected, setConnected] = useState<boolean>(false);
  const [peerId, setPeerId] = useState<string | null>(null);
  const initializingRef = useRef<boolean>(false);
  const intervalIdRef = useRef<number | undefined>(undefined);

  // Initialize the Waku node
  const initWakuNode = useCallback(async () => {
    // Prevent duplicate initialization
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      console.log("Initializing Waku node with usePersistentPeerId:", usePersistentPeerId);
      if (seed) console.log("Using provided seed:", seed);
      
      // Initialize the Waku node
      const wakuNode = await wakuNodeManager.initWakuNode({
        defaultBootstrap: true,
        usePersistentPeerId,
        seed
      });
      
      setNode(wakuNode);
      setConnected(wakuNodeManager.isConnected(wakuNode));
      setPeerCount(wakuNodeManager.getPeerCount(wakuNode));
      
      const peerIdStr = wakuNodeManager.getPeerId(wakuNode);
      console.log("Setting peer ID in context:", peerIdStr);
      setPeerId(peerIdStr);
      
      setIsLoading(false);
      
      // Set up an interval to update connection status and peer count
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      
      intervalIdRef.current = window.setInterval(() => {
        if (wakuNode) {
          setConnected(wakuNodeManager.isConnected(wakuNode));
          setPeerCount(wakuNodeManager.getPeerCount(wakuNode));
        }
      }, 5000); // Update every 5 seconds
    } catch (err) {
      console.error("Failed to initialize Waku node:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    } finally {
      initializingRef.current = false;
    }
  }, [usePersistentPeerId, seed]);

  // Initialize the Waku node when the component mounts
  useEffect(() => {
    // Clean up any existing node and interval
    const cleanup = () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = undefined;
      }
      
      if (node) {
        wakuNodeManager.stopWakuNode(node).catch(console.error);
      }
    };
    
    // Clean up first
    cleanup();
    
    // Then initialize
    initWakuNode();
    
    // Clean up when the component unmounts
    return cleanup;
  }, [initWakuNode]);

  // The value that will be provided to consumers of this context
  const contextValue: WakuContextType = {
    node,
    isLoading,
    error,
    isConnected: connected,
    peerCount,
    peerId,
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