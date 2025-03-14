import { DecodedMessage, LightNode, CreateSubscriptionResult } from "@waku/sdk";
import { ProtoChatMessage, ChatMessage } from "./proto";
import { MessageWithMetadata } from "../../types";
import { v4 as uuidv4 } from "uuid";
import { encryptionManager } from "./encryption";

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
    try {
      console.log("Decoding message data of size:", data.length, "bytes");
      const decodedMessage = ProtoChatMessage.decode(data) as unknown as ChatMessage;
      console.log("Successfully decoded message from:", decodedMessage.sender);
      return decodedMessage;
    } catch (error) {
      console.error("Error decoding message:", error);
      throw error;
    }
  }

  /**
   * Create a Waku encoder for chat messages
   * Uses encryption if enabled
   */
  createChatEncoder() {
    return encryptionManager.createEncoder();
  }

  /**
   * Create a Waku decoder for chat messages
   * Uses encryption if enabled
   */
  createChatDecoder() {
    return encryptionManager.createDecoder();
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
   * Send a chat message
   */
  async sendMessage(node: LightNode, sender: string, message: string): Promise<boolean> {
    try {
      console.log("Sending message with encryption:", 
                 encryptionManager.isEncryptionEnabled, 
                 "type:", encryptionManager.encryptionType);
      
      // Create the chat message
      const chatMessage = this.createMessage(sender, message);
      
      // Encode the message to binary
      const payload = this.encodeMessage(chatMessage);
      console.log("Encoded message size:", payload.length, "bytes");
      
      // Create an encoder (with or without encryption)
      const encoder = this.createChatEncoder();
      
      // Send the message using LightPush
      const { successes, failures } = await node.lightPush.send(encoder, {
        payload
      });
      
      if (failures.length > 0) {
        console.error("Failed to send message:", failures);
        return false;
      }
      
      console.log("Message sent successfully with encryption:", 
                 encryptionManager.isEncryptionEnabled, 
                 "type:", encryptionManager.encryptionType);
      return successes.length > 0;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  }

  /**
   * Subscribe to chat messages
   */
  async subscribeToMessages(
    node: LightNode,
    callback: (message: MessageWithMetadata) => void
  ): Promise<string> {
    try {
      // Capture the current encryption state
      const isEncryptionEnabled = encryptionManager.isEncryptionEnabled;
      const encryptionType = encryptionManager.encryptionType;
      
      // Create a decoder (with or without encryption)
      const decoder = this.createChatDecoder();
      console.log("Creating subscription with encryption:", 
                 isEncryptionEnabled, 
                 "type:", encryptionType);
      
      // Subscribe to messages using Filter protocol
      const { subscription, error } = await node.filter.subscribe(
        [decoder],
        (wakuMessage: DecodedMessage) => {
          try {
            if (!wakuMessage.payload) {
              console.log("Received message with no payload");
              return;
            }
            
            // Note: We use the encryption state at the time of message receipt,
            // not the state at subscription time
            const currentEncryptionEnabled = encryptionManager.isEncryptionEnabled;
            const currentEncryptionType = encryptionManager.encryptionType;
            
            console.log("Received message, attempting to decode with encryption:", 
                       currentEncryptionEnabled,
                       "type:", currentEncryptionType);
            
            // Decode the message
            const chatMessage = this.decodeMessage(wakuMessage.payload);
            
            console.log("Successfully decoded message:", 
                       chatMessage.message.substring(0, 20) + (chatMessage.message.length > 20 ? "..." : ""),
                       "from:", chatMessage.sender);
            
            // Create a message with metadata
            const messageWithMetadata: MessageWithMetadata = {
              message: chatMessage,
              timestamp: chatMessage.timestamp,
              id: uuidv4(),
              receivedTime: Date.now(),
              source: 'filter',
              encrypted: currentEncryptionEnabled,
              encryptionType: currentEncryptionType
            };
            
            // Call the callback with the message
            callback(messageWithMetadata);
          } catch (error) {
            console.error("Error processing message:", error);
            console.log("Message payload size:", wakuMessage.payload?.length || 0, "bytes");
            
            // Try to determine if this was an encryption error
            if (encryptionManager.isEncryptionEnabled) {
              console.log("Encryption is enabled but failed to decode message. This might be an encrypted message with different keys.");
              
              // Try decoding with encryption disabled as a fallback
              try {
                // Temporarily disable encryption
                const wasEnabled = encryptionManager.isEncryptionEnabled;
                const originalType = encryptionManager.encryptionType;
                encryptionManager.toggleEncryption(); // Disable encryption
                
                console.log("Attempting to decode as unencrypted message");
                const chatMessage = this.decodeMessage(wakuMessage.payload);
                
                // If we get here, it was an unencrypted message
                console.log("Successfully decoded as unencrypted message");
                
                // Create a message with metadata
                const messageWithMetadata: MessageWithMetadata = {
                  message: chatMessage,
                  timestamp: chatMessage.timestamp,
                  id: uuidv4(),
                  receivedTime: Date.now(),
                  source: 'filter',
                  encrypted: false,
                  encryptionType: originalType
                };
                
                // Call the callback with the message
                callback(messageWithMetadata);
                
                // Restore encryption state
                if (wasEnabled) {
                  encryptionManager.toggleEncryption(); // Re-enable encryption
                }
              } catch (fallbackError) {
                console.error("Failed to decode as unencrypted message:", fallbackError);
                // Restore encryption state if needed
                if (!encryptionManager.isEncryptionEnabled) {
                  encryptionManager.toggleEncryption(); // Re-enable encryption
                }
              }
            }
          }
        }
      );
      
      if (error) {
        throw error;
      }
      
      // Generate a unique ID for this subscription
      const subscriptionId = uuidv4();
      
      // Store the subscription for later cleanup
      this.subscriptions.set(subscriptionId, { subscription, error });
      
      console.log("Created subscription with ID:", subscriptionId);
      return subscriptionId;
    } catch (error) {
      console.error("Error subscribing to messages:", error);
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
      // Capture the current encryption state
      const isEncryptionEnabled = encryptionManager.isEncryptionEnabled;
      const encryptionType = encryptionManager.encryptionType;
      
      console.log("Querying historical messages with encryption:", 
                 isEncryptionEnabled, 
                 "type:", encryptionType);
      
      // Create a decoder for the chat content topic
      const decoder = this.createChatDecoder();
      
      // Collect messages
      const processedMessages: MessageWithMetadata[] = [];
      
      // Query messages using the Store protocol
      try {
        await node.store.queryWithOrderedCallback(
          [decoder],
          (message) => {
            try {
              // Process each message as it's received
              if (!message.payload) {
                console.log("Received historical message with no payload");
                return;
              }
              
              console.log("Processing historical message with encryption:", 
                         encryptionManager.isEncryptionEnabled,
                         "type:", encryptionManager.encryptionType);
              
              // Try to decode the message
              try {
                const chatMessage = this.decodeMessage(message.payload);
                
                console.log("Successfully decoded historical message from:", chatMessage.sender);
                
                // Create a message with metadata
                const messageWithMetadata: MessageWithMetadata = {
                  message: chatMessage,
                  timestamp: chatMessage.timestamp || Date.now(),
                  id: uuidv4(),
                  receivedTime: Date.now(),
                  source: 'store',
                  encrypted: encryptionManager.isEncryptionEnabled,
                  encryptionType: encryptionManager.encryptionType
                };
                
                processedMessages.push(messageWithMetadata);
              } catch (decodeError) {
                console.error("Error decoding historical message:", decodeError);
                
                // If encryption is enabled, try decoding as unencrypted
                if (encryptionManager.isEncryptionEnabled) {
                  try {
                    // Temporarily disable encryption
                    const wasEnabled = encryptionManager.isEncryptionEnabled;
                    const originalType = encryptionManager.encryptionType;
                    encryptionManager.toggleEncryption(); // Disable encryption
                    
                    console.log("Attempting to decode historical message as unencrypted");
                    const chatMessage = this.decodeMessage(message.payload);
                    
                    // If we get here, it was an unencrypted message
                    console.log("Successfully decoded historical message as unencrypted");
                    
                    // Create a message with metadata
                    const messageWithMetadata: MessageWithMetadata = {
                      message: chatMessage,
                      timestamp: chatMessage.timestamp || Date.now(),
                      id: uuidv4(),
                      receivedTime: Date.now(),
                      source: 'store',
                      encrypted: false,
                      encryptionType: originalType
                    };
                    
                    processedMessages.push(messageWithMetadata);
                    
                    // Restore encryption state
                    if (wasEnabled) {
                      encryptionManager.toggleEncryption(); // Re-enable encryption
                    }
                  } catch (fallbackError) {
                    console.error("Failed to decode historical message as unencrypted:", fallbackError);
                    // Restore encryption state if needed
                    if (!encryptionManager.isEncryptionEnabled) {
                      encryptionManager.toggleEncryption(); // Re-enable encryption
                    }
                  }
                }
              }
            } catch (error) {
              console.error("Error processing historical message:", error);
            }
          }
        );
      } catch (error) {
        console.error("Error querying store:", error);
      }
      
      console.log(`Retrieved ${processedMessages.length} historical messages`);
      return processedMessages;
    } catch (error) {
      console.error("Error in queryHistory:", error);
      throw error;
    }
  }

  /**
   * Retrieve historical messages
   */
  async retrieveHistoricalMessages(
    node: LightNode,
    callback: (message: MessageWithMetadata) => void,
    options: {
      pageSize?: number;
      cursor?: unknown;
      timeFilter?: {
        startTime?: number;
        endTime?: number;
      };
    } = {}
  ): Promise<boolean> {
    try {
      // Create a decoder (with or without encryption)
      const decoder = this.createChatDecoder();
      
      // Default options
      const timeFilter = options.timeFilter || {};
      
      // Query for historical messages using Store protocol
      const queryOptions: Record<string, unknown> = {};
      if (options.cursor) queryOptions.cursor = options.cursor;
      if (timeFilter.startTime || timeFilter.endTime) {
        queryOptions.timeFilter = {};
        if (timeFilter.startTime) queryOptions.startTime = timeFilter.startTime;
        if (timeFilter.endTime) queryOptions.endTime = timeFilter.endTime;
      }
      
await node.store.queryWithOrderedCallback(
        [decoder],
        (wakuMessage: DecodedMessage) => {
          try {
            if (!wakuMessage.payload) return;
            
            // Decode the message
            const chatMessage = this.decodeMessage(wakuMessage.payload);
            
            // Create a message with metadata
            const messageWithMetadata: MessageWithMetadata = {
              message: chatMessage,
              timestamp: chatMessage.timestamp,
              id: uuidv4(),
              receivedTime: Date.now(),
              source: 'store',
              encrypted: encryptionManager.isEncryptionEnabled,
              encryptionType: encryptionManager.encryptionType
            };
            
            // Call the callback with the message
            callback(messageWithMetadata);
          } catch (error) {
            console.error("Error processing historical message:", error);
          }
        },
        queryOptions
      );
      
      return true;
    } catch (error) {
      console.error("Error retrieving historical messages:", error);
      return false;
    }
  }
}

// Create a singleton instance
export const messageManager = new MessageManager(); 