import { useState } from "react";
import { useWaku } from "../lib/waku/context";
import { EncryptionType } from "../lib/waku/encryption";

/**
 * Component for toggling message encryption
 */
export function EncryptionToggle() {
  const { 
    isEncryptionEnabled, 
    toggleEncryption, 
    encryptionType, 
    setEncryptionType,
    generateKeys,
    exportPublicKey,
    exportSymmetricKey,
    importPublicKey,
    importSymmetricKey,
    encryptionKeys
  } = useWaku();
  
  const [peerPublicKey, setPeerPublicKey] = useState("");
  const [symmetricKey, setSymmetricKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyStatus, setKeyStatus] = useState<string | null>(null);

  const handleEncryptionTypeChange = (type: EncryptionType) => {
    setEncryptionType(type);
    setShowKeyInput(false);
    setKeyStatus(null);
  };

  const handleImportKey = () => {
    try {
      if (encryptionType === EncryptionType.ECIES && peerPublicKey) {
        importPublicKey(peerPublicKey);
        setShowKeyInput(false);
        setKeyStatus("Peer public key imported successfully!");
      } else if (encryptionType === EncryptionType.SYMMETRIC && symmetricKey) {
        importSymmetricKey(symmetricKey);
        setShowKeyInput(false);
        setKeyStatus("Symmetric key imported successfully!");
      }
    } catch (error) {
      console.error("Error importing key:", error);
      setKeyStatus("Error importing key. Please check the format.");
    }
  };

  const handleGenerateKeys = () => {
    try {
      generateKeys();
      setShowKeyInput(false);
      
      if (encryptionType === EncryptionType.ECIES) {
        setKeyStatus("ECIES keys generated successfully! Now you need to import your peer's public key.");
      } else if (encryptionType === EncryptionType.SYMMETRIC) {
        setKeyStatus("Symmetric key generated successfully!");
      }
    } catch (error) {
      console.error("Error generating keys:", error);
      setKeyStatus("Error generating keys.");
    }
  };

  const handleExportKey = () => {
    try {
      if (encryptionType === EncryptionType.ECIES) {
        const key = exportPublicKey();
        if (key) {
          navigator.clipboard.writeText(key)
            .then(() => {
              setKeyStatus("Public key copied to clipboard! Share this with your peer and ask them to import it.");
            })
            .catch((err) => {
              console.error("Could not copy to clipboard:", err);
              setKeyStatus(`Public key: ${key}`);
            });
        } else {
          setKeyStatus("No public key available. Generate keys first.");
        }
      } else if (encryptionType === EncryptionType.SYMMETRIC) {
        const key = exportSymmetricKey();
        if (key) {
          navigator.clipboard.writeText(key)
            .then(() => {
              setKeyStatus("Symmetric key copied to clipboard! Share this with your peer.");
            })
            .catch((err) => {
              console.error("Could not copy to clipboard:", err);
              setKeyStatus(`Symmetric key: ${key}`);
            });
        } else {
          setKeyStatus("No symmetric key available. Generate key first.");
        }
      }
    } catch (error) {
      console.error("Error exporting key:", error);
      setKeyStatus("Error exporting key.");
    }
  };

  // Check if keys are available
  const hasKeys = encryptionType === EncryptionType.ECIES 
    ? !!encryptionKeys.publicKey && !!encryptionKeys.privateKey
    : !!encryptionKeys.symmetricKey;

  // Check if peer key is available for ECIES
  const hasPeerKey = encryptionType === EncryptionType.ECIES && !!encryptionKeys.peerPublicKey;

  // Determine if encryption is fully ready
  const isEncryptionReady = encryptionType === EncryptionType.ECIES 
    ? hasKeys && hasPeerKey 
    : hasKeys;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-900">Encryption</h3>
      </div>
      <div className="px-5 py-5">
        <div className="flex items-center justify-between p-2">
          <span className="flex-grow flex flex-col">
            <span className="text-base font-medium text-gray-900">End-to-End Encryption</span>
            <span className="text-sm text-gray-500 mt-1">
              {isEncryptionEnabled ? 'Messages are encrypted' : 'Messages are sent in plaintext'}
            </span>
          </span>
          <button
            type="button"
            className={`${
              isEncryptionEnabled ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex flex-shrink-0 h-7 w-14 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            role="switch"
            aria-checked={isEncryptionEnabled}
            onClick={toggleEncryption}
          >
            <span
              aria-hidden="true"
              className={`${
                isEncryptionEnabled ? 'translate-x-7' : 'translate-x-0'
              } pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
            />
          </button>
        </div>

        {isEncryptionEnabled && (
          <div className="mt-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Encryption Type
              </label>
              <div className="flex space-x-4">
                <button
                  className={`px-4 py-2 text-sm rounded-md ${
                    encryptionType === EncryptionType.ECIES
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => handleEncryptionTypeChange(EncryptionType.ECIES)}
                >
                  Asymmetric (ECIES)
                </button>
                <button
                  className={`px-4 py-2 text-sm rounded-md ${
                    encryptionType === EncryptionType.SYMMETRIC
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => handleEncryptionTypeChange(EncryptionType.SYMMETRIC)}
                >
                  Symmetric
                </button>
              </div>
            </div>

            {/* Encryption type explanation */}
            <div className="mb-4 p-3 bg-gray-50 border-l-4 border-gray-300 text-gray-700 text-sm">
              {encryptionType === EncryptionType.ECIES ? (
                <>
                  <p className="font-medium mb-1">Asymmetric Encryption (ECIES) Setup:</p>
                  <ol className="list-decimal list-inside pl-2 space-y-1">
                    <li>Generate your keys</li>
                    <li>Export your public key and share it with your peer</li>
                    <li>Import your peer's public key</li>
                    <li>Now you can send encrypted messages to each other</li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="font-medium mb-1">Symmetric Encryption Setup:</p>
                  <ol className="list-decimal list-inside pl-2 space-y-1">
                    <li>Generate a symmetric key</li>
                    <li>Share this key with all participants through a secure channel</li>
                    <li>Everyone must import the same key</li>
                    <li>Now you can all send encrypted messages to each other</li>
                  </ol>
                </>
              )}
            </div>

            {/* Key status display */}
            {keyStatus && (
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-700">
                {keyStatus}
              </div>
            )}

            {/* Key status indicators */}
            <div className="mb-4 flex space-x-4">
              <div className={`px-3 py-1 rounded-full text-xs ${hasKeys ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {hasKeys ? 'Keys generated ✓' : 'No keys generated ✗'}
              </div>
              
              {encryptionType === EncryptionType.ECIES && (
                <div className={`px-3 py-1 rounded-full text-xs ${hasPeerKey ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {hasPeerKey ? 'Peer key imported ✓' : 'No peer key ✗'}
                </div>
              )}

              <div className={`px-3 py-1 rounded-full text-xs ${isEncryptionReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {isEncryptionReady ? 'Ready to encrypt ✓' : 'Not ready to encrypt ✗'}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
                onClick={handleGenerateKeys}
              >
                1. Generate Keys
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-md ${
                  hasKeys ? 'bg-green-600 text-white' : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
                onClick={handleExportKey}
                disabled={!hasKeys}
              >
                2. Export Key
              </button>
              <button
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md"
                onClick={() => setShowKeyInput(!showKeyInput)}
              >
                3. Import Key
              </button>
            </div>

            {showKeyInput && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {encryptionType === EncryptionType.ECIES
                    ? "Peer's Public Key (Hex)"
                    : "Symmetric Key (Hex)"}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={encryptionType === EncryptionType.ECIES ? peerPublicKey : symmetricKey}
                    onChange={(e) =>
                      encryptionType === EncryptionType.ECIES
                        ? setPeerPublicKey(e.target.value)
                        : setSymmetricKey(e.target.value)
                    }
                    placeholder={
                      encryptionType === EncryptionType.ECIES
                        ? "Enter peer's public key"
                        : "Enter symmetric key"
                    }
                  />
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md"
                    onClick={handleImportKey}
                  >
                    Import
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 