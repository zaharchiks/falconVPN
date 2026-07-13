import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server-db';
import TelegramBot from 'node-telegram-bot-api';
import { generateKeyPair, generateShortId, generateUuid } from './src/helpers';

const app = express();
const PORT = 3000;

app.use(express.json());

// Active bot instance
let botInstance: TelegramBot | null = null;

// Function to start or restart the Telegram Bot dynamically
function initTelegramBot() {
  const config = db.getBotConfig();
  
  // Close existing bot if running
  if (botInstance) {
    try {
      console.log('[BOT] Stopping existing Telegram Bot instance...');
      botInstance.stopPolling();
      botInstance = null;
    } catch (e) {
      console.error('[BOT] Error stopping bot:', e);
    }
  }

  if (!config.isEnabled || !config.token || config.token.trim() === '') {
    console.log('[BOT] Telegram Bot is disabled or token is missing. Waiting for configuration...');
    return;
  }

  try {
    console.log('[BOT] Initializing Telegram Bot with token:', config.token.substring(0, 10) + '...');
    const TelegramBotClass = (typeof TelegramBot === 'function'
      ? TelegramBot
      : (TelegramBot as any).default || TelegramBot);
    botInstance = new TelegramBotClass(config.token, { polling: true });

    // Prevent process crashes due to unhandled polling or api errors
    botInstance.on('polling_error', (error) => {
      console.error('[BOT] Polling error:', error.message);
    });
    botInstance.on('error', (error) => {
      console.error('[BOT] General error:', error.message);
    });

    // Handle /start command
    botInstance.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id.toString();
      const username = msg.from?.username || null;
      
      console.log(`[BOT] /start received from chatId: ${chatId}, username: ${username}`);
      
      // Look up existing client linked to this Telegram account
      let client = db.getClientByTelegramChatId(chatId);
      if (!client && username) {
        // Try to look up by username
        const allClients = db.getClients();
        const found = allClients.find(c => c.telegramUsername && c.telegramUsername.toLowerCase() === username.toLowerCase());
        if (found) {
          client = found;
          // Associate chatId
          db.updateClient(client.id, { telegramChatId: chatId });
        }
      }

      sendMainMenu(chatId, client, username);
    });

    // Handle callback queries / interactive button clicks
    botInstance.on('message', async (msg) => {
      const chatId = msg.chat.id.toString();
      const text = msg.text;
      const username = msg.from?.username || null;

      if (!text || text.startsWith('/')) return;

      console.log(`[BOT] Message received from chatId: ${chatId}, text: ${text}`);

      let client = db.getClientByTelegramChatId(chatId);
      if (!client && username) {
        const allClients = db.getClients();
        const found = allClients.find(c => c.telegramUsername && c.telegramUsername.toLowerCase() === username.toLowerCase());
        if (found) {
          client = found;
          db.updateClient(client.id, { telegramChatId: chatId });
        }
      }

      const config = db.getBotConfig();

      if (text === '👤 Мой кабинет / My Account') {
        if (client) {
          const status = client.isActive ? '🟢 Активна / Active' : '🔴 Приостановлена / Paused';
          const traffic = client.limitTrafficGb === 0 
            ? 'Безлимит / Unlimited' 
            : `${client.usedTrafficGb.toFixed(1)} / ${client.limitTrafficGb} GB`;
          
          const exp = client.expiryDate === 'unlimited' 
            ? 'Без ограничений / Never' 
            : client.expiryDate;

          const hostUrl = process.env.APP_URL || `http://${msg.chat.username ? 'localhost:3000' : 'your-vps-ip:3000'}`;
          const subUrl = `${hostUrl}/api/sub/${client.subscriptionToken}`;

          const message = `👤 *Ваш личный кабинет:*\n\n` +
            `▫️ *Имя:* ${client.name}\n` +
            `▫️ *Статус:* ${status}\n` +
            `▫️ *Трафик:* ${traffic}\n` +
            `▫️ *Истекает:* ${exp}\n\n` +
            `🔗 *Ваша универсальная ссылка подписки (вставьте её в Hiddify, Shadowrocket, v2rayNG или Nekobox):*\n` +
            `\`${subUrl}\`\n\n` +
            `💡 _Эта ссылка объединяет все активные сервера. При добавлении новых локаций админом, они появятся у вас автоматически!_`;
          
          botInstance?.sendMessage(chatId, message, { 
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📱 Показать QR-код / Show QR Code', callback_data: `qr_${client.subscriptionToken}` }]
              ]
            }
          });
        } else {
          botInstance?.sendMessage(chatId, `❌ *Кабинет не найден*\n\nУ вас пока нет активных подключений. Выберите *💳 Купить подписку*, чтобы создать профиль!`, { parse_mode: 'Markdown' });
        }
      } 
      else if (text === '💳 Купить подписку / Buy Subscription') {
        const plans = db.getPlans();
        if (plans.length === 0) {
          botInstance?.sendMessage(chatId, '😔 К сожалению, сейчас нет доступных тарифных планов.');
          return;
        }

        const buttons = plans.map(p => ([{
          text: `🎁 ${p.name} — ${p.priceRub} ₽`,
          callback_data: `plan_${p.id}`
        }]));

        botInstance?.sendMessage(chatId, '🛒 *Выберите тарифный план для покупки:*', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: buttons
          }
        });
      } 
      else if (text === '🌐 Наши локации / Server Locations') {
        const servers = db.getServers().filter(s => s.isActive);
        if (servers.length === 0) {
          botInstance?.sendMessage(chatId, '🌍 В данный момент все наши сервера находятся на техобслуживании.');
          return;
        }

        const serverList = servers.map((s, i) => `${i + 1}. 📍 *${s.name}* [${s.location}] — Reality VLESS`).join('\n');
        botInstance?.sendMessage(chatId, `🌍 *Доступные локации VPN:*\n\n${serverList}\n\n💡 _Все эти локации будут доступны вам по одной единой ссылке подписки!_`, { parse_mode: 'Markdown' });
      } 
      else if (text === '💡 Инструкция / Help & Setup') {
        const message = `💡 *Инструкция по настройке:*\n\n` +
          `1️⃣ Скачайте подходящее приложение на устройство:\n` +
          `▫️ *iOS:* Hiddify, Shadowrocket, Sing-box\n` +
          `▫️ *Android:* Hiddify, v2rayNG, Nekobox\n` +
          `▫️ *Windows / MacOS:* Hiddify, sing-box, Nekoray\n\n` +
          `2️⃣ Перейдите в *👤 Мой кабинет* и скопируйте универсальную ссылку.\n\n` +
          `3️⃣ В приложении Hiddify нажмите *"+ Новый профиль"* ➡️ *"Добавить из буфера обмена"*. Приложение автоматически скачает все локации!\n\n` +
          `4️⃣ Включите соединение и наслаждайтесь свободным интернетом!`;
        
        botInstance?.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
    });

    // Handle Inline buttons
    botInstance.on('callback_query', async (query) => {
      const chatId = query.message?.chat.id.toString();
      const data = query.data;
      const username = query.from?.username || null;

      if (!chatId || !data) return;

      console.log(`[BOT] Callback query received: ${data}`);

      // Answer callback query immediately to stop loading spinner
      botInstance?.answerCallbackQuery(query.id);

      if (data.startsWith('qr_')) {
        const token = data.replace('qr_', '');
        const client = db.getClientByToken(token);
        if (client) {
          const hostUrl = process.env.APP_URL || `http://your-vps-ip:3000`;
          const subUrl = `${hostUrl}/api/sub/${client.subscriptionToken}`;
          const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(subUrl)}`;
          
          botInstance?.sendPhoto(chatId, qrApiUrl, {
            caption: `📲 Отсканируйте этот QR-код в приложении VPN (например, Hiddify) для мгновенного импорта подписки!`,
          });
        }
      } 
      else if (data.startsWith('plan_')) {
        const planId = data.replace('plan_', '');
        const plan = db.getPlans().find(p => p.id === planId);
        const config = db.getBotConfig();

        if (plan) {
          const message = `📋 *Вы выбрали тариф: ${plan.name}*\n` +
            `▫️ *Стоимость:* ${plan.priceRub} ₽\n` +
            `▫️ *Лимит трафика:* ${plan.limitTrafficGb === 0 ? 'Безлимит' : plan.limitTrafficGb + ' GB'}\n` +
            `▫️ *Описание:* ${plan.description}\n\n` +
            `${config.paymentDetails}`;

          botInstance?.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: 'Я оплатил ✅ / I paid', callback_data: `paid_${plan.id}` },
                  { text: 'Отмена ❌ / Cancel', callback_data: 'cancel_buy' }
                ]
              ]
            }
          });
        }
      } 
      else if (data.startsWith('paid_')) {
        const planId = data.replace('paid_', '');
        const plan = db.getPlans().find(p => p.id === planId);

        if (plan) {
          // Look up existing client or create a temporary inactive user linked to this Telegram
          let client = db.getClientByTelegramChatId(chatId);
          if (!client && username) {
            const allClients = db.getClients();
            client = allClients.find(c => c.telegramUsername && c.telegramUsername.toLowerCase() === username.toLowerCase()) || null;
          }

          if (!client) {
            // Create a new inactive client
            const displayName = username ? `@${username}` : `TG User ${chatId.substring(0, 5)}`;
            client = db.addClient({
              name: displayName,
              uuid: generateUuid(),
              flow: 'xtls-r-vless',
              limitTrafficGb: plan.limitTrafficGb,
              expiryDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              isActive: false, // Inactive until approved
              planId: plan.id,
              telegramUsername: username,
              telegramChatId: chatId,
              serverIds: []
            });
          } else {
            // Link existing client's chatId and update plan selection
            db.updateClient(client.id, {
              telegramChatId: chatId,
              telegramUsername: username
            });
          }

          // Create a pending payment log for admin review!
          db.addPayment({
            clientId: client.id,
            clientName: client.name,
            planId: plan.id,
            planName: plan.name,
            amount: plan.priceRub,
            telegramUsername: username || undefined
          });

          const successMsg = `⏳ *Заявка отправлена на проверку!*\n\n` +
            `Мы зарегистрировали ваш платеж за подписку *"${plan.name}"* на сумму *${plan.priceRub} ₽*.\n\n` +
            `Администратор подтвердит платеж в ближайшее время. Как только это произойдет, *бот мгновенно пришлет вам универсальный ключ для включения VPN!* Спасибо за доверие! ❤️`;

          botInstance?.sendMessage(chatId, successMsg, { parse_mode: 'Markdown' });
        }
      } 
      else if (data === 'cancel_buy') {
        botInstance?.sendMessage(chatId, '❌ Покупка отменена. Вы всегда можете вернуться в меню.');
      }
    });

    console.log('[BOT] Telegram Bot successfully started and polling.');
  } catch (err) {
    console.error('[BOT] Fatal error starting Telegram Bot:', err);
  }
}

function sendMainMenu(chatId: string, client: any, username: string | null) {
  const greeting = username ? `Привет, @${username}! ` : `Приветствую! `;
  const text = `${greeting}\n\n` +
    `Я официальный бот-помощник для подключения к твоему сверхбыстрому VPN VLESS Reality.\n\n` +
    `🔑 С моей помощью ты можешь купить подписку, получить ссылки конфигурации, настроить Hiddify app на телефоне/компьютере или продлить текущий пакет.`;

  botInstance?.sendMessage(chatId, text, {
    reply_markup: {
      keyboard: [
        [{ text: '👤 Мой кабинет / My Account' }, { text: '💳 Купить подписку / Buy Subscription' }],
        [{ text: '🌐 Наши локации / Server Locations' }, { text: '💡 Инструкция / Help & Setup' }]
      ],
      resize_keyboard: true
    }
  });
}

// Start Telegram Bot on launch!
initTelegramBot();

// --- API ENDPOINTS ---

// Session token for admin panel (changes on server restart for high security)
let currentAdminToken = generateShortId(24);

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || db.getAdminPassword() || 'admin';
}

// Global Auth Middleware for admin APIs
app.use((req, res, next) => {
  // Only protect API routes
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // Pass public endpoints
  if (req.path.startsWith('/api/sub/')) {
    return next();
  }
  if (req.path === '/api/login') {
    return next();
  }

  // Verify token
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader === currentAdminToken) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
});

// Admin Authentication endpoint
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === getAdminPassword()) {
    return res.json({ success: true, token: currentAdminToken });
  }
  return res.status(401).json({ error: 'Incorrect password' });
});

// Admin change-password endpoint
app.post('/api/admin/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const activePassword = getAdminPassword();
  if (currentPassword !== activePassword) {
    return res.status(400).json({ error: 'Incorrect current password' });
  }
  if (!newPassword || newPassword.trim() === '') {
    return res.status(400).json({ error: 'New password cannot be empty' });
  }
  db.updateAdminPassword(newPassword);
  return res.json({ success: true });
});

// Server API
app.get('/api/servers', (req, res) => {
  res.json(db.getServers());
});

app.post('/api/servers', (req, res) => {
  const newServer = db.addServer(req.body);
  res.status(201).json(newServer);
});

app.put('/api/servers/:id', (req, res) => {
  const updated = db.updateServer(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Server not found' });
  res.json(updated);
});

app.delete('/api/servers/:id', (req, res) => {
  const success = db.deleteServer(req.params.id);
  if (!success) return res.status(404).json({ error: 'Server not found' });
  res.json({ success: true });
});

// Plans API
app.get('/api/plans', (req, res) => {
  res.json(db.getPlans());
});

app.post('/api/plans', (req, res) => {
  const newPlan = db.addPlan(req.body);
  res.status(201).json(newPlan);
});

app.put('/api/plans/:id', (req, res) => {
  const updated = db.updatePlan(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Plan not found' });
  res.json(updated);
});

app.delete('/api/plans/:id', (req, res) => {
  const success = db.deletePlan(req.params.id);
  if (!success) return res.status(404).json({ error: 'Plan not found' });
  res.json({ success: true });
});

// Clients API
app.get('/api/clients', (req, res) => {
  res.json(db.getClients());
});

app.post('/api/clients', (req, res) => {
  const newClient = db.addClient(req.body);
  res.status(201).json(newClient);
});

app.put('/api/clients/:id', (req, res) => {
  const updated = db.updateClient(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Client not found' });
  res.json(updated);
});

app.delete('/api/clients/:id', (req, res) => {
  const success = db.deleteClient(req.params.id);
  if (!success) return res.status(404).json({ error: 'Client not found' });
  res.json({ success: true });
});

// Bot Config API
app.get('/api/bot-config', (req, res) => {
  res.json(db.getBotConfig());
});

app.put('/api/bot-config', (req, res) => {
  const updated = db.updateBotConfig(req.body);
  // Reinitialize bot with new token/configuration dynamically!
  initTelegramBot();
  res.json(updated);
});

// Payments API
app.get('/api/payments', (req, res) => {
  res.json(db.getPayments());
});

app.post('/api/payments/:id/approve', (req, res) => {
  const paymentId = req.params.id;
  const pay = db.getPayments().find(p => p.id === paymentId);
  
  if (!pay) return res.status(404).json({ error: 'Payment not found' });
  
  const success = db.approvePayment(paymentId);
  if (!success) return res.status(500).json({ error: 'Failed to approve payment' });

  // Dynamically push a congratulatory Telegram message directly to the buyer's Bot chat!
  const client = db.getClients().find(c => c.id === pay.clientId);
  if (client && client.telegramChatId && botInstance) {
    try {
      const hostUrl = process.env.APP_URL || `http://your-vps-ip:3000`;
      const subUrl = `${hostUrl}/api/sub/${client.subscriptionToken}`;
      
      const text = `🎉 *Оплата подтверждена! Ваша подписка активирована!*\n\n` +
        `📦 *Тариф:* ${pay.planName}\n` +
        `📅 *Истекает:* ${client.expiryDate === 'unlimited' ? 'Никогда' : client.expiryDate}\n\n` +
        `🔗 *Ваша универсальная ссылка подписки для импорта (нажмите для копирования):*\n` +
        `\`${subUrl}\`\n\n` +
        `🚀 _Скопируйте эту ссылку и вставьте в Hiddify app или другое VPN приложение. Приятного пользования!_`;
      
      botInstance.sendMessage(client.telegramChatId, text, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[BOT] Error pushing approval message:', err);
    }
  }

  res.json({ success: true });
});

