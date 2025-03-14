import { useWaku } from "./lib/waku/context";
import { NodeInfo } from "./components/NodeInfo";
import { MessageList } from "./components/MessageList";
import { MessageForm } from "./components/MessageForm";
import { EncryptionToggle } from "./components/EncryptionToggle";
import { NodeInitializer } from "./components/NodeInitializer";
import DebugToggle from "./components/DebugToggle";

function App() {
  const { isInitialized } = useWaku();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-3 sm:px-4">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Waku Chat</h1>
          <p className="mt-2 text-lg text-gray-600">
            A decentralized chat application built with Waku protocol
          </p>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-blue-700">
                  This is Step 9 (Debugging) of the Waku Chat application. You can now enable detailed Waku logs using the debug toggle to help troubleshoot issues.
                </p>
              </div>
            </div>
          </div>
        </header>

        <NodeInitializer />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {isInitialized && (
              <>
                <MessageList />
                <MessageForm />
              </>
            )}
          </div>
          
          <div className="space-y-6">
            <NodeInfo />
            {isInitialized && (
              <>
                <EncryptionToggle />
                <DebugToggle />
              </>
            )}
          </div>
        </div>
        
        <footer className="mt-12 text-center text-sm text-gray-500 py-4">
          <p>
            Built with{" "}
            <a href="https://waku.org" className="text-blue-500 hover:text-blue-700" target="_blank" rel="noopener noreferrer">
              Waku Protocol
            </a>
            {" "}and{" "}
            <a href="https://reactjs.org" className="text-blue-500 hover:text-blue-700" target="_blank" rel="noopener noreferrer">
              React
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
