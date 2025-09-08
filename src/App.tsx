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
import { Quests } from './pages/Quests';
import GuildManagement from './pages/GuildManagement';
import AICompanionHub from './pages/AICompanionHub';
import SocialDashboard from './pages/SocialDashboard';
import CrossPlatformSync from './pages/CrossPlatformSync';

function App() {
  return (
    <Router basename="/AI-Idle-Hacker">
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/operations" element={<Operations />} />
          <Route path="/character" element={<Character />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route path="/ai-autoplay" element={<AIAutoplay />} />
          <Route path="/guild" element={<GuildManagement />} />
          <Route path="/ai-companions" element={<AICompanionHub />} />
          <Route path="/social" element={<SocialDashboard />} />
          <Route path="/sync" element={<CrossPlatformSync />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
