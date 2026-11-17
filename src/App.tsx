import { AppStoreProvider, useAppStore } from './hooks/useAppStore';
import { BottomNav } from './components/Layout/BottomNav';
import { ScoreBoard } from './components/Scoreboard/ScoreBoard';
import { NewGamePage } from './components/Game/NewGamePage';
import { GameHistoryPage } from './components/History/GameHistoryPage';
import { SettingsPage } from './components/Settings/SettingsPage';
import { WinnerModal } from './components/Game/WinnerModal';
import './styles/global.css';
import './styles/scoreboard.css';

function AppContent() {
  const { tab } = useAppStore();

  return (
    <div className="app-shell">
      <main className="app-main">
        {tab === 'scoreboard' && <ScoreBoard />}
        {tab === 'new' && <NewGamePage />}
        {tab === 'history' && <GameHistoryPage />}
        {tab === 'settings' && <SettingsPage />}
      </main>
      <BottomNav />
      <WinnerModal />
    </div>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <AppContent />
    </AppStoreProvider>
  );
}