app.post('/api/payments/:id/reject', (req, res) => {
  const paymentId = req.params.id;
  const pay = db.getPayments().find(p => p.id === paymentId);
  
  if (!pay) return res.status(404).json({ error: 'Payment not found' });
  
  const success = db.rejectPayment(paymentId);
  if (!success) return res.status(500).json({ error: 'Failed to reject payment' });

  const client = db.getClients().find(c => c.id === pay.clientId);
  if (client && client.telegramChatId && botInstance) {
    try {
      const text = `❌ *Ваш платеж на сумму ${pay.amount} ₽ отклонен модератором.*\n\n` +
        `Пожалуйста, перепроверьте правильность перевода или свяжитесь с поддержкой. Вы можете заново заказать подписку через меню.`;
      botInstance.sendMessage(client.telegramChatId, text, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[BOT] Error pushing rejection message:', err);
    }
  }

  res.json({ success: true });
});

// MULTI-SERVER SUBSCRIPTION ENDPOINT FOR "happ" / HIDDIFY
app.get('/api/sub/:token', (req, res) => {
  const token = req.params.token;
  const client = db.getClientByToken(token);
  
  if (!client) {
    return res.status(404).send('Subscription not found');
  }
  
  if (!client.isActive) {
    return res.status(403).send('Subscription is suspended, expired or traffic limit exceeded');
  }

  // Get active servers that this client is allowed to connect to
  const activeServers = db.getServers().filter(srv => {
    if (!srv.isActive) return false;
    // If client has specific server IDs, filter by that. Otherwise allow all.
    if (client.serverIds && client.serverIds.length > 0) {
      return client.serverIds.includes(srv.id);
    }
    return true;
  });

  if (activeServers.length === 0) {
    return res.status(404).send('No active servers found for this subscription');
  }

  // Generate newline separated VLESS URLs
  const vlessLinks = activeServers.map(srv => {
    const uuid = encodeURIComponent(client.uuid);
    const sni = encodeURIComponent(srv.sni);
    const pbk = encodeURIComponent(srv.publicKey);
    const sid = encodeURIComponent(srv.shortId);
    const flowStr = client.flow === 'xtls-r-vless' ? '&flow=xtls-r-vless' : '';
    // Formulate descriptive link name
    const linkName = encodeURIComponent(`${client.name} | 📍 ${srv.name}`);
    
    return `vless://${uuid}@${srv.ip}:${srv.port}?security=reality&sni=${sni}&fp=chrome&pbk=${pbk}&sid=${sid}&type=tcp${flowStr}#${linkName}`;
  });

  // Dynamic config: standard base64 encoding or raw lines (Hiddify/Nekobox/Shadowrocket read both!)
  // Base64 encoding is 100% standard for all v2ray/clash subscription handlers
  const subscriptionText = vlessLinks.join('\n');
  const base64Subscription = Buffer.from(subscriptionText).toString('base64');
  
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  // Return Base64 subscription
  res.send(base64Subscription);
});

// Periodic subscription quota checker (hourly)
setInterval(() => {
  console.log('[CRON] Running automatic subscription checks...');
  const result = db.checkSubscriptions();
  if (result.disabledClients.length > 0) {
    console.log(`[CRON] Disabled ${result.disabledClients.length} expired or overlimit clients:`, result.disabledClients);
  }
}, 60 * 60 * 1000);

// --- STATIC FILES / VITE SERVING ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Multi-Server VLESS Reality Admin Panel running at http://localhost:${PORT}`);
  });
}

startServer();
