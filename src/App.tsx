import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AchievementPopup } from './components/AchievementPopup';
import { createAchievementChecker } from './lib/achievementChecker';

// Lazy-loaded pages (non-critical routes)
const Operations = React.lazy(() => import('./pages/Operations').then(m => ({ default: m.Operations })));
const Character = React.lazy(() => import('./pages/Character').then(m => ({ default: m.Character })));
const Equipment = React.lazy(() => import('./pages/Equipment').then(m => ({ default: m.Equipment })));
const Marketplace = React.lazy(() => import('./pages/Marketplace').then(m => ({ default: m.Marketplace })));
const Leaderboards = React.lazy(() => import('./pages/Leaderboards').then(m => ({ default: m.Leaderboards })));
const Settings = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const AIAutoplay = React.lazy(() => import('./pages/AIAutoplay').then(m => ({ default: m.AIAutoplay })));
const Quests = React.lazy(() => import('./pages/Quests').then(m => ({ default: m.Quests })));
const GuildManagement = React.lazy(() => import('./pages/GuildManagement'));
const AICompanionHub = React.lazy(() => import('./pages/AICompanionHub'));
const SocialDashboard = React.lazy(() => import('./pages/SocialDashboard'));
const CrossPlatformSync = React.lazy(() => import('./pages/CrossPlatformSync'));

function App() {
  useEffect(() => {
    const unsubscribe = createAchievementChecker();
    return unsubscribe;
  }, []);

  return (
    <Router basename="/AI-Idle-Hacker">
      <Layout>
        <React.Suspense fallback={<div className="flex items-center justify-center h-full"><div className="text-cyber-primary font-mono animate-pulse">Loading...</div></div>}>
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
        </React.Suspense>
      </Layout>
      <AchievementPopup />
    </Router>
  );
}

export default App;
