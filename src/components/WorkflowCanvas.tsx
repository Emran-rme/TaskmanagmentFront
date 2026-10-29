import { memo, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type NodeProps,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "../workflow.css";
import WorkflowStageIcon from "./WorkflowStageIcon";
import { Settings2 } from "lucide-react";
import {
  flowLabels,
  ports,
  portLabels,
  type FlowNode,
  type FlowGraph,
} from "../lib/workflows";

export type CanvasNode = Node<
  { field: FlowNode; current: boolean },
  "workflow"
>;
const WorkflowNode = memo(function WorkflowNode({
  data,
  selected,
}: NodeProps<CanvasNode>) {
  return (
    <div
      className={`workflow-node workflow-kind-${data.field.kind} ${data.current ? "workflow-current" : ""} ${selected ? "workflow-selected" : ""}`}
    >
      {data.field.kind !== "start" && (
        <Handle type="target" position={Position.Top} />
      )}
      <div className="workflow-node-heading">
        <span className="workflow-stage-icon">
          <WorkflowStageIcon kind={data.field.kind} />
        </span>
        <small>{flowLabels[data.field.kind]}</small>
      </div>
      <button
        type="button"
        className="workflow-node-settings nodrag"
        aria-label={`تنظیمات ${data.field.label}`}
      >
        <Settings2 size={15} aria-hidden="true" />
      </button>
      <strong>{data.field.label}</strong>
      <div className="workflow-ports">
        {ports(data.field.kind).map((port, i, all) => (
          <span key={port}>
            {portLabels[port]}
            <Handle
              id={port}
              type="source"
              position={Position.Bottom}
              style={{ left: `${((i + 1) * 100) / (all.length + 1)}%` }}
            />
          </span>
        ))}
      </div>
    </div>
  );
});
const nodeTypes = { workflow: WorkflowNode };
export default function WorkflowCanvas({
  graph,
  current,
  selectedNodeId,
  editable = false,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelect,
}: {
  graph: FlowGraph;
  current?: string;
  selectedNodeId?: string;
  editable?: boolean;
  onNodesChange?: (changes: NodeChange<CanvasNode>[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
  onConnect?: (connection: Connection) => void;
  onSelect?: (id: string) => void;
}) {
  const [selectedEdge, setSelectedEdge] = useState("");
  const [instance, setInstance] =
    useState<ReactFlowInstance<CanvasNode> | null>(null);
  useEffect(() => {
    void instance?.fitView({ padding: 0.12, duration: 200 });
  }, [instance, graph.nodes.length]);
  const nodes = useMemo<CanvasNode[]>(
    () =>
      graph.nodes.map((field) => ({
        id: field.id,
        type: "workflow",
        selected: field.id === selectedNodeId,
        position: { x: field.x, y: field.y },
        data: { field, current: current === field.id },
      })),
    [graph.nodes, current, selectedNodeId],
  );
  const edges = useMemo<Edge[]>(
    () =>
      graph.edges.map((e) => ({
        ...e,
        selected: selectedEdge === e.id,
        sourceHandle: e.port,
        type: "smoothstep",
        style: {
          stroke:
            e.port === "reject"
              ? "#d28b99"
              : e.port === "approve"
                ? "#65a79d"
                : "#8c91b1",
          strokeWidth: 1.6,
        },
        labelStyle: {
          fontSize: 10,
          fontFamily: "IRANSans",
          fill: "var(--wf-node-muted)",
        },
        labelBgStyle: { fill: "var(--wf-canvas)", fillOpacity: 0.95 },
        labelBgPadding: [7, 4] as [number, number],
        labelBgBorderRadius: 5,
        label: portLabels[e.port],
        animated: e.source === current,
      })),
    [graph.edges, current, selectedEdge],
  );
  return (
    <div className="workflow-canvas" dir="ltr">
      <ReactFlow<CanvasNode>
        onInit={setInstance}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={(changes) => {
          for (const change of changes)
            if (change.type === "select")
              setSelectedEdge(change.selected ? change.id : "");
          onEdgesChange?.(changes);
        }}
        onEdgeClick={(_, edge) => {
          setSelectedEdge(edge.id);
          onSelect?.("");
        }}
        onPaneClick={() => {
          setSelectedEdge("");
          onSelect?.("");
        }}
        onConnect={onConnect}
        onNodeClick={(_, node) => {
          setSelectedEdge("");
          onSelect?.(node.id);
        }}
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable={editable}
        deleteKeyCode={editable ? ["Backspace", "Delete"] : null}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        aria-label="نمودار گردش‌کار"
      >
        <Background gap={22} size={1} color="var(--wf-dot)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
