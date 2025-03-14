import { useState, useCallback, useEffect, useRef } from "react";
import { useWaku } from "./context";
import { messageManager } from "./messaging";
import { ChatMessage } from "./proto";
import { MessageWithMetadata } from "../../types";

/**
 * Hook for sending messages using Waku's LightPush protocol
 */
export function useSendMessage() {
  const { node, isConnected } = useWaku();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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

      try {
        setIsLoading(true);
        setError(null);

        // Create and send the message
        const message: ChatMessage = messageManager.createMessage(sender, messageText);
        const result = await messageManager.sendMessage(node, message);

        if (!result.success) {
          throw result.error || new Error("Failed to send message");
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
    [node, isConnected]
  );

  return {
    send,
    isLoading,
    error,
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
  const subscriptionIdRef = useRef<string | null>(null);

  // Subscribe to messages when the node is connected
  useEffect(() => {
    // Don't subscribe if the node is not connected
    if (!node || !isConnected) {
      return;
    }

    const subscribeToMessages = async () => {
      try {
        setIsSubscribing(true);
        setError(null);

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
        console.log("Subscribed to messages");
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error("Failed to subscribe to messages:", error);
      } finally {
        setIsSubscribing(false);
      }
    };

    subscribeToMessages();

    // Cleanup function to unsubscribe when the component unmounts
    return () => {
      if (subscriptionIdRef.current) {
        messageManager.unsubscribeFromMessages(subscriptionIdRef.current)
          .catch((err) => console.error("Failed to unsubscribe from messages:", err));
        subscriptionIdRef.current = null;
      }
    };
  }, [node, isConnected]);

  // Function to clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isSubscribing,
    error,
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
  const [hasQueried, setHasQueried] = useState(false);

  // Function to query historical messages
  const queryHistoricalMessages = useCallback(async () => {
    if (!node || !isConnected) {
      setError(new Error("Waku node is not connected"));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Query historical messages
      const messages = await messageManager.queryHistory(node);
      
      // Update state
      setHistoricalMessages(messages);
      setHasQueried(true);
      
      return messages;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to query historical messages:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [node, isConnected]);

  // Function to clear historical messages
  const clearHistoricalMessages = useCallback(() => {
    setHistoricalMessages([]);
    setHasQueried(false);
  }, []);

  return {
    historicalMessages,
    isLoading,
    error,
    hasQueried,
    queryHistoricalMessages,
    clearHistoricalMessages,
    clearError: () => setError(null),
  };
} 