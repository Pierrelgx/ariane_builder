"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  Panel,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import EventNode, { EventNodeData } from "./EventNode";
import { detectTemporalInconsistencies } from "@utils/temporalConsistency";

const nodeTypes = {
  eventNode: EventNode,
};

interface TimelineEvent {
  id: string;
  title: string;
  description?: string | null;
  date?: string | null;
  positionX: number;
  positionY: number;
  nexts?: Array<{
    id: string;
    nextId: string | null;
    type: string;
    order: number;
  }>;
}

interface TimelineCanvasProps {
  events: TimelineEvent[];
  onEventCreate: (position: { x: number; y: number }) => void;
  onEventUpdate: (id: string, position: { x: number; y: number }) => void;
  onEventDelete: (id: string) => void;
  onEventEdit: (id: string) => void;
  onConnectionCreate: (source: string, target: string, type: string) => void;
  onConnectionDelete: (source: string, target: string) => void;
}

function TimelineCanvasInner({
  events,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onEventEdit,
  onConnectionCreate,
  onConnectionDelete,
}: TimelineCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Detect temporal inconsistencies
  const inconsistentNodes = useMemo(() => {
    return detectTemporalInconsistencies(events);
  }, [events]);

  // Convert events to ReactFlow nodes
  useEffect(() => {
    const flowNodes: Node<EventNodeData>[] = events.map((event) => ({
      id: event.id,
      type: "eventNode",
      position: { x: event.positionX, y: event.positionY },
      data: {
        id: event.id,
        title: event.title,
        description: event.description || undefined,
        date: event.date ? new Date(event.date) : null,
        hasInconsistency: inconsistentNodes.has(event.id),
        onEdit: onEventEdit,
        onDelete: onEventDelete,
      },
    }));

    setNodes(flowNodes);
  }, [events, inconsistentNodes, onEventEdit, onEventDelete, setNodes]);

  // Convert connections to ReactFlow edges
  useEffect(() => {
    const flowEdges: Edge[] = [];

    events.forEach((event) => {
      event.nexts?.forEach((connection) => {
        if (connection.nextId) {
          flowEdges.push({
            id: connection.id,
            source: event.id,
            target: connection.nextId,
            type: "smoothstep",
            animated: connection.type === "TIMETRAVEL",
            style: {
              stroke: connection.type === "TIMETRAVEL" ? "#a855f7" : "#22c55e",
              strokeWidth: 2,
            },
            label: connection.type === "TIMETRAVEL" ? "Time Travel" : undefined,
            labelStyle: { fill: "#a855f7", fontWeight: 500 },
            labelBgStyle: { fill: "#1f1f1f", fillOpacity: 0.9 },
          });
        }
      });
    });

    setEdges(flowEdges);
  }, [events, setEdges]);

  // Handle new connection
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        // Determine connection type based on temporal logic
        const sourceEvent = events.find((e) => e.id === connection.source);
        const targetEvent = events.find((e) => e.id === connection.target);

        let connectionType = "LINEAR";

        if (sourceEvent?.date && targetEvent?.date) {
          const sourceDate = new Date(sourceEvent.date);
          const targetDate = new Date(targetEvent.date);

          // If target is before source, it's time travel
          if (targetDate < sourceDate) {
            connectionType = "TIMETRAVEL";
          }
        }

        onConnectionCreate(connection.source, connection.target, connectionType);
      }
    },
    [events, onConnectionCreate]
  );

  // Handle node position update
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onEventUpdate(node.id, {
        x: node.position.x,
        y: node.position.y,
      });

      // Update position via API
      fetch(`/api/events/${node.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionX: node.position.x,
          positionY: node.position.y,
        }),
      });
    },
    [onEventUpdate]
  );

  // Remove onPaneClick - we'll use button only to avoid false positives

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  // Handle delete key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Delete" && selectedNode) {
        onEventDelete(selectedNode);
        setSelectedNode(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedNode, onEventDelete]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        <Background color="#333" gap={20} />
        <Controls className="!bg-dark-200 !border-dark-400 !shadow-lg [&>button]:!bg-dark-300 [&>button]:!border-dark-500 [&>button]:!text-gray-300 [&>button:hover]:!bg-dark-400" />
        <MiniMap
          nodeColor="#22c55e"
          maskColor="rgba(0, 0, 0, 0.7)"
          style={{ backgroundColor: "#1f1f1f" }}
        />
        <Panel position="top-left" className="bg-dark-200 p-4 rounded-lg shadow-lg border border-dark-400">
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-white">Timeline Builder</h3>
            <div className="text-sm text-gray-400 space-y-1">
              <p>• Utilisez le bouton en haut à droite pour créer un événement</p>
              <p>• Reliez les événements en glissant entre eux</p>
              <p>• Sélectionnez un node et appuyez sur Delete pour supprimer</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <div className="w-4 h-0.5 bg-green-500"></div>
              <span>Connexion linéaire</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <div className="w-4 h-0.5 bg-purple-500"></div>
              <span>Voyage temporel</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function TimelineCanvas(props: TimelineCanvasProps) {
  return (
    <ReactFlowProvider>
      <TimelineCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
