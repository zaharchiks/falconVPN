import fs from 'fs';
import path from 'path';
import { DatabaseSchema, VpnServer, SubscriptionPlan, VpnClient, BotConfig } from './src/types';

const DB_FILE = path.join(process.cwd(), 'db.json');

// Helper to generate random keys and tokens
function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 7);
}

function generateToken(length: number = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Basic Curve25519 placeholder key generator
function generateKeyPair(): { publicKey: string; privateKey: string } {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const genKey = (len: number) => {
    let key = '';
    for (let i = 0; i < len; i++) {
      key += chars[Math.floor(Math.random() * chars.length)];
    }
    return key;
  };
  return {
    privateKey: genKey(43) + '=',
    publicKey: genKey(43) + '='
  };
}

// Initial default database state
const defaultDatabase: DatabaseSchema = {
  servers: [
    {
      id: 'srv-1',
      name: 'Amsterdam Main',
      ip: '194.87.214.45',
      port: 443,
      sni: 'images.apple.com',
      shortId: '7a5f6e3c2b1a0f9e',
      publicKey: generateKeyPair().publicKey,
      privateKey: generateKeyPair().privateKey,
      spiderX: '/',
      location: 'NL',
      isActive: true,
      cpuUsage: 14,
      ramUsage: 35,
      onlineUsers: 3
    },
    {
      id: 'srv-2',
      name: 'Frankfurt Highspeed',
      ip: '185.22.174.92',
      port: 8443,
      sni: 'dl.google.com',
      shortId: '4d8e9f2a1b7c3e5d',
      publicKey: generateKeyPair().publicKey,
      privateKey: generateKeyPair().privateKey,
      spiderX: '/',
      location: 'DE',
      isActive: true,
      cpuUsage: 8,
      ramUsage: 22,
      onlineUsers: 1
    },
    {
      id: 'srv-3',
      name: 'Helsinki Safe',
      ip: '95.175.99.112',
      port: 443,
      sni: 'www.microsoft.com',
      shortId: '9e8d7c6b5a4f3e2d',
      publicKey: generateKeyPair().publicKey,
      privateKey: generateKeyPair().privateKey,
      spiderX: '/',
      location: 'FI',
      isActive: false,
      cpuUsage: 0,
      ramUsage: 0,
      onlineUsers: 0
    }
  ],
  plans: [
    {
      id: 'plan-lite',
      name: 'Lite — 30 дней',
      durationDays: 30,
      limitTrafficGb: 50,
      priceRub: 150,
      description: 'Отлично для мессенджеров и веб-серфинга. 50 ГБ трафика.'
    },
    {
      id: 'plan-standard',
      name: 'Standard — 30 дней',
      durationDays: 30,
      limitTrafficGb: 150,
      priceRub: 300,
      description: 'Оптимальный выбор для повседневного использования. 150 ГБ.'
    },
    {
      id: 'plan-pro',
      name: 'Pro — 90 дней',
      durationDays: 90,
      limitTrafficGb: 500,
      priceRub: 750,
      description: 'Выгодный пакет на 3 месяца. 500 ГБ скоростного трафика.'
    },
    {
      id: 'plan-unlimited',
      name: 'Безлимит — 30 дней',
      durationDays: 30,
      limitTrafficGb: 0,
      priceRub: 500,
      description: 'Абсолютная свобода без ограничений по трафику на высокой скорости.'
    }
  ],
  clients: [
    {
      id: 'cli-1',
      name: 'iPhone Sokolov (Основной)',
      uuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      flow: 'xtls-r-vless',
      limitTrafficGb: 150,
      usedTrafficGb: 43.6,
      expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      planId: 'plan-standard',
      subscriptionToken: 'sub_sokolov123',
      telegramUsername: 'sokolov_dev',
      telegramChatId: '12345678'
    },
    {
      id: 'cli-2',
      name: 'Macbook Pro',
      uuid: '2fa56bc1-7c9d-482a-ba5e-88ff221c43ab',
      flow: 'xtls-r-vless',
      limitTrafficGb: 500,
      usedTrafficGb: 284.1,
      expiryDate: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      planId: 'plan-pro',
      subscriptionToken: 'sub_macbookpro',
      telegramUsername: null,
      telegramChatId: null
    },
    {
      id: 'cli-3',
      name: 'SmartTV Home',
      uuid: 'f8c3e21a-d421-49fa-94ea-52fbc9449830',
      flow: 'none',
      limitTrafficGb: 0,
      usedTrafficGb: 1045.2,
      expiryDate: 'unlimited',
      isActive: true,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      planId: 'plan-unlimited',
      subscriptionToken: 'sub_smarttvunl',
      telegramUsername: null,
      telegramChatId: null
    }
  ],
  botConfig: {
    token: '', // Placeholder. To be entered by user in the admin UI
    welcomeMessageRu: '👋 Добро пожаловать в бот безопасного VPN!\n\nЗдесь вы можете приобрести быструю и полностью защищенную подписку VLESS Reality, управлять своими подключениями и продлевать доступ в одно нажатие.',
    welcomeMessageEn: '👋 Welcome to our Secure VPN Bot!\n\nHere you can buy high-speed and secure VLESS Reality subscriptions, manage your connections, and renew your access with a single click.',
    paymentDetails: '💳 Переведите оплату на карту Сбербанк / Т-Банк:\n\n`4276 5500 1234 5678` (Иван С.)\n\nПосле перевода отправьте чек или нажмите кнопку "Я оплатил ✅"',
    isEnabled: true
  },
  payments: [
    {
      id: 'pay-1',
      clientId: 'cli-1',
      clientName: 'iPhone Sokolov (Основной)',
      planId: 'plan-standard',
      planName: 'Standard — 30 дней',
      amount: 300,
      status: 'approved',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      telegramUsername: 'sokolov_dev'
    },
    {
      id: 'pay-2',
      clientId: 'cli-2',
      clientName: 'Macbook Pro',
      planId: 'plan-pro',
      planName: 'Pro — 90 дней',
      amount: 750,
      status: 'approved',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      telegramUsername: undefined
    }
  ],
  adminPassword: 'admin'
};

class DatabaseManager {
  private cache: DatabaseSchema | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultDatabase, null, 2), 'utf-8');
        this.cache = JSON.parse(JSON.stringify(defaultDatabase));
        console.log('[DB] Database file created with defaults.');
      } else {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.cache = JSON.parse(raw);
        console.log('[DB] Database loaded successfully from file.');
        
        // Safety check to ensure all tables exist in cache
        let updated = false;
        if (!this.cache!.servers) { this.cache!.servers = []; updated = true; }
        if (!this.cache!.plans) { this.cache!.plans = []; updated = true; }
        if (!this.cache!.clients) { this.cache!.clients = []; updated = true; }
        if (!this.cache!.botConfig) { this.cache!.botConfig = defaultDatabase.botConfig; updated = true; }
        if (!this.cache!.payments) { this.cache!.payments = []; updated = true; }
        if (!this.cache!.adminPassword) { this.cache!.adminPassword = 'admin'; updated = true; }
        
        if (updated) {
          this.save();
        }
      }
    } catch (err) {
      console.error('[DB] Error initializing database, falling back to memory cache:', err);
      this.cache = JSON.parse(JSON.stringify(defaultDatabase));
    }
  }

  private save() {
    if (!this.cache) return;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.cache, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error saving database file:', err);
    }
  }

  getSchema(): DatabaseSchema {
    if (!this.cache) this.init();
    return this.cache!;
  }

  // Servers
  getServers(): VpnServer[] {
    return this.getSchema().servers;
  }

  addServer(server: Omit<VpnServer, 'id' | 'cpuUsage' | 'ramUsage' | 'onlineUsers'>): VpnServer {
    const keys = generateKeyPair();
    const newServer: VpnServer = {
      ...server,
      id: 'srv-' + generateToken(6),
      cpuUsage: Math.floor(Math.random() * 15) + 3,
      ramUsage: Math.floor(Math.random() * 20) + 15,
      onlineUsers: 0,
      publicKey: server.publicKey || keys.publicKey,
      privateKey: server.privateKey || keys.privateKey,
      shortId: server.shortId || generateToken(16)
    };
    this.getSchema().servers.push(newServer);
    this.save();
    return newServer;
  }

  updateServer(id: string, server: Partial<VpnServer>): VpnServer | null {
    const srv = this.getSchema().servers.find(s => s.id === id);
    if (!srv) return null;
    Object.assign(srv, server);
    this.save();
    return srv;
  }

  deleteServer(id: string): boolean {
    const initialLen = this.getSchema().servers.length;
    this.getSchema().servers = this.getSchema().servers.filter(s => s.id !== id);
    const success = this.getSchema().servers.length < initialLen;
    if (success) this.save();
    return success;
  }

  // Plans
  getPlans(): SubscriptionPlan[] {
    return this.getSchema().plans;
  }

  addPlan(plan: Omit<SubscriptionPlan, 'id'>): SubscriptionPlan {
    const newPlan: SubscriptionPlan = {
      ...plan,
      id: 'plan-' + generateToken(6)
    };
    this.getSchema().plans.push(newPlan);
    this.save();
    return newPlan;
  }

  updatePlan(id: string, plan: Partial<SubscriptionPlan>): SubscriptionPlan | null {
    const pl = this.getSchema().plans.find(p => p.id === id);
    if (!pl) return null;
    Object.assign(pl, plan);
    this.save();
    return pl;
  }

  deletePlan(id: string): boolean {
    const initialLen = this.getSchema().plans.length;
    this.getSchema().plans = this.getSchema().plans.filter(p => p.id !== id);
    const success = this.getSchema().plans.length < initialLen;
    if (success) this.save();
    return success;
  }

  // Clients
  getClients(): VpnClient[] {
    return this.getSchema().clients;
  }

  getClientByToken(token: string): VpnClient | null {
    return this.getSchema().clients.find(c => c.subscriptionToken === token) || null;
  }

  getClientByTelegramChatId(chatId: string): VpnClient | null {
    return this.getSchema().clients.find(c => c.telegramChatId === chatId.toString()) || null;
  }

  addClient(client: Omit<VpnClient, 'id' | 'subscriptionToken' | 'usedTrafficGb' | 'createdAt'>): VpnClient {
    const newClient: VpnClient = {
      ...client,
      id: 'cli-' + generateToken(6),
      subscriptionToken: 'sub_' + generateToken(12),
      usedTrafficGb: 0,
      createdAt: new Date().toISOString()
    };
    this.getSchema().clients.push(newClient);
    this.save();
    return newClient;
  }

  updateClient(id: string, client: Partial<VpnClient>): VpnClient | null {
    const cli = this.getSchema().clients.find(c => c.id === id);
    if (!cli) return null;
    Object.assign(cli, client);
    this.save();
    return cli;
  }

  deleteClient(id: string): boolean {
    const initialLen = this.getSchema().clients.length;
    this.getSchema().clients = this.getSchema().clients.filter(c => c.id !== id);
    const success = this.getSchema().clients.length < initialLen;
    if (success) this.save();
    return success;
  }

  // Bot Config
  getBotConfig(): BotConfig {
    return this.getSchema().botConfig;
  }

  updateBotConfig(config: Partial<BotConfig>): BotConfig {
    Object.assign(this.getSchema().botConfig, config);
    this.save();
    return this.getSchema().botConfig;
  }

  // Payments
  getPayments() {
    return this.getSchema().payments;
  }

  addPayment(payment: {
    clientId: string;
    clientName: string;
    planId: string;
    planName: string;
    amount: number;
    telegramUsername?: string;
  }) {
    const newPay = {
      id: 'pay-' + generateToken(6),
      ...payment,
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    };
    this.getSchema().payments.push(newPay);
    this.save();
    return newPay;
  }

  approvePayment(paymentId: string): boolean {
    const pay = this.getSchema().payments.find(p => p.id === paymentId);
    if (!pay) return false;
    
    pay.status = 'approved';
    
    // Find the associated client and activate / extend their subscription!
    const client = this.getSchema().clients.find(c => c.id === pay.clientId);
    const plan = this.getSchema().plans.find(p => p.id === pay.planId);
    
    if (client && plan) {
      client.isActive = true;
      client.planId = plan.id;
      client.limitTrafficGb = plan.limitTrafficGb;
      
      // Calculate new expiry date
      const days = plan.durationDays;
      const currentExpiry = client.expiryDate && client.expiryDate !== 'unlimited' ? new Date(client.expiryDate) : new Date();
      // If client is currently expired, start from today
      const startDate = (currentExpiry.getTime() < Date.now()) ? new Date() : currentExpiry;
      startDate.setDate(startDate.getDate() + days);
      
      client.expiryDate = startDate.toISOString().split('T')[0];
    }
    
    this.save();
    return true;
  }

  rejectPayment(paymentId: string): boolean {
    const pay = this.getSchema().payments.find(p => p.id === paymentId);
    if (!pay) return false;
    pay.status = 'rejected';
    this.save();
    return true;
  }

  // Automatic subscription checker (Auto-disable expired or overlimit users)
  checkSubscriptions(): { disabledClients: string[] } {
    const disabledClients: string[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    
    this.getSchema().clients.forEach(client => {
      if (!client.isActive) return;
      
      let shouldDisable = false;
      
      // 1. Check expiration date
      if (client.expiryDate !== 'unlimited' && client.expiryDate < todayStr) {
        shouldDisable = true;
        console.log(`[SUBSCRIPTION] Disabling client ${client.name} due to expiration (${client.expiryDate})`);
      }
      
      // 2. Check traffic limit
      if (client.limitTrafficGb > 0 && client.usedTrafficGb >= client.limitTrafficGb) {
        shouldDisable = true;
        console.log(`[SUBSCRIPTION] Disabling client ${client.name} due to traffic limit exceeded (${client.usedTrafficGb} / ${client.limitTrafficGb} GB)`);
      }
      
      if (shouldDisable) {
        client.isActive = false;
        disabledClients.push(client.name);
      }
    });
    
    if (disabledClients.length > 0) {
      this.save();
    }
    
    return { disabledClients };
  }

  getAdminPassword(): string {
    return this.getSchema().adminPassword || 'admin';
  }

  updateAdminPassword(password: string): boolean {
    this.getSchema().adminPassword = password;
    this.save();
    return true;
  }
}

export const db = new DatabaseManager();
