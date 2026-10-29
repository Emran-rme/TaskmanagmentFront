import {
  Play,
  UsersRound,
  ClipboardList,
  ShieldCheck,
  GitBranch,
  BellRing,
  Timer,
  CircleCheck,
  Flag,
} from "lucide-react";
import type { FlowKind } from "../lib/workflows";

const icons = {
  start: Play,
  assign: UsersRound,
  work: ClipboardList,
  approval: ShieldCheck,
  condition: GitBranch,
  notify: BellRing,
  delay: Timer,
  close: CircleCheck,
  end: Flag,
};
export default function WorkflowStageIcon({
  kind,
  size = 18,
}: {
  kind: FlowKind;
  size?: number;
}) {
  const Icon = icons[kind] ?? Flag;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}
