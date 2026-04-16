import { useState, useCallback } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import FlowCanvas from './components/FlowCanvas';
import Sidebar from './components/Sidebar';

const MAX_SCORE = 3; // First to 3 wins

function AppContent() {
  const [flowNodes, setFlowNodes] = useState([]);
  const [flowEdges, setFlowEdges] = useState([]);
  const [loadKey, setLoadKey] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);

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
    if (winner === 'user') {
      setUserScore((s) => s + 1);
    } else if (winner === 'ai') {
      setAiScore((s) => s + 1);
    }
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden absolute inset-0">
      <Sidebar
        currentNodes={flowNodes}
        currentEdges={flowEdges}
        onLoadCombo={handleLoadCombo}
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
          maxScore={MAX_SCORE}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
