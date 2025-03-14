import { useState, useCallback, useEffect, useRef } from "react";
import { useWaku } from "./context";
import { messageManager } from "./messaging";
import { MessageWithMetadata } from "../../types";

/**
 * Hook for sending messages using Waku's LightPush protocol
 */
export function useSendMessage() {
  const { node, isConnected } = useWaku();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [protocolError, setProtocolError] = useState<Error | null>(null);
  const hasInitializedRef = useRef<boolean>(false);
  
  // Add a delay after node connection before allowing message sending
  useEffect(() => {
    if (node && isConnected && !isInitialized) {
      // Prevent duplicate initialization
      if (hasInitializedRef.current) {
        console.log("LightPush already initialized, skipping");
        setIsInitialized(true);
        return;
      }
      
      console.log("Waiting 2 seconds before initializing LightPush...");
      
      // Reset any previous protocol errors
      setProtocolError(null);
      
      const timer = setTimeout(() => {
        // Check if LightPush protocol is available
        if (!node.lightPush) {
          const error = new Error("LightPush protocol is not available");
          console.error(error);
          setProtocolError(error);
          return;
        }
        
        try {
          // Simply assume LightPush is ready if it exists
          console.log("LightPush initialized and ready to send messages");
          setIsInitialized(true);
          hasInitializedRef.current = true;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error("LightPush initialization error:", error);
          setProtocolError(error);
        }
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        hasInitializedRef.current = false;
      };
    }
  }, [node, isConnected, isInitialized]);

  const send = useCallback(
    async (sender: string, messageText: string): Promise<boolean> => {
      // Validate inputs
      if (!messageText.trim()) {
        setError(new Error("Message cannot be empty"));
        return false;
      }

      if (!sender.trim()) {
        setError(new Error("Sender name cannot be empty"));
        return false;
      }

      // Check node availability
      if (!node) {
        setError(new Error("Waku node is not available"));
        return false;
      }

      // Check connection status
      if (!isConnected) {
        setError(new Error("Waku node is not connected to any peers"));
        return false;
      }
      
      // Check if LightPush is initialized
      if (!isInitialized) {
        setError(new Error("LightPush is still initializing, please wait"));
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Send the message
        const success = await messageManager.sendMessage(node, sender, messageText);

        if (!success) {
          throw new Error("Failed to send message");
        }

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [node, isConnected, isInitialized]
  );

  return {
    send,
    isLoading,
    isInitialized,
    error,
    protocolError,
    clearError: () => setError(null),
  };
}

/**
 * Hook for receiving messages using Waku's Filter protocol
 */
export function useMessages() {
  const { node, isConnected } = useWaku();
  const [messages, setMessages] = useState<MessageWithMetadata[]>([]);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [protocolError, setProtocolError] = useState<Error | null>(null);
  const subscriptionIdRef = useRef<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const hasInitializedRef = useRef<boolean>(false);

  // Subscribe to messages when the node is connected
  useEffect(() => {
    // Don't subscribe if the node is not connected
    if (!node || !isConnected) {
      return;
    }

    // Prevent duplicate subscriptions
    if (hasInitializedRef.current || subscriptionIdRef.current) {
      console.log("Filter subscription already initialized or in progress, skipping");
      return;
    }

    // Set initializing state to show spinner
    setIsInitializing(true);
    
    // Reset any previous protocol errors
    setProtocolError(null);
    
    // Add a delay before setting up filter subscription
    const initializationTimer = setTimeout(() => {
      const subscribeToMessages = async () => {
        try {
          // Check if we already have a subscription
          if (subscriptionIdRef.current) {
            console.log("Already subscribed to messages, skipping");
            setIsInitializing(false);
            return;
          }

          setIsSubscribing(true);
          setError(null);
          
          // Check if Filter protocol is available
          if (!node.filter) {
            throw new Error("Filter protocol is not available");
          }
          
          console.log("Setting up Filter subscription after delay");

          // Subscribe to messages
          const subscriptionId = await messageManager.subscribeToMessages(node, (message) => {
            setMessages((prevMessages) => {
              // Check if we already have this message (by ID)
              const messageExists = prevMessages.some((m) => m.id === message.id);
              if (messageExists) {
                return prevMessages;
              }
              
              // Add the new message to the list
              return [...prevMessages, message];
            });
          });

          // Store the subscription ID for cleanup
          subscriptionIdRef.current = subscriptionId;
          hasInitializedRef.current = true;
          console.log("Subscribed to messages with ID:", subscriptionId);
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error("Failed to subscribe to messages:", error);
          setProtocolError(error);
        } finally {
          setIsSubscribing(false);
          setIsInitializing(false);
        }
      };

      subscribeToMessages();
    }, 2000); // 2-second delay

    // Cleanup function to unsubscribe when the component unmounts
    return () => {
      clearTimeout(initializationTimer);
      if (subscriptionIdRef.current) {
        console.log("Cleaning up Filter subscription:", subscriptionIdRef.current);
        messageManager.unsubscribeFromMessages(subscriptionIdRef.current)
          .catch((err) => console.error("Failed to unsubscribe from messages:", err));
        subscriptionIdRef.current = null;
        hasInitializedRef.current = false;
      }
    };
  }, [node, isConnected]);

  // Function to clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isSubscribing: isSubscribing || isInitializing, // Show loading state during initialization delay
    error,
    protocolError,
    clearMessages,
    clearError: () => setError(null),
  };
}

/**
 * Hook for retrieving historical messages using Waku's Store protocol
 */
export function useHistoricalMessages() {
  const { node, isConnected } = useWaku();
  const [historicalMessages, setHistoricalMessages] = useState<MessageWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [protocolError, setProtocolError] = useState<Error | null>(null);
  const [hasQueried, setHasQueried] = useState(false);
  const isQueryingRef = useRef<boolean>(false);

  // Function to query historical messages
  const queryHistoricalMessages = useCallback(async () => {
    if (!node || !isConnected) {
      setError(new Error("Waku node is not connected"));
      return [];
    }

    // Prevent concurrent queries
    if (isQueryingRef.current) {
      console.log("Historical message query already in progress, skipping");
      return [];
    }

    try {
      isQueryingRef.current = true;
      setIsLoading(true);
      setError(null);
      setProtocolError(null);
      
      console.log("Waiting 2 seconds before querying historical messages...");
      
      // Add a 2-second delay before querying
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if Store protocol is available
      if (!node.store) {
        const error = new Error("Store protocol is not available");
        console.error(error);
        setProtocolError(error);
        throw error;
      }
      
      console.log("Querying historical messages after delay");

      // Query historical messages
      const messages = await messageManager.queryHistory(node);
      console.log(`Retrieved ${messages.length} historical messages`);
      
      // Update state
      setHistoricalMessages(messages);
      setHasQueried(true);
      
      return messages;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Failed to query historical messages:", error);
      
      // Only set protocol error if it's not already set
      if (!protocolError) {
        setProtocolError(error);
      }
      
      return [];
    } finally {
      setIsLoading(false);
      isQueryingRef.current = false;
    }
  }, [node, isConnected, protocolError]);

  // Function to clear historical messages
  const clearHistoricalMessages = useCallback(() => {
    setHistoricalMessages([]);
    setHasQueried(false);
  }, []);

  return {
    historicalMessages,
    isLoading,
    error,
    protocolError,
    hasQueried,
    queryHistoricalMessages,
    clearHistoricalMessages,
    clearError: () => setError(null),
  };
} 