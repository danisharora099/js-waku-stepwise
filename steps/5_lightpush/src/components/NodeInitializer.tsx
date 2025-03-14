import { useState } from "react";
import { useWaku } from "../lib/waku/context";

/**
 * Component for initializing the Waku node
 */
export function NodeInitializer() {
  const { initNode, isInitialized, isLoading, error, refreshPeerCount } = useWaku();
  const [customSeed, setCustomSeed] = useState("");
  const [showSeedInput, setShowSeedInput] = useState(false);
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  const handleInitWithDefaultSeed = async () => {
    try {
      setInitializationAttempted(true);
      await initNode();
      
      // Set up multiple refresh attempts to ensure peer count is updated
      setTimeout(() => refreshPeerCount(), 1000);
      setTimeout(() => refreshPeerCount(), 3000);
      setTimeout(() => refreshPeerCount(), 5000);
    } catch (err) {
      console.error("Failed to initialize node:", err);
    }
  };

  const handleInitWithCustomSeed = async () => {
    try {
      if (!customSeed.trim()) {
        alert("Please enter a valid seed");
        return;
      }
      
      setInitializationAttempted(true);
      await initNode(customSeed);
      
      // Set up multiple refresh attempts to ensure peer count is updated
      setTimeout(() => refreshPeerCount(), 1000);
      setTimeout(() => refreshPeerCount(), 3000);
      setTimeout(() => refreshPeerCount(), 5000);
    } catch (err) {
      console.error("Failed to initialize node with custom seed:", err);
    }
  };

  if (isInitialized) {
    return null; // Don't render anything if the node is already initialized
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-900">Initialize Waku Node</h3>
      </div>
      
      <div className="px-5 py-5">
        {error && (
          <div className="mb-5 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            Error: {error.message || "Failed to initialize node"}
          </div>
        )}
        
        {initializationAttempted && isLoading && (
          <div className="mb-5 p-3 bg-blue-50 text-blue-700 rounded-md text-sm flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Initializing Waku node... This may take a few moments.
          </div>
        )}
        
        <p className="text-sm text-gray-600 mb-5">
          Start your Waku node to connect to the network and begin messaging.
        </p>
        
        {!showSeedInput ? (
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleInitWithDefaultSeed}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? "Initializing..." : "Initialize with Random Seed"}
            </button>
            <button
              onClick={() => setShowSeedInput(true)}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Use Custom Seed
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="custom-seed" className="block text-sm font-medium text-gray-700 mb-1">
                Custom Seed
              </label>
              <input
                type="text"
                id="custom-seed"
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value)}
                placeholder="Enter your custom seed"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-sm border-gray-300 rounded-md py-2 px-3"
              />
              <p className="mt-1 text-xs text-gray-500">
                The seed will be used to generate your peer ID. Using the same seed will result in the same peer ID.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleInitWithCustomSeed}
                disabled={isLoading}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? "Initializing..." : "Initialize with Custom Seed"}
              </button>
              <button
                onClick={() => setShowSeedInput(false)}
                disabled={isLoading}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 