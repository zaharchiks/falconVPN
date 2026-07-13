import { VpnClient, ServerConfig } from './types';
import { generateUuid, generateShortId, generateKeyPair } from './helpers';

// List of common safe domains for Reality masking (SNI)
export const SAFE_DOMAINS = [
  'images.apple.com',
  'dl.google.com',
  'www.microsoft.com',
  'www.yahoo.com',
  'www.cloudflare.com',
  'gateway.discord.gg',
  'www.speedtest.net',
  'www.amazon.com',
];

// Generate default server config
export function getDefaultServerConfig(): ServerConfig {
  const keys = generateKeyPair();
  return {
    id: 'srv_1',
    name: 'Netherlands Main',
    ip: '194.87.214.45', // Default placeholder IP
    port: 443,
    sni: 'images.apple.com',
    shortId: generateShortId(16),
    privateKey: keys.privateKey,
    publicKey: keys.publicKey,
    spiderX: '/',
    location: 'NL',
    isActive: true,
    cpuUsage: 12,
    ramUsage: 34,
    onlineUsers: 4
  };
}

// Generate realistic initial clients
export function getInitialClients(): VpnClient[] {
  const currentDate = new Date();
  
  const date1 = new Date();
  date1.setDate(currentDate.getDate() + 30);
  
  const date2 = new Date();
  date2.setDate(currentDate.getDate() + 15);

  return [
    {
      id: '1',
      name: 'iPhone Sokolov (Основной)',
      uuid: generateUuid(),
      flow: 'xtls-r-vless',
      limitTrafficGb: 150,
      usedTrafficGb: 43.6,
      expiryDate: date1.toISOString().split('T')[0],
      isActive: true,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      planId: null,
      subscriptionToken: 'sub_tok_iphone',
      serverIds: []
    },
    {
      id: '2',
      name: 'Macbook Pro',
      uuid: generateUuid(),
      flow: 'xtls-r-vless',
      limitTrafficGb: 500,
      usedTrafficGb: 284.1,
      expiryDate: date2.toISOString().split('T')[0],
      isActive: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      planId: null,
      subscriptionToken: 'sub_tok_macbook',
      serverIds: []
    },
    {
      id: '3',
      name: 'SmartTV Home (Без Flow)',
      uuid: generateUuid(),
      flow: 'none',
      limitTrafficGb: 0, // Безлимит
      usedTrafficGb: 1045.2,
      expiryDate: 'unlimited',
      isActive: true,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      planId: null,
      subscriptionToken: 'sub_tok_tv',
      serverIds: []
    },
    {
      id: '4',
      name: 'iPad Guest (Приостановлен)',
      uuid: generateUuid(),
      flow: 'xtls-r-vless',
      limitTrafficGb: 50,
      usedTrafficGb: 12.8,
      expiryDate: 'unlimited',
      isActive: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      planId: null,
      subscriptionToken: 'sub_tok_guest',
      serverIds: []
    }
  ];
}
