import { createDecoder, createEncoder, DecodedMessage, LightNode, CreateSubscriptionResult } from "@waku/sdk";
import { ProtoChatMessage, ChatMessage } from "./proto";
import { CHAT_TOPIC } from "../../constants";
import { MessageWithMetadata } from "../../types";
import { v4 as uuidv4 } from "uuid";

/**
 * MessageManager class for handling Waku message operations
 */
export class MessageManager {
  // Store active subscriptions for cleanup
  private subscriptions: Map<string, CreateSubscriptionResult> = new Map();

  /**
   * Encode a chat message to a Protocol Buffer binary format
   */
  encodeMessage(message: ChatMessage): Uint8Array {
    return ProtoChatMessage.encode(message).finish();
  }

  /**
   * Decode a Protocol Buffer binary format to a chat message
   */
  decodeMessage(data: Uint8Array): ChatMessage {
    return ProtoChatMessage.decode(data) as unknown as ChatMessage;
  }

  /**
   * Create a Waku encoder for chat messages
   */
  createChatEncoder() {
    return createEncoder({
      contentTopic: CHAT_TOPIC,
      ephemeral: false
    });
  }

  /**
   * Create a Waku decoder for chat messages
   */
  createChatDecoder() {
    return createDecoder(CHAT_TOPIC);
  }

  /**
   * Create a new chat message
   */
  createMessage(sender: string, message: string): ChatMessage {
    return {
      timestamp: Date.now(),
      sender,
      message
    };
  }

  /**
   * Process a decoded message and convert it to a MessageWithMetadata
   */
  processMessage(decodedMessage: DecodedMessage, source?: 'store' | 'filter'): MessageWithMetadata | null {
    try {
      const chatMessage = this.decodeMessage(decodedMessage.payload);
      
      return {
        message: chatMessage,
        timestamp: chatMessage.timestamp || Date.now(),
        id: uuidv4(),
        receivedTime: Date.now(),
        source
      };
    } catch (error) {
      console.error("Error processing message:", error);
      return null;
    }
  }

  /**
   * Send a chat message using Waku's LightPush protocol
   */
  async sendMessage(
    node: LightNode,
    message: ChatMessage
  ): Promise<{ success: boolean; error?: Error }> {
    if (!node) {
      return { 
        success: false, 
        error: new Error("Waku node is not available") 
      };
    }

    try {
      // Encode the message
      const payload = this.encodeMessage(message);
      
      // Create the encoder
      const encoder = this.createChatEncoder();
      
      // Send the message using LightPush
      await node.lightPush.send(encoder, { payload });
      
      console.log("Message sent successfully");
      return { success: true };
    } catch (error) {
      console.error("Failed to send message:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error(String(error)) 
      };
    }
  }

  /**
   * Subscribe to messages using Waku's Filter protocol
   * @param node The Waku node
   * @param callback Function to call when a message is received
   * @returns A subscription ID that can be used to unsubscribe
   */
  async subscribeToMessages(
    node: LightNode,
    callback: (message: MessageWithMetadata) => void
  ): Promise<string> {
    if (!node) {
      throw new Error("Waku node is not available");
    }

    try {
      // Create a decoder for the chat content topic
      const decoder = this.createChatDecoder();
      
      // Subscribe to messages using the Filter protocol
      const subscription = await node.filter.subscribe([decoder], (decodedMessage) => {
        try {
          // Process the message
          const processedMessage = this.processMessage(decodedMessage, 'filter');
          
          // If the message was processed successfully, call the callback
          if (processedMessage) {
            callback(processedMessage);
          }
        } catch (error) {
          console.error("Error processing received message:", error);
        }
      });
      
      // Generate a unique ID for this subscription
      const subscriptionId = uuidv4();
      
      // Store the unsubscribe function for later cleanup
      this.subscriptions.set(subscriptionId, subscription);
      
      console.log(`Subscribed to messages with ID: ${subscriptionId}`);
      return subscriptionId;
    } catch (error) {
      console.error("Failed to subscribe to messages:", error);
      throw error;
    }
  }

  /**
   * Unsubscribe from messages
   * @param subscriptionId The ID returned from subscribeToMessages
   */
  async unsubscribeFromMessages(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (!subscription) {
      console.warn(`No subscription found with ID: ${subscriptionId}`);
      return;
    }
    
    try {
      // Check if the subscription was successful and has a subscription property
      if ('subscription' in subscription && subscription.subscription) {
        await subscription.subscription.unsubscribe([]);
        this.subscriptions.delete(subscriptionId);
        console.log(`Unsubscribed from messages with ID: ${subscriptionId}`);
      } else {
        console.warn(`Subscription with ID: ${subscriptionId} cannot be unsubscribed`);
        this.subscriptions.delete(subscriptionId);
      }
    } catch (error) {
      console.error(`Failed to unsubscribe from messages with ID: ${subscriptionId}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  async unsubscribeFromAllMessages(): Promise<void> {
    const subscriptionIds = Array.from(this.subscriptions.keys());
    
    for (const subscriptionId of subscriptionIds) {
      await this.unsubscribeFromMessages(subscriptionId);
    }
    
    console.log("Unsubscribed from all message subscriptions");
  }

  /**
   * Query historical messages using Waku's Store protocol
   * @param node The Waku node
   * @returns An array of processed messages
   */
  async queryHistory(node: LightNode): Promise<MessageWithMetadata[]> {
    if (!node) {
      throw new Error("Waku node is not available");
    }

    try {
      console.log("Querying historical messages");
      
      // Create a decoder for the chat content topic
      const decoder = this.createChatDecoder();
      
      // Collect messages
      const processedMessages: MessageWithMetadata[] = [];
      
      // Query messages using the Store protocol
      try {
        await node.store.queryWithOrderedCallback(
          [decoder],
          (message) => {
            // Process each message as it's received
            const processedMessage = this.processMessage(message, 'store');
            if (processedMessage) {
              processedMessages.push(processedMessage);
            }
          }
        );
      } catch (error) {
        console.warn("Store query might have failed partially:", error);
      }
      
      console.log(`Store query completed, retrieved ${processedMessages.length} messages`);
      
      // Sort messages by timestamp (oldest first)
      processedMessages.sort((a, b) => a.timestamp - b.timestamp);
      
      return processedMessages;
    } catch (error) {
      console.error("Failed to query historical messages:", error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const messageManager = new MessageManager(); 