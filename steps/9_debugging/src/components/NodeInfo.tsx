import { useEffect, useState } from "react";
import { useWaku } from "../lib/waku/context";
import { useSendMessage, useMessages, useHistoricalMessages } from "../lib/waku/hooks";

/**
 * Component to display information about the Waku node
 */
export function NodeInfo() {
  const { isConnected, peerId, peerCount, isInitialized, refreshPeerCount } = useWaku();
  const { isInitialized: isLightPushInitialized, protocolError: lightPushError } = useSendMessage();
  const { isSubscribing, protocolError: filterError } = useMessages();
  const { protocolError: storeError } = useHistoricalMessages();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh peer count when component mounts and when connection status changes
  useEffect(() => {
    if (isInitialized && isConnected) {
      refreshPeerCount();
    }
  }, [isInitialized, isConnected, refreshPeerCount]);

  // Handle manual refresh with visual feedback
  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshPeerCount();
    
    // Reset the refreshing state after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  if (!isInitialized) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Node Status</h3>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 rounded-full mr-3 bg-gray-300"></div>
            <span className="font-medium text-base text-gray-400">
              Not Initialized
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Initialize the Waku node to connect to the network.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Node Status</h3>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-1.5 text-gray-400 hover:text-gray-600 focus:outline-none transition-transform duration-300 ${isRefreshing ? 'animate-spin' : ''}`}
          title="Refresh peer count"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      <div className="px-5 py-5">
        <div className="flex items-center mb-4">
          <div className={`w-3 h-3 rounded-full mr-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-medium text-base">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="ml-3 text-sm text-gray-500">
            ({peerCount} peer{peerCount !== 1 ? 's' : ''})
          </span>
        </div>
        
        {/* Protocol Status */}
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Protocols</p>
          
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              lightPushError ? 'bg-red-500' : 
              isLightPushInitialized ? 'bg-green-500' : 
              'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-gray-700">
              LightPush: {
                lightPushError ? 
                <span className="text-red-600">Error</span> : 
                isLightPushInitialized ? 'Ready' : 'Initializing...'
              }
            </span>
          </div>
          {lightPushError && (
            <div className="ml-4 text-xs text-red-600 bg-red-50 p-1 rounded">
              {lightPushError.message}
            </div>
          )}
          
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              filterError ? 'bg-red-500' : 
              !isSubscribing ? 'bg-green-500' : 
              'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-gray-700">
              Filter: {
                filterError ? 
                <span className="text-red-600">Error</span> : 
                !isSubscribing ? 'Ready' : 'Initializing...'
              }
            </span>
          </div>
          {filterError && (
            <div className="ml-4 text-xs text-red-600 bg-red-50 p-1 rounded">
              {filterError.message}
            </div>
          )}
          
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              storeError ? 'bg-red-500' : 'bg-gray-400'
            }`}></div>
            <span className="text-sm text-gray-700">
              Store: {
                storeError ? 
                <span className="text-red-600">Error</span> : 
                'Not queried'
              }
            </span>
          </div>
          {storeError && (
            <div className="ml-4 text-xs text-red-600 bg-red-50 p-1 rounded">
              {storeError.message}
            </div>
          )}
        </div>
        
        {peerId && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Peer ID</p>
            <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
              <p className="text-sm font-mono text-gray-700 break-all">
                {peerId}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 