import { useState, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';

import ActionNode from './nodes/ActionNode';
import InkEdge from './nodes/InkEdge';
import ComboWizard from './ComboWizard';
import ChronicleLog from './ChronicleLog';

const nodeTypes = { actionNode: ActionNode };
const edgeTypes = { inkEdge: InkEdge };

function FlowCanvasInner({ nodes, edges, onNodesChange, onEdgesChange, onAddNode, onUndo, onRewindToStep, onClear, currentStep }) {
  const handleDownloadImage = useCallback(() => {
    const flowElement = document.querySelector('.react-flow');
    if (!flowElement) return;

    toPng(flowElement, { 
      backgroundColor: '#020617', // Matches dark background
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
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#334155"
        />
        <Controls
          className="!bg-slate-800/80 !border-slate-700 !rounded-lg !shadow-xl [&>button]:!bg-slate-700 [&>button]:!border-slate-600 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-600"
        />
        <MiniMap
          nodeColor={(node) => {
            const role = node.data?.nodeRole;
            if (role === 'user-action') return '#10b981';
            if (role === 'opponent-action') return '#f43f5e';
            if (role === 'opponent-point') return '#e11d48';
            if (role === 'scoring-point') return '#f59e0b';
            return '#64748b';
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          className="!bg-black/50 !border-white/10 !rounded-lg backdrop-blur-md"
        />
      </ReactFlow>

      <ComboWizard
        currentStep={currentStep}
        nodes={nodes}
        onAddNode={onAddNode}
        onUndo={onUndo}
        onRewindToStep={onRewindToStep}
        onClear={onClear}
      />

      <ChronicleLog nodes={nodes} />

      <button
        onClick={handleDownloadImage}
        className="absolute top-20 right-4 md:top-auto md:bottom-6 md:right-6 z-50 glass-panel px-3 py-2 md:px-4 md:py-3 rounded-full text-[10px] md:text-xs font-bold text-amber-300 uppercase tracking-widest border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/20 hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.15)] flex items-center gap-1 md:gap-2 cursor-pointer"
        title="Tuvali Yüksek Kaliteli Resim Olarak İndir"
      >
        <span className="text-sm md:text-lg filter grayscale opacity-80">📸</span> <span className="hidden md:inline">Komboyu İndir</span>
      </button>
    </div>
  );
}

export default function FlowCanvas({ externalNodes, externalEdges, onFlowChange }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(externalNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(externalEdges || []);
  const [currentStep, setCurrentStep] = useState(externalNodes?.length || 0);

  // Sync when external data loads (e.g. from sidebar)
  const lastExternalRef = useRef(null);
  if (externalNodes && externalNodes !== lastExternalRef.current) {
    lastExternalRef.current = externalNodes;
    // Use setTimeout to avoid calling setState during render
    setTimeout(() => {
      setNodes(externalNodes);
      setEdges(externalEdges || []);
      setCurrentStep(externalNodes.length);
    }, 0);
  }

  const handleAddNode = useCallback(
    (moveData) => {
      const newNodeId = `node-${Date.now()}`;
      const yPos = currentStep * 170;

      const newNode = {
        id: newNodeId,
        type: 'actionNode',
        position: { x: 250, y: yPos },
        data: moveData,
      };

      const newNodes = [...nodes, newNode];
      const newEdges = [...edges];

      // Connect to previous node
      if (nodes.length > 0) {
        const prevNode = nodes[nodes.length - 1];
        newEdges.push({
          id: `edge-${prevNode.id}-${newNodeId}`,
          source: prevNode.id,
          target: newNodeId,
          animated: true,
          style: {
            stroke:
              moveData.nodeRole === 'scoring-point'
                ? '#f59e0b'
                : moveData.nodeRole === 'opponent-point'
                  ? '#e11d48'
                  : moveData.nodeRole === 'opponent-action'
                    ? '#f43f5e'
                    : '#10b981',
            strokeWidth: 3,
            filter: 'drop-shadow(0 0 3px currentColor)',
          },
        });
      }

      setNodes(newNodes);
      setEdges(newEdges);
      setCurrentStep((s) => s + 1);

      if (onFlowChange) {
        onFlowChange(newNodes, newEdges);
      }
    },
    [nodes, edges, currentStep, setNodes, setEdges, onFlowChange],
  );

  const handleUndo = useCallback(() => {
    if (nodes.length === 0) return;
    const newNodes = nodes.slice(0, -1);
    const newEdges = edges.slice(0, -1);
    setNodes(newNodes);
    setEdges(newEdges);
    setCurrentStep((s) => Math.max(0, s - 1));
    if (onFlowChange) onFlowChange(newNodes, newEdges);
  }, [nodes, edges, setNodes, setEdges, onFlowChange]);

  const handleRewindToStep = useCallback((stepIndex) => {
    if (nodes.length === 0 || stepIndex >= nodes.length) return;
    const newNodes = nodes.slice(0, stepIndex);
    const edgesToKeep = stepIndex - 1 > 0 ? stepIndex - 1 : 0;
    const newEdges = edges.slice(0, edgesToKeep);
    setNodes(newNodes);
    setEdges(newEdges);
    setCurrentStep(stepIndex);
    if (onFlowChange) onFlowChange(newNodes, newEdges);
  }, [nodes, edges, setNodes, setEdges, onFlowChange]);

  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setCurrentStep(0);
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
        onRewindToStep={handleRewindToStep}
        onClear={handleClear}
        currentStep={currentStep}
      />
    </ReactFlowProvider>
  );
}
