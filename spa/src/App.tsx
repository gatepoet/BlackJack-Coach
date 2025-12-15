// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomeScreen } from './components/home/HomeScreen';
import { CardTracker } from './components/tracker/CardTracker';
import { StatisticsDashboard } from './components/stats/StatisticsDashboard';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { HistoryScreen } from './components/history/HistoryScreen';

export const App: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/track" element={<CardTracker />} />
      <Route path="/stats" element={<StatisticsDashboard />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="/history" element={<HistoryScreen />} />
    </Routes>
  </Router>
);
