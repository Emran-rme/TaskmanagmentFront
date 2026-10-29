export type FlowKind =
  | "start"
  | "assign"
  | "work"
  | "approval"
  | "condition"
  | "notify"
  | "delay"
  | "close"
  | "end";
export interface FlowNode {
  id: string;
  kind: FlowKind;
  label: string;
  x: number;
  y: number;
  channel: string;
  recipient: string;
  message: string;
  minutes: number;
  condition: string;
  value: string;
}
export interface FlowGraph {
  nodes: FlowNode[];
  edges: { id: string; source: string; target: string; port: string }[];
}
export interface FlowDefinition {
  id: string;
  name: string;
  company: string;
  projectId: string | null;
  version: number;
  revision: number;
  published: boolean;
  active: boolean;
  graphJson: string;
}
export interface FlowCatalog {
  enabled: boolean;
  definitions: FlowDefinition[];
  template: FlowGraph;
}
export interface TaskFlow {
  id: string;
  revision: number;
  stage: string;
  nodeId: string;
  status: string;
  dueAt: string | null;
  definitionId: string;
  version: number;
  name: string;
  graph: FlowGraph;
  enabled: boolean;
}
export const flowLabels: Record<FlowKind, string> = {
  start: "شروع",
  assign: "مسئول و ناظر تسک",
  work: "انجام و تحویل",
  approval: "تأیید / برگشت",
  condition: "شرط",
  notify: "اطلاع‌رسانی",
  delay: "انتظار",
  close: "بستن وظیفه",
  end: "پایان",
};
export const ports = (kind: FlowKind) =>
  kind === "approval"
    ? ["approve", "reject"]
    : kind === "condition"
      ? ["yes", "no"]
      : kind === "end"
        ? []
        : ["next"];
export const portLabels: Record<string, string> = {
  next: "ادامه",
  approve: "تأیید",
  reject: "برگشت",
  yes: "بله",
  no: "خیر",
};
