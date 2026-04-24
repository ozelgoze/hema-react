import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { useTranslation } from '../i18n/LanguageContext';

import ActionNode from './nodes/ActionNode';
import InkEdge from './nodes/InkEdge';
import ComboWizard from './ComboWizard';
import ChronicleLog from './ChronicleLog';

const nodeTypes = { actionNode: ActionNode };
const edgeTypes = { inkEdge: InkEdge };

function FlowCanvasInner({ nodes, edges, onNodesChange, onEdgesChange, onAddNode, onUndo, onClear, onMatchReset, currentStep, activeNodeId, setActiveNodeId, isMoveModalOpen, setIsMoveModalOpen, userScore, aiScore, onScoreUpdate, maxScore }) {
  const { t } = useTranslation();
  const { fitView } = useReactFlow();

  // Re-fit the canvas after orientation change so rotating from portrait → landscape
  // (or vice versa) doesn't leave combo nodes off-screen. Debounced to let the browser settle.
  useEffect(() => {
    let timer;
    const refit = () => {
      clearTimeout(timer);
      timer = setTimeout(() => fitView({ padding: 0.4, maxZoom: 1.2, duration: 300 }), 150);
    };
    window.addEventListener('orientationchange', refit);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('orientationchange', refit);
    };
  }, [fitView]);

  const handleDownloadImage = useCallback(() => {
    const flowElement = document.querySelector('.react-flow');
    if (!flowElement) return;

    toPng(flowElement, { 
      backgroundColor: '#020617',
      quality: 1,
      pixelRatio: 2,
    }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = `hema-duel-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }).catch((err) => {
      console.error('Failed to export image', err);
    });
  }, []);

  return (
    <div className="w-full h-full relative">
      {/* Vellum vignette — subtle edge darkening for aged-parchment depth */}
      <div className="vellum-vignette" aria-hidden="true" />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.4, maxZoom: 1.2 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'inkEdge',
          animated: false,
        }}
        colorMode="light"
        onNodeClick={(_, node) => {
          setActiveNodeId(node.id);
          if (node.data?.isSelector) {
            setIsMoveModalOpen(true);
          }
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="rgba(42, 37, 34, 0.18)"
        />
        <Controls
          position="top-left"
          showInteractive={false}
          className="!top-[76px] !left-3 md:!top-auto md:!bottom-4 md:!left-4 !bg-[var(--color-parchment-light)] !border-2 !border-[var(--color-ink-black)] !rounded-none !shadow-[4px_4px_0_0_var(--color-ink-black)] [&>button]:!bg-[var(--color-parchment)] [&>button]:!border-[var(--color-ink-faded)] [&>button]:!border-0 [&>button]:!border-b [&>button]:!text-[var(--color-ink-black)] [&>button:hover]:!bg-[var(--color-ink-black)] [&>button:hover]:!text-[var(--color-parchment-light)] [&>button]:!w-11 [&>button]:!h-11 md:[&>button]:!w-7 md:[&>button]:!h-7 [&>button:last-child]:!border-b-0 [&_svg]:!max-w-[60%] [&_svg]:!max-h-[60%]"
        />
        <MiniMap
          pannable
          zoomable
          nodeColor={(node) => {
            const role = node.data?.nodeRole;
            if (role === 'user-action') return '#2a2522';
            if (role === 'opponent-action') return '#8B0000';
            if (role === 'opponent-point') return '#8B0000';
            if (role === 'scoring-point') return '#c5a059';
            return '#4a443f';
          }}
          nodeStrokeColor="#2a2522"
          nodeStrokeWidth={2}
          nodeBorderRadius={0}
          maskColor="rgba(42, 37, 34, 0.35)"
          maskStrokeColor="#2a2522"
          maskStrokeWidth={1}
          className="!hidden md:!block !bg-[var(--color-parchment-light)] !border-2 !border-[var(--color-ink-black)] !rounded-none !shadow-[4px_4px_0_0_var(--color-ink-black)]"
        />
      </ReactFlow>

      <ComboWizard
        currentStep={currentStep}
        nodes={nodes}
        onAddNode={onAddNode}
        onUndo={onUndo}
        onClear={onClear}
        onMatchReset={onMatchReset}
        isMoveModalOpen={isMoveModalOpen}
        setIsMoveModalOpen={setIsMoveModalOpen}
        activeNodeId={activeNodeId}
        userScore={userScore}
        aiScore={aiScore}
        onScoreUpdate={onScoreUpdate}
        maxScore={maxScore}
      />

      <ChronicleLog nodes={nodes} />

      <button
        onClick={handleDownloadImage}
        aria-label={t('download_image')}
        className="absolute top-[128px] right-3 md:top-auto md:bottom-6 md:right-6 z-50 bg-[var(--color-parchment-light)] text-[var(--color-ink-black)] border-2 border-[var(--color-ink-black)] shadow-[4px_4px_0_0_var(--color-ink-black)] hover:bg-[var(--color-ink-black)] hover:text-[var(--color-gold)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all px-3 py-2 md:px-4 md:py-3 text-[10px] md:text-xs font-display font-bold uppercase tracking-widest flex items-center gap-1.5 md:gap-2 cursor-pointer min-h-[44px] min-w-[44px] justify-center"
        title={t('download_image')}
      >
        <span className="text-sm md:text-lg filter grayscale">✒</span>
        <span className="hidden md:inline">{t('download_btn')}</span>
      </button>
    </div>
  );
}

export default function FlowCanvas({ externalNodes, externalEdges, onFlowChange, userScore, aiScore, onScoreUpdate, onMatchReset, maxScore }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(externalNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(externalEdges || []);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState(
    externalNodes && externalNodes.length > 0 ? externalNodes[externalNodes.length - 1].id : null
  );

  // Sync when external data loads (e.g. from sidebar) — using useEffect instead of setState during render
  const lastExternalRef = useRef(externalNodes);
  useEffect(() => {
    if (externalNodes && externalNodes !== lastExternalRef.current) {
      lastExternalRef.current = externalNodes;
      setNodes(externalNodes);
      setEdges(externalEdges || []);
      if (externalNodes.length > 0) {
        setActiveNodeId(externalNodes[externalNodes.length - 1].id);
      } else {
        setActiveNodeId(null);
      }
    }
  }, [externalNodes, externalEdges, setNodes, setEdges]);


  const activeNode = nodes.find(n => n.id === activeNodeId);
  const currentStep = activeNode ? (activeNode.data?.step || 0) : 0;

  const handleAddNode = useCallback(
    (moveData, isUpdate = false) => {
      if (isUpdate && activeNodeId) {
        const newNodes = nodes.map(n => n.id === activeNodeId ? { ...n, data: { ...n.data, ...moveData, isSelector: false } } : n);
        setNodes(newNodes);
        if (onFlowChange) onFlowChange(newNodes, edges);
        setIsMoveModalOpen(false);
        return;
      }

      const newNodeId = `node-${Date.now()}`;
      
      let parentNode = nodes.find(n => n.id === activeNodeId);
      if (!parentNode && nodes.length > 0) {
        parentNode = nodes[nodes.length - 1]; // fallback to last
      }

      const step = parentNode ? (parentNode.data?.step || 0) + 1 : 1;
      const yPos = step * 170;
      
      let xPos = 250;
      if (parentNode) {
        const siblings = nodes.filter(n => n.data?.parentId === parentNode.id);
        const numSiblings = siblings.length;
        const offset = Math.ceil(numSiblings / 2) * (numSiblings % 2 !== 0 ? 360 : -360);
        xPos = parentNode.position.x + offset;
      }

      const newNode = {
        id: newNodeId,
        type: 'actionNode',
        position: { x: xPos, y: yPos },
        data: { ...moveData, parentId: parentNode?.id || null, step, isActive: true },
      };

      // Reset isActive on old nodes
      const baseNodes = nodes.map(n => ({ ...n, data: { ...n.data, isActive: false }}));
      const newNodes = [...baseNodes, newNode];
      const newEdges = [...edges];

      // Connect to previous node — stroke picks from the manuscript palette:
      // gold for scoring, crimson for opponent, ink-black for the user's own line.
      if (parentNode) {
        const edgeStroke =
          moveData.nodeRole === 'scoring-point'
            ? 'var(--color-gold)'
            : moveData.nodeRole === 'opponent-point' || moveData.nodeRole === 'opponent-action'
              ? 'var(--color-ink-red)'
              : 'var(--color-ink-black)';
        newEdges.push({
          id: `edge-${parentNode.id}-${newNodeId}`,
          source: parentNode.id,
          target: newNodeId,
          animated: false,
          style: {
            stroke: edgeStroke,
            strokeWidth: moveData.nodeRole === 'scoring-point' ? 4 : 3,
            strokeLinecap: 'square',
          },
        });
      }

      setNodes(newNodes);
      setEdges(newEdges);
      setActiveNodeId(newNodeId);

      if (onFlowChange) {
        onFlowChange(newNodes, newEdges);
      }
    },
    [nodes, edges, activeNodeId, setNodes, setEdges, onFlowChange],
  );

  // Inject initial SelectorNode if canvas is completely empty
  useEffect(() => {
    if (nodes.length === 0) {
      const timer = setTimeout(() => {
        handleAddNode({ isSelector: true, nodeRole: 'user-action' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, handleAddNode]);

  const handleUndo = useCallback(() => {
    if (!activeNodeId) return;

    // Find the last completed user decision by walking up the tree
    let targetDeleteId = activeNodeId;
    let currNode = nodes.find(n => n.id === targetDeleteId);

    while (currNode && (currNode.data?.isSelector || currNode.data?.nodeRole !== 'user-action')) {
       if (!currNode.data?.parentId) break; // Reached root
       currNode = nodes.find(n => n.id === currNode.data.parentId);
    }

    if (currNode && currNode.data?.nodeRole === 'user-action' && !currNode.data?.isSelector) {
        targetDeleteId = currNode.id;
    } else if (currNode && currNode.data?.isSelector && !currNode.data?.parentId) {
        return; // Nothing to undo, just the initial empty selector
    }

    // Prune the target node and all its descendants
    const getDescendants = (nodeId, allNodes) => {
      const children = allNodes.filter(n => n.data?.parentId === nodeId).map(n => n.id);
      let desc = [...children];
      children.forEach(childId => {
        desc = [...desc, ...getDescendants(childId, allNodes)];
      });
      return desc;
    };

    const toDeleteIds = [targetDeleteId, ...getDescendants(targetDeleteId, nodes)];
    
    // Clear isActive flag generally
    const newNodes = nodes
      .filter(n => !toDeleteIds.includes(n.id))
      .map(n => ({ ...n, data: { ...n.data, isActive: false }}));
      
    const newEdges = edges.filter(e => !toDeleteIds.includes(e.source) && !toDeleteIds.includes(e.target));
    
    setNodes(newNodes);
    setEdges(newEdges);
    
    if (newNodes.length > 0) {
      const lastLeft = newNodes[newNodes.length - 1];
      lastLeft.data.isActive = true;
      setActiveNodeId(lastLeft.id);
    } else {
      setActiveNodeId(null);
    }

    if (onFlowChange) onFlowChange(newNodes, newEdges);
  }, [activeNodeId, nodes, edges, setNodes, setEdges, onFlowChange]);

  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setActiveNodeId(null);
    if (onFlowChange) onFlowChange([], []);
  }, [setNodes, setEdges, onFlowChange]);

  return (
    <ReactFlowProvider>
      <FlowCanvasInner
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onAddNode={handleAddNode}
        onUndo={handleUndo}
        onClear={handleClear}
        currentStep={currentStep}
        activeNodeId={activeNodeId}
        setActiveNodeId={setActiveNodeId}
        isMoveModalOpen={isMoveModalOpen}
        setIsMoveModalOpen={setIsMoveModalOpen}
        userScore={userScore}
        aiScore={aiScore}
        onScoreUpdate={onScoreUpdate}
        onMatchReset={onMatchReset}
        maxScore={maxScore}
      />
    </ReactFlowProvider>
  );
}
