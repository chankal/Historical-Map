/**
 * @license
 * Copyright 2023 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef, useState } from 'react';
import './App.css';

// To use video ID as parameter input instead of address, replace parameter value with a videoID '-wVXGP6Hkogfqz6sZulUf3'.
// Use sample video ID to test (this is guaranteed to work):
const PARAMETER_VALUE = '600 Peachtree St NE, Atlanta, GA 30308';
// Or try an address: '1600 Amphitheatre Parkway, Mountain View, CA'
const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API;

function App() {
  const videoRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState('');
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    async function initAerialView() {
      // Parameter key can accept either 'videoId' or 'address' depending on input.
      const parameterKey = videoIdOrAddress(PARAMETER_VALUE);
      const urlParameter = new URLSearchParams();
      urlParameter.set(parameterKey, PARAMETER_VALUE);
      urlParameter.set('key', API_KEY);
      
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

    initAerialView();
  }, []);

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
        <h1>Google Aerial View</h1>
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
      </header>
    </div>
  );
}

export default App;
