import { useState, useCallback } from "react";
import { useWaku } from "./context";
import { messageManager } from "./messaging";
import { ChatMessage } from "./proto";

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