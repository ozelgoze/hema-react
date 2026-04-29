import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import FlowCanvas from './components/FlowCanvas';
import Sidebar from './components/Sidebar';
import LandingPage from './components/LandingPage';
import { hasSeenOnboarding } from './utils/onboardingState';

const OnboardingTour = lazy(() => import('./components/OnboardingTour'));
const TournamentAlmanac = lazy(() => import('./components/TournamentAlmanac'));

const MAX_SCORE = 3;

function ComboApp({ onExit }) {
  const [flowNodes, setFlowNodes] = useState([]);
  const [flowEdges, setFlowEdges] = useState([]);
  const [loadKey, setLoadKey] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [tourOpen, setTourOpen] = useState(false);
  const [almanacOpen, setAlmanacOpen] = useState(false);

  useEffect(() => {
    if (!hasSeenOnboarding()) setTourOpen(true);
  }, []);

  const handleFlowChange = useCallback((nodes, edges) => {
    setFlowNodes(nodes);
    setFlowEdges(edges);
  }, []);

  const handleLoadCombo = useCallback((nodes, edges) => {
    setFlowNodes(nodes);
    setFlowEdges(edges);
    setLoadKey((k) => k + 1);
  }, []);

  const handleScoreUpdate = useCallback((winner) => {
    if (winner === 'user') setUserScore((s) => s + 1);
    else if (winner === 'ai') setAiScore((s) => s + 1);
  }, []);

  const handleMatchReset = useCallback(() => {
    setUserScore(0);
    setAiScore(0);
    setFlowNodes([]);
    setFlowEdges([]);
    setLoadKey((k) => k + 1);
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden absolute inset-0">
      <Sidebar
        currentNodes={flowNodes}
        currentEdges={flowEdges}
        onLoadCombo={handleLoadCombo}
        onShowTutorial={() => setTourOpen(true)}
        onShowAlmanac={() => setAlmanacOpen(true)}
        onExit={onExit}
      />
      <div className="flex-1 h-full">
        <FlowCanvas
          key={loadKey}
          externalNodes={flowNodes}
          externalEdges={flowEdges}
          onFlowChange={handleFlowChange}
          userScore={userScore}
          aiScore={aiScore}
          onScoreUpdate={handleScoreUpdate}
          onMatchReset={handleMatchReset}
          maxScore={MAX_SCORE}
        />
      </div>
      {tourOpen && (
        <Suspense fallback={null}>
          <OnboardingTour open={tourOpen} onClose={() => setTourOpen(false)} />
        </Suspense>
      )}
      {almanacOpen && (
        <Suspense fallback={null}>
          <TournamentAlmanac open={almanacOpen} onClose={() => setAlmanacOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}

function AppContent() {
  const [view, setView] = useState('landing');

  if (view === 'landing') {
    return <LandingPage onEnter={() => setView('combo')} />;
  }
  return <ComboApp onExit={() => setView('landing')} />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
