/**
 * @license
 * Copyright 2023 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import './App.css';
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import SitesPage from "./pages/SitesPage";
import EntryPage from "./pages/EntryPage";
import AllEntries from "./pages/AllEntries";
import UploadEntry from "./pages/UploadEntry";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import { GoogleMapsAPIProvider} from "./contexts/GoogleMapsAPIContext";


function App() {
  return (
    <GoogleMapsAPIProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SitesPage />} />
          {/* <Route path="/home" element={<HomePage />} /> */}
          <Route path="/tours" element={<SitesPage />} />
          <Route path="/entry/:id" element={<EntryPage />} />
          <Route path="/all-entries" element={<AllEntries />} />
          <Route path="/upload" element={<UploadEntry />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </GoogleMapsAPIProvider>
  );
}

export default App;
