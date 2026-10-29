import { memo, useMemo } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
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
      className={`workflow-node ${data.current ? "workflow-current" : ""} ${selected ? "workflow-selected" : ""}`}
    >
      {data.field.kind !== "start" && (
        <Handle type="target" position={Position.Top} />
      )}
      <small>{flowLabels[data.field.kind]}</small>
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
  editable = false,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelect,
}: {
  graph: FlowGraph;
  current?: string;
  editable?: boolean;
  onNodesChange?: (changes: NodeChange<CanvasNode>[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
  onConnect?: (connection: Connection) => void;
  onSelect?: (id: string) => void;
}) {
  const nodes = useMemo<CanvasNode[]>(
    () =>
      graph.nodes.map((field) => ({
        id: field.id,
        type: "workflow",
        position: { x: field.x, y: field.y },
        data: { field, current: current === field.id },
      })),
    [graph.nodes, current],
  );
  const edges = useMemo<Edge[]>(
    () =>
      graph.edges.map((e) => ({
        ...e,
        sourceHandle: e.port,
        label: portLabels[e.port],
        animated: e.source === current,
      })),
    [graph.edges, current],
  );
  return (
    <div className="workflow-canvas" dir="ltr">
      <ReactFlow<CanvasNode>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onSelect?.(node.id)}
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable={editable}
        deleteKeyCode={editable ? ["Backspace", "Delete"] : null}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        aria-label="نمودار گردش‌کار"
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
