import { useState, useCallback, useRef } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import FlowCanvas from './components/FlowCanvas';
import Sidebar from './components/Sidebar';
import LanguageSelector from './components/LanguageSelector';

function AppContent() {
  const [flowNodes, setFlowNodes] = useState([]);
  const [flowEdges, setFlowEdges] = useState([]);
  const [loadKey, setLoadKey] = useState(0);

  const handleFlowChange = useCallback((nodes, edges) => {
    setFlowNodes(nodes);
    setFlowEdges(edges);
  }, []);

  const handleLoadCombo = useCallback((nodes, edges) => {
    setFlowNodes(nodes);
    setFlowEdges(edges);
    setLoadKey((k) => k + 1); // force re-mount of FlowCanvas
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
