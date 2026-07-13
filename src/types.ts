export interface VpnServer {
  id: string;
  name: string;
  ip: string;
  port: number;
  sni: string;
  shortId: string;
  publicKey: string;
  privateKey: string;
  spiderX: string;
  location: string; // e.g. "NL", "DE", "TR", "FI"
  isActive: boolean;
  cpuUsage: number;
  ramUsage: number;
  onlineUsers: number;
}

export type ServerConfig = VpnServer;

export interface SubscriptionPlan {
  id: string;
  name: string;
  durationDays: number;
  limitTrafficGb: number; // 0 means unlimited
  priceRub: number;
  description: string;
}

export interface VpnClient {
  id: string;
  name: string;
  uuid: string;
  flow: 'none' | 'xtls-r-vless';
  limitTrafficGb: number; // 0 means unlimited
  usedTrafficGb: number;
  expiryDate: string; // "unlimited" or YYYY-MM-DD
  isActive: boolean;
  createdAt: string;
  planId: string | null;
  subscriptionToken: string; // Unique secret token for single subscription URL
  telegramUsername?: string | null;
  telegramChatId?: string | null;
  serverIds?: string[]; // Server IDs this client has access to. If undefined/empty, has access to all active servers
}

export interface BotConfig {
  token: string;
  welcomeMessageRu: string;
  welcomeMessageEn: string;
  paymentDetails: string;
  isEnabled: boolean;
}

export interface DatabaseSchema {
  servers: VpnServer[];
  plans: SubscriptionPlan[];
  clients: VpnClient[];
  botConfig: BotConfig;
  adminPassword?: string;
  payments: Array<{
    id: string;
    clientId: string;
    clientName: string;
    planId: string;
    planName: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    telegramUsername?: string;
  }>;
}
