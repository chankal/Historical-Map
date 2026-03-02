import { createContext, useContext, useState, useCallback } from 'react';

const GoogleMapsAPIContext = createContext(null);

export function GoogleMapsAPIProvider({ children }) {
  const [apiKey, setApiKey] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptResolver, setPromptResolver] = useState(null);

  const requestAPIKey = useCallback(() => {
    return new Promise((resolve) => {
      if (apiKey) {
        resolve(apiKey);
        return;
      }

      setPromptResolver(() => resolve);
      setShowPrompt(true);
    });
  }, [apiKey]);

  const submitAPIKey = useCallback((key) => {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      setApiKey(trimmedKey);
      setShowPrompt(false);
      if (promptResolver) {
        promptResolver(trimmedKey);
        setPromptResolver(null);
      }
    }
  }, [promptResolver]);

  const closePrompt = useCallback(() => {
    setShowPrompt(false);
    if (promptResolver) {
      promptResolver(null);
      setPromptResolver(null);
    }
  }, [promptResolver]);

  return (
    <GoogleMapsAPIContext.Provider value={{ apiKey, requestAPIKey }}>
      {children}
      {showPrompt && (
        <APIKeyPrompt 
          onSubmit={submitAPIKey} 
          onClose={closePrompt}
        />
      )}
    </GoogleMapsAPIContext.Provider>
  );
}

export function useGoogleMapsAPI() {
  const context = useContext(GoogleMapsAPIContext);
  if (!context) {
    throw new Error('useGoogleMapsAPI must be used within GoogleMapsAPIProvider');
  }
  return context;
}

function APIKeyPrompt({ onSubmit, onClose }) {
  const [key, setKey] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (key.trim()) {
      onSubmit(key);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '30px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        border: '1px solid #333',
      }}>
        <h2 style={{ 
          margin: '0 0 15px 0', 
          color: '#61dafb',
          fontSize: '24px'
        }}>
          Google Maps API Key Required
        </h2>
        <p style={{ 
          margin: '0 0 20px 0', 
          color: '#ccc',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          This feature requires a Google Maps API key. Your key will be stored only in memory during this session and will not be saved to disk or any file.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter your Google Maps API key"
            autoFocus
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              border: '1px solid #333',
              borderRadius: '6px',
              backgroundColor: '#0a0a0a',
              color: '#fff',
              marginBottom: '15px',
              boxSizing: 'border-box',
              fontFamily: 'monospace'
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleSkip}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#333',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Skip (Browse Entries)
            </button>
            <button
              type="submit"
              disabled={!key.trim()}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: key.trim() ? '#61dafb' : '#444',
                color: key.trim() ? '#0a0a0a' : '#888',
                cursor: key.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Submit
            </button>
          </div>
        </form>
        <p style={{
          margin: '15px 0 0 0',
          fontSize: '12px',
          color: '#666',
        }}>
          Don't have an API key? <a 
            href="https://developers.google.com/maps/documentation/javascript/get-api-key" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#61dafb' }}
          >
            Get one here
          </a>
        </p>
      </div>
    </div>
  );
}
