export interface IntegrationOptions {
  ldap: {
    enabled: boolean;
    host: string;
    port: number;
    useSsl: boolean;
    allowInsecureDevelopment: boolean;
    baseDn: string;
    bindDn: string;
    bindPassword: string;
    userAttribute: string;
  };
  email: {
    enabled: boolean;
    host: string;
    port: number;
    startTls: boolean;
    username: string;
    password: string;
    fromAddress: string;
    fromName: string;
  };
  sms: { enabled: boolean; url: string; token: string };
  contacts: { userId: number; email: string; phone: string }[];
}
export interface IntegrationResponse {
  options: IntegrationOptions;
  secrets: { ldapPassword: boolean; emailPassword: boolean; smsToken: boolean };
  users: { id: number; name: string; enabled: boolean }[];
}
