import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Operations } from './pages/Operations';
import { Character } from './pages/Character';
import { Equipment } from './pages/Equipment';
import { Marketplace } from './pages/Marketplace';
import { Leaderboards } from './pages/Leaderboards';
import { Settings } from './pages/Settings';
import { AIAutoplay } from './pages/AIAutoplay';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/operations" element={<Operations />} />
          <Route path="/character" element={<Character />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route path="/ai-autoplay" element={<AIAutoplay />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
