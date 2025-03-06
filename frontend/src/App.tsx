import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Collections from './pages/Collections';
import Collection from './pages/Collection';
import Digest from './pages/Digest';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Collections />} />
        <Route path="/collection/:name" element={<Collection />} />
        <Route path="/digest" element={<Digest />} />
      </Routes>
    </Router>
  );
}

export default App; 