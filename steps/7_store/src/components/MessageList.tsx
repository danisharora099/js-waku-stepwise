import { useMessages, useHistoricalMessages } from "../lib/waku/hooks";
import { useWaku } from "../lib/waku/context";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import { MessageWithMetadata } from "../types";

/**
 * Component for displaying a list of messages
 */
export function MessageList() {
  const { messages, isSubscribing, error: filterError, clearMessages } = useMessages();
  const { 
    historicalMessages, 
    isLoading: isLoadingHistory, 
    error: storeError, 
    hasQueried,
    queryHistoricalMessages, 
    clearHistoricalMessages 
  } = useHistoricalMessages();
  const { isConnected } = useWaku();
  const [allMessages, setAllMessages] = useState<MessageWithMetadata[]>([]);
  const [showHistorical, setShowHistorical] = useState(true);

  // Merge real-time and historical messages
  useEffect(() => {
    // Create a map to deduplicate messages by ID
    const messagesMap = new Map<string, MessageWithMetadata>();
    
    // Add all messages to the map
    [...messages, ...(showHistorical ? historicalMessages : [])].forEach(message => {
      messagesMap.set(message.id, message);
    });
    
    // Convert the map back to an array and sort by timestamp
    const mergedMessages = Array.from(messagesMap.values())
      .sort((a, b) => a.timestamp - b.timestamp);
    
    setAllMessages(mergedMessages);
  }, [messages, historicalMessages, showHistorical]);

  // Format timestamp to relative time (e.g., "5 minutes ago")
  const formatTimestamp = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (err) {
      console.error("Error formatting timestamp:", err);
      return "Unknown time";
    }
  };

  // Handle loading historical messages
  const handleLoadHistory = async () => {
    await queryHistoricalMessages();
  };

  // Handle clearing all messages
  const handleClearAll = () => {
    clearMessages();
    clearHistoricalMessages();
  };

  // Determine if there's an error to display
  const error = filterError || storeError;

  // Helper function to get message source badge
  const getMessageSourceBadge = (messageData: MessageWithMetadata) => {
    if (messageData.source === 'store') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          store
        </span>
      );
    } else if (messageData.source === 'filter') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          filter
        </span>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Messages</h3>
        <div className="flex space-x-2">
          {!hasQueried && isConnected && (
            <button
              onClick={handleLoadHistory}
              disabled={isLoadingHistory}
              className={`text-sm px-3 py-1 rounded ${
                isLoadingHistory
                  ? "bg-blue-100 text-blue-400 cursor-not-allowed"
                  : "bg-blue-100 text-blue-600 hover:bg-blue-200"
              }`}
            >
              {isLoadingHistory ? "Loading..." : "Load History"}
            </button>
          )}
          {hasQueried && (
            <button
              onClick={() => setShowHistorical(!showHistorical)}
              className={`text-sm px-3 py-1 rounded ${
                showHistorical
                  ? "bg-green-100 text-green-600 hover:bg-green-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {showHistorical ? "Showing Historical" : "Show Historical"}
            </button>
          )}
          {allMessages.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
      <div className="px-5 py-5">
        {!isConnected && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-5">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Waku node is not connected. Please wait for the connection to be established.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {(isSubscribing || isLoadingHistory) && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-5">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {isSubscribing && isLoadingHistory
                    ? "Subscribing to messages and loading history..."
                    : isSubscribing
                    ? "Subscribing to messages..."
                    : "Loading historical messages..."}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-5">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error.message}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {allMessages.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-base mb-2">No messages yet</p>
            <p className="text-sm text-gray-400">
              {isConnected 
                ? "Send a message or load historical messages."
                : "Connect to the network to send and receive messages."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {allMessages.map((messageData) => (
              <div 
                key={messageData.id} 
                className={`border rounded-lg p-4 ${
                  messageData.source === 'store'
                    ? "border-green-200 bg-green-50"
                    : messageData.source === 'filter'
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 mr-2">{messageData.message.sender}</span>
                    {getMessageSourceBadge(messageData)}
                  </div>
                  <span className="text-xs text-gray-500">{formatTimestamp(messageData.timestamp)}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap break-words">{messageData.message.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 