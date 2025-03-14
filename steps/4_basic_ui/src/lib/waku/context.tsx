import { createContext, useContext, useState, ReactNode, useRef, useCallback, useEffect } from "react";
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
  initNode: (customSeed?: string) => Promise<void>;
  isInitialized: boolean;
  refreshPeerCount: () => void;
}

// Create the context with default values
const WakuContext = createContext<WakuContextType>({
  node: null,
  isLoading: false,
  error: null,
  isConnected: false,
  peerCount: 0,
  peerId: null,
  initNode: async () => {},
  isInitialized: false,
  refreshPeerCount: () => {},
});

// Props for the WakuProvider component
interface WakuProviderProps {
  children: ReactNode;
  autoStart?: boolean;
}

// Provider component that wraps the app and provides Waku functionality
export function WakuProvider({ 
  children, 
  autoStart = false
}: WakuProviderProps) {
  const [node, setNode] = useState<LightNode | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [peerCount, setPeerCount] = useState<number>(0);
  const [connected, setConnected] = useState<boolean>(false);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const initializingRef = useRef<boolean>(false);
  const intervalIdRef = useRef<number | undefined>(undefined);
  const nodeRef = useRef<LightNode | null>(null);

  // Function to refresh peer count
  const refreshPeerCount = useCallback(() => {
    if (nodeRef.current) {
      try {
        const count = wakuNodeManager.getPeerCount(nodeRef.current);
        console.log("Manual refresh - Current peer count:", count);
        setPeerCount(count);
      } catch (err) {
        console.error("Error refreshing peer count:", err);
      }
    }
  }, []);

  // Update connection status and peer count
  const updateConnectionStatus = useCallback(() => {
    if (nodeRef.current) {
      try {
        const isNodeConnected = wakuNodeManager.isConnected(nodeRef.current);
        setConnected(isNodeConnected);
        
        const currentPeerCount = wakuNodeManager.getPeerCount(nodeRef.current);
        if (currentPeerCount !== peerCount) {
          console.log("Auto update - Peer count changed:", currentPeerCount);
          setPeerCount(currentPeerCount);
        }
      } catch (err) {
        console.error("Error updating connection status:", err);
      }
    }
  }, [peerCount]);

  // Set up the interval for updating connection status
  useEffect(() => {
    if (isInitialized && node) {
      // Update immediately
      updateConnectionStatus();
      
      // Set up interval
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      
      intervalIdRef.current = window.setInterval(() => {
        updateConnectionStatus();
      }, 2000); // Update every 2 seconds
    }
    
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = undefined;
      }
    };
  }, [isInitialized, node, updateConnectionStatus]);

  // Initialize the Waku node
  const initWakuNode = useCallback(async (customSeed?: string) => {
    // Prevent duplicate initialization
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      console.log("Initializing Waku node with custom seed:", !!customSeed);
      
      // Initialize the Waku node
      const wakuNode = await wakuNodeManager.initWakuNode({
        defaultBootstrap: true,
        usePersistentPeerId: true,
        seed: customSeed
      });
      
      setNode(wakuNode);
      nodeRef.current = wakuNode;
      
      setConnected(wakuNodeManager.isConnected(wakuNode));
      
      const count = wakuNodeManager.getPeerCount(wakuNode);
      console.log("Initial peer count:", count);
      setPeerCount(count);
      
      const peerIdStr = wakuNodeManager.getPeerId(wakuNode);
      console.log("Setting peer ID in context:", peerIdStr);
      setPeerId(peerIdStr);
      
      setIsInitialized(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to initialize Waku node:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    } finally {
      initializingRef.current = false;
    }
  }, []);

  // Auto-start the node if specified
  useEffect(() => {
    if (autoStart && !isInitialized) {
      initWakuNode();
    }
    
    // Clean up when the component unmounts
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = undefined;
      }
      
      if (node) {
        wakuNodeManager.stopWakuNode(node).catch(console.error);
      }
    };
  }, [autoStart, initWakuNode, isInitialized, node]);

  // Update nodeRef when node changes
  useEffect(() => {
    nodeRef.current = node;
  }, [node]);

  // The value that will be provided to consumers of this context
  const contextValue: WakuContextType = {
    node,
    isLoading,
    error,
    isConnected: connected,
    peerCount,
    peerId,
    initNode: initWakuNode,
    isInitialized,
    refreshPeerCount,
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