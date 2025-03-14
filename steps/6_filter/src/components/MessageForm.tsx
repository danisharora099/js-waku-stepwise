import { useState } from "react";
import { useSendMessage } from "../lib/waku/hooks";
import { useWaku } from "../lib/waku/context";

/**
 * Component for composing and sending messages
 */
export function MessageForm() {
  const [message, setMessage] = useState("");
  const [sender, setSender] = useState("");
  const { send, isLoading, error, clearError } = useSendMessage();
  const { isConnected } = useWaku();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !sender.trim()) return;
    
    const success = await send(sender, message);
    
    if (success) {
      // Clear the input field on success
      setMessage("");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-900">New Message</h3>
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
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-5">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex justify-between items-center w-full">
                <p className="text-sm text-red-700">
                  {error.message}
                </p>
                <button 
                  onClick={() => clearError()}
                  className="text-red-700 hover:text-red-900 text-sm font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sender" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              id="sender"
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="Enter your name"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Your Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading || !isConnected}
              className={`inline-flex items-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                isLoading || !isConnected
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              }`}
            >
              {isLoading ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 