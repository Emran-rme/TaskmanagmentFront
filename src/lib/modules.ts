export interface ModuleField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  hint: string;
}
export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  capability: string;
  fields: ModuleField[];
  events: string[] | null;
}
export interface ModuleInstallation {
  id: string;
  enabled: boolean;
  events: string[];
  values: Record<string, string>;
  secrets: Record<string, boolean>;
}
export interface ModulesResponse {
  catalog: ModuleDefinition[];
  events: { id: string; name: string }[];
  installed: ModuleInstallation[];
  deleted: { id: string; deletedAt: string; deletedBy: number }[];
  smsWorkflowEnabled: boolean;
  emailWorkflowEnabled?: boolean;
}
