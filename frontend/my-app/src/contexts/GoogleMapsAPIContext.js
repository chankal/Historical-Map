import { createContext, useContext } from 'react';

const GoogleMapsAPIContext = createContext(null);

export function GoogleMapsAPIProvider({ children }) {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || null;

  return (
    <GoogleMapsAPIContext.Provider value={{ apiKey }}>
      {children}
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
