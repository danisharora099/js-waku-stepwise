import { useState, useEffect } from 'react';

/**
 * DebugToggle Component - Enhanced Version
 * 
 * A toggle switch component that allows users to enable or disable
 * Waku debug logs using the debug=waku* pattern.
 * Includes improved logging and error handling.
 */
const DebugToggle: React.FC = () => {
  // Track whether Waku logs are enabled
  const [logsEnabled, setLogsEnabled] = useState<boolean>(false);

  // Check initial state on component mount
  useEffect(() => {
    try {
      const debugSetting = localStorage.getItem('debug');
      console.log("Current debug setting:", debugSetting);
      setLogsEnabled(debugSetting === 'waku*');
    } catch (error) {
      console.error("Error checking debug setting:", error);
    }
  }, []);

  // Handle toggle click with improved implementation
  const handleToggle = () => {
    try {
      const newState = !logsEnabled;
      console.log("Toggling Waku debug logs to:", newState ? "ENABLED" : "DISABLED");
      
      if (newState) {
        // Enable logs
        localStorage.setItem('debug', 'waku*');
        console.log("Debug logs enabled with 'waku*' pattern");
      } else {
        // Disable logs
        localStorage.removeItem('debug');
        console.log("Debug logs disabled");
      }
      
      // Update UI state immediately
      setLogsEnabled(newState);
      
      // Alert user before reload
      alert(`Waku debug logs ${newState ? 'enabled' : 'disabled'}. Page will reload to apply changes.`);
      
      // Force reload to apply changes
      window.location.reload();
    } catch (error) {
      console.error("Error toggling debug mode:", error);
      alert("Failed to toggle debug mode. See console for details.");
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Debug Settings</h3>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="waku-logs-toggle" className="text-sm font-medium text-gray-700">
          Waku Debug Logs: <span className={logsEnabled ? "text-green-600 font-bold" : "text-red-600"}>{logsEnabled ? 'Enabled' : 'Disabled'}</span>
        </label>
        <button 
          onClick={handleToggle}
          className="relative inline-block w-12 h-6 transition duration-200 ease-in-out"
          aria-pressed={logsEnabled}
          role="switch"
        >
          <span className={`block cursor-pointer w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${logsEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
            <span className={`absolute h-5 w-5 left-0.5 bottom-0.5 bg-white rounded-full transition-transform duration-200 ease-in-out ${logsEnabled ? 'transform translate-x-6' : ''}`}></span>
          </span>
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-2">
        {logsEnabled 
          ? 'Debug logs are enabled. Check your browser console for detailed Waku logs.' 
          : 'Enable debug logs to see detailed Waku information in your browser console.'}
      </p>
      <p className="text-xs text-gray-500 italic">
        Note: Toggling this setting will reload the page.
      </p>
    </div>
  );
};

export default DebugToggle;