/**
 * @license
 * Copyright 2023 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './App.css';
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import SitesPage from "./pages/SitesPage";
import EntryPage from "./pages/EntryPage";
import AllEntries from "./pages/AllEntries";
import UploadEntry from "./pages/UploadEntry";
import { GoogleMapsAPIProvider, useGoogleMapsAPI } from "./contexts/GoogleMapsAPIContext";


// To use video ID as parameter input instead of address, replace parameter value with a videoID '-wVXGP6Hkogfqz6sZulUf3'.
// Use sample video ID to test (this is guaranteed to work):
const PARAMETER_VALUE = '600 Peachtree St NE, Atlanta, GA 30308';
// Or try an address: '1600 Amphitheatre Parkway, Mountain View, CA'

function HomePage() {
  const navigate = useNavigate();
  const { requestAPIKey } = useGoogleMapsAPI();
  const videoRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState('');
  const [status, setStatus] = useState('');
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [dbStatus, setDbStatus] = useState('');

  // Fetch all entries from Django backend (for frontend later)
  const fetchAllEntries = async () => {
    setDbStatus('Loading entries...');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/all/');
      const data = await response.json();
      setEntries(data);
      setDbStatus(`Loaded ${data.length} entries`);
    } catch (error) {
      setDbStatus('Error: ' + error.message + ' (Is Django server running?)');
      console.error('Error fetching entries:', error);
    }
  };

  // Fetch a specific entry by ID
  // we will use ID for the map pins
  const fetchEntry = async (id) => {
    setDbStatus('Loading entry...');
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/entry/${id}/`);
      const data = await response.json();
      setSelectedEntry(data);
      setDbStatus('Entry loaded');
    } catch (error) {
      setDbStatus('Error: ' + error.message);
      console.error('Error fetching entry:', error);
    }
  };

  async function initAerialView() {
    setStatus('Requesting API key...');
    const apiKey = await requestAPIKey();
    
    if (!apiKey) {
      setStatus('');
      navigate('/all-entries');
      return;
    }

    setStatus('Loading...');
    
    // Parameter key can accept either 'videoId' or 'address' depending on input.
    const parameterKey = videoIdOrAddress(PARAMETER_VALUE);
    const urlParameter = new URLSearchParams();
    urlParameter.set(parameterKey, PARAMETER_VALUE);
    urlParameter.set('key', apiKey);
    
    try {
      const response = await fetch(`https://aerialview.googleapis.com/v1/videos:lookupVideo?${urlParameter.toString()}`);
      const videoResult = await response.json();
      
      console.log('API Response:', videoResult);

      if (videoResult.state === 'PROCESSING') {
        setStatus('Video still processing...');
      } else if (videoResult.error) {
        const errorMsg = videoResult.error.message || 'Unknown error';
        setStatus(`Error: ${errorMsg}\n\nℹ️ Aerial View videos are only available for specific locations. Try a different address or use a sample video ID like: -wVXGP6Hkogfqz6sZulUf3`);
        console.error('API Error:', videoResult.error);
      } else if (videoResult.uris?.MP4_MEDIUM?.landscapeUri) {
        setVideoSrc(videoResult.uris.MP4_MEDIUM.landscapeUri);
        setStatus('');
      } else {
        setStatus('Video not available in the expected format.');
        console.error('Unexpected response structure:', videoResult);
      }
    } catch (error) {
      setStatus('Error loading video: ' + error.message);
      console.error('Fetch error:', error);
    }
  }

  function videoIdOrAddress(value) {
    const videoIdRegex = /[0-9a-zA-Z-_]{22}/;
    return value.match(videoIdRegex) ? 'videoId' : 'address';
  }

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Historical Map</h1>
        <p style={{ color: '#ccc', maxWidth: '600px', margin: '10px auto' }}>
          Explore Atlanta's history through aerial views and historical entries
        </p>
        
        <div style={{ display: 'flex', gap: '15px', margin: '30px 0' }}>
          <button 
            onClick={initAerialView}
            style={{ 
              padding: '12px 24px', 
              fontSize: '16px', 
              cursor: 'pointer',
              backgroundColor: '#61dafb',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              color: '#0a0a0a'
            }}
          >
            Load Aerial View
          </button>
          
          <Link
            to="/all-entries"
            style={{ 
              padding: '12px 24px', 
              fontSize: '16px', 
              cursor: 'pointer',
              backgroundColor: '#333',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              color: '#fff',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Browse All Entries
          </Link>
        </div>

        {status && <p>{status}</p>}
        {videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            onClick={handleVideoClick}
            controls
            style={{ maxWidth: '100%', cursor: 'pointer' }}
          />
        )}
        
        {/* Database Section */}
        <div style={{ marginTop: '40px', width: '80%' }}>
          <h2>Historical Database</h2>
          
          <button 
            onClick={fetchAllEntries}
            style={{ 
              padding: '10px 20px', 
              fontSize: '16px', 
              cursor: 'pointer',
              margin: '10px'
            }}
          >
            Load All Entries
          </button>
          
          <p style={{ color: '#61dafb' }}>{dbStatus}</p>
          
          {/* Display all entries */}
          {entries.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3>Entries:</h3>
              {entries.map(entry => (
                <div key={entry.id} style={{ 
                  border: '1px solid #61dafb', 
                  padding: '15px', 
                  margin: '10px 0',
                  borderRadius: '5px',
                  textAlign: 'left'
                }}>
                  <h4>{entry.name}</h4>
                  <button 
                    onClick={() => fetchEntry(entry.id)}
                    style={{ 
                      padding: '5px 15px', 
                      cursor: 'pointer',
                      marginTop: '5px'
                    }}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Display selected entry details */}
          {selectedEntry && (
            <div style={{ 
              marginTop: '20px', 
              padding: '20px', 
              backgroundColor: '#1a1a1a',
              borderRadius: '10px',
              textAlign: 'left'
            }}>
              <h3>Entry Details:</h3>
              <p><strong>ID:</strong> {selectedEntry.id}</p>
              <p><strong>Name:</strong> {selectedEntry.name}</p>
              <p><strong>Details:</strong></p>
              <pre style={{ 
                backgroundColor: '#0a0a0a', 
                padding: '10px', 
                borderRadius: '5px',
                overflow: 'auto'
              }}>
                {JSON.stringify(selectedEntry.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

function App() {
  return (
    <GoogleMapsAPIProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SitesPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/tours" element={<SitesPage />} />
          <Route path="/entry/:id" element={<EntryPage />} />
          <Route path="/all-entries" element={<AllEntries />} />
          <Route path="/upload" element={<UploadEntry />} />
        </Routes>
      </Router>
    </GoogleMapsAPIProvider>
  );
}

export default App;
