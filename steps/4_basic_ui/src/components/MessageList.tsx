/**
 * Component for displaying a list of messages
 */
export function MessageList() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-900">Messages</h3>
      </div>
      <div className="px-5 py-5">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-5">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Message receiving is not implemented in this step. This functionality will be added in Step 6 (Filter).
                Historical message retrieval will be added in Step 7 (Store).
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center py-10 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-base mb-2">No messages yet</p>
          <p className="text-sm text-gray-400">
            Messages will appear here once you connect to the network and implement the receiving functionality.
          </p>
        </div>
      </div>
    </div>
  );
} 