import { useState } from "react";

/**
 * Component for toggling message encryption
 */
export function EncryptionToggle() {
  const [isEnabled, setIsEnabled] = useState(false);

  const toggleEncryption = () => {
    // This will be implemented in Step 8 (Encryption)
    alert("Encryption is not implemented in this step. This will be added in Step 8 (Encryption).");
    setIsEnabled(!isEnabled);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-900">Encryption</h3>
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
                Encryption is not implemented in this step. This functionality will be added in Step 8 (Encryption).
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-2">
          <span className="flex-grow flex flex-col">
            <span className="text-base font-medium text-gray-900">End-to-End Encryption</span>
            <span className="text-sm text-gray-500 mt-1">
              {isEnabled ? 'Messages are encrypted' : 'Messages are sent in plaintext'}
            </span>
          </span>
          <button
            type="button"
            className={`${
              isEnabled ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex flex-shrink-0 h-7 w-14 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            role="switch"
            aria-checked={isEnabled}
            onClick={toggleEncryption}
          >
            <span
              aria-hidden="true"
              className={`${
                isEnabled ? 'translate-x-7' : 'translate-x-0'
              } pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
            />
          </button>
        </div>
      </div>
    </div>
  );
} 