import { useState, FormEvent } from "react";
import { useWaku } from "../lib/waku/context";
import { useSendMessage } from "../lib/waku/hooks";

/**
 * Component for composing and sending messages
 */
export function MessageForm() {
  const { isConnected, isEncryptionEnabled, encryptionType } = useWaku();
  const { send, isLoading, error: sendError, isInitialized, protocolError } = useSendMessage();
  const [message, setMessage] = useState("");
  const [sender, setSender] = useState("Anonymous");
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError("Message cannot be empty");
      return;
    }
    
    if (!isConnected) {
      setError("Not connected to Waku network");
      return;
    }
    
    if (!isInitialized) {
      setError("Message system is still initializing, please wait");
      return;
    }
    
    setError(null);
    
    try {
      // Send the message using the hook
      const success = await send(sender, message);
      
      if (success) {
        // Clear the message input on success
        setMessage("");
      } else {
        setError(sendError?.message || "Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Error sending message");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-900">Send Message</h3>
      </div>
      <div className="px-5 py-5">
        {protocolError && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700">
            <p className="font-medium">LightPush Protocol Error:</p>
            <p>{protocolError.message}</p>
            <p className="text-sm mt-1">
              Messages cannot be sent until this issue is resolved. Try refreshing the page.
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="sender" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="sender"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="Enter your name"
              disabled={!!protocolError}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              id="message"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              disabled={!!protocolError}
            />
          </div>
          
          {error && !protocolError && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700">
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {isEncryptionEnabled ? (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Encrypted ({encryptionType})
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm0-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Unencrypted
                </span>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!isConnected || isLoading || !isInitialized || !!protocolError}
              className={`px-4 py-2 rounded-md text-white ${
                !isConnected || isLoading || !isInitialized || !!protocolError
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {protocolError ? "Protocol Error" :
               !isInitialized ? "Initializing..." : 
               isLoading ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 