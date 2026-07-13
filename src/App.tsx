import React, { useState, useEffect } from 'react';
import { 
  Shield, Activity, Globe, Sparkles, Users, Wifi, 
  Search, UserPlus, FileText, ChevronRight, AlertCircle, 
  Copy, Check, QrCode, CreditCard, Send, X, Layers, 
  Server, ShieldAlert, Terminal, Settings, Power, RefreshCw,
  Lock, LogOut
} from 'lucide-react';
import { VpnClient, VpnServer, SubscriptionPlan, BotConfig } from './types';
import { generateUuid, generateShortId, generateVlessLink, generateClientSingBoxConfig } from './helpers';
import { QrCodeView } from './components/QrCodeView';
import { ServersTab } from './components/ServersTab';
import { PlansTab } from './components/PlansTab';
import { PaymentsTab } from './components/PaymentsTab';
import { BotTab } from './components/BotTab';
import { DeployTab } from './components/DeployTab';

export default function App() {
  const [lang, setLang] = useState<'RU' | 'EN'>('RU');
  const [activeTab, setActiveTab] = useState<'clients' | 'servers' | 'plans' | 'payments' | 'bot' | 'deploy'>('clients');
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('admin_token');
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Data State
  const [clients, setClients] = useState<VpnClient[]>([]);
  const [servers, setServers] = useState<VpnServer[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [botConfig, setBotConfig] = useState<BotConfig>({
    token: '',
    welcomeMessageRu: '',
    welcomeMessageEn: '',
    paymentDetails: '',
    isEnabled: false
  });

  const [loading, setLoading] = useState(true);
  const [generalAlert, setGeneralAlert] = useState<{ message: string; type: string } | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Modal control
  const [modalType, setModalType] = useState<'add' | 'edit' | 'configs' | null>(null);
  const [selectedClient, setSelectedClient] = useState<VpnClient | null>(null);

  // Form State for Clients
  const [formName, setFormName] = useState('');
  const [formUuid, setFormUuid] = useState('');
  const [formFlow, setFormFlow] = useState<'none' | 'xtls-r-vless'>('none');
  const [formIsUnlimitedTraffic, setFormIsUnlimitedTraffic] = useState(false);
  const [formLimitTraffic, setFormLimitTraffic] = useState(150);
  const [formIsUnlimitedExpiry, setFormIsUnlimitedExpiry] = useState(false);
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formPlanId, setFormPlanId] = useState<string>('');
  const [formTelegramUsername, setFormTelegramUsername] = useState('');
  const [formSelectedServers, setFormSelectedServers] = useState<string[]>([]);

  // Config View Tab
  const [activeConfigTab, setActiveConfigTab] = useState<'sub' | 'vless' | 'singbox'>('sub');
  const [selectedServerIdForConfig, setSelectedServerIdForConfig] = useState<string>('');

  const showToast = (message: string, type: string = 'success') => {
    setGeneralAlert({ message, type });
    setTimeout(() => setGeneralAlert(null), 3000);
  };

  // Authenticated fetch wrapper that automatically attaches the token and checks for 401s
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('admin_token') || '';
    const headers = {
      ...options.headers,
      'Authorization': token,
    };
    
    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      setIsAuthenticated(false);
      throw new Error('Unauthorized');
    }
    
    return res;
  };

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPassword.trim()) {
      setLoginError(lang === 'RU' ? 'Введите пароль' : 'Please enter password');
      return;
    }

    try {
      setIsLoggingIn(true);
      setLoginError('');
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword })
      });

      const data = await res.json();
      if (res.ok && data.success && data.token) {
        localStorage.setItem('admin_token', data.token);
        setIsAuthenticated(true);
        setLoginPassword('');
        setLoading(true);
        // Will trigger loadAllData inside useEffect or immediately
      } else {
        setLoginError(lang === 'RU' ? 'Неверный пароль администратора!' : 'Invalid admin password!');
      }
    } catch (err) {
      console.error(err);
      setLoginError(lang === 'RU' ? 'Ошибка связи с сервером' : 'Server connection error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Change Password from settings tab
  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const res = await authFetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (res.ok) {
        showToast(lang === 'RU' ? 'Пароль администратора успешно изменен!' : 'Admin password updated successfully!');
      } else {
        const errData = await res.json();
        showToast(errData.error || (lang === 'RU' ? 'Ошибка смены пароля' : 'Error updating password'), 'error');
        throw new Error(errData.error);
      }
    } catch (err: any) {
      if (err.message !== 'Unauthorized') {
        showToast(err.message || (lang === 'RU' ? 'Ошибка сети' : 'Network error'), 'error');
      }
      throw err;
    }
  };

  // Fetch all backend data
  const loadAllData = async () => {
    if (!localStorage.getItem('admin_token')) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    try {
      const [resClients, resServers, resPlans, resPayments, resBot] = await Promise.all([
        authFetch('/api/clients').then(r => r.json()),
        authFetch('/api/servers').then(r => r.json()),
        authFetch('/api/plans').then(r => r.json()),
        authFetch('/api/payments').then(r => r.json()),
        authFetch('/api/bot-config').then(r => r.json()),
      ]);
      setClients(resClients);
      setServers(resServers);
      setPlans(resPlans);
      setPayments(resPayments);
      setBotConfig(resBot);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
      const timer = setInterval(loadAllData, 8000); // refresh statistics and logs every 8s
      return () => clearInterval(timer);
    }
  }, [isAuthenticated]);

  // --- CLIENT OPERATIONS ---

  const handleOpenAddClient = () => {
    setSelectedClient(null);
    setFormName('');
    setFormUuid(generateUuid());
    setFormFlow('none');
    setFormIsUnlimitedTraffic(false);
    setFormLimitTraffic(100);
    setFormIsUnlimitedExpiry(false);
    
    // Default expiration is 30 days from now
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    setFormExpiryDate(nextMonth.toISOString().split('T')[0]);
    setFormPlanId('');
    setFormTelegramUsername('');
    setFormSelectedServers([]);
    setModalType('add');
  };

  const handleOpenEditClient = (client: VpnClient) => {
    setSelectedClient(client);
    setFormName(client.name);
    setFormUuid(client.uuid);
    setFormFlow(client.flow);
    setFormIsUnlimitedTraffic(client.limitTrafficGb === 0);
    setFormLimitTraffic(client.limitTrafficGb || 100);
    setFormIsUnlimitedExpiry(client.expiryDate === 'unlimited');
    setFormExpiryDate(client.expiryDate === 'unlimited' ? '' : client.expiryDate);
    setFormPlanId(client.planId || '');
    setFormTelegramUsername(client.telegramUsername || '');
    setFormSelectedServers(client.serverIds || []);
    setModalType('edit');
  };

  // Auto-fill form values when pre-set plan is selected
  const handleSelectPlan = (planId: string) => {
    setFormPlanId(planId);
    if (!planId) return;

    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setFormIsUnlimitedTraffic(plan.limitTrafficGb === 0);
      setFormLimitTraffic(plan.limitTrafficGb);
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + plan.durationDays);
      setFormExpiryDate(futureDate.toISOString().split('T')[0]);
      setFormIsUnlimitedExpiry(false);
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast(lang === 'RU' ? 'Введите имя!' : 'Please enter a name!', 'error');
      return;
    }

    const clientPayload = {
      name: formName,
      uuid: formUuid,
      flow: formFlow,
      limitTrafficGb: formIsUnlimitedTraffic ? 0 : Number(formLimitTraffic),
      expiryDate: formIsUnlimitedExpiry ? 'unlimited' : formExpiryDate,
      planId: formPlanId || null,
      telegramUsername: formTelegramUsername || null,
      serverIds: formSelectedServers,
      isActive: selectedClient ? selectedClient.isActive : true,
    };

    try {
      if (modalType === 'add') {
        const res = await authFetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientPayload)
        });
        if (res.ok) {
          showToast(lang === 'RU' ? 'Пользователь добавлен' : 'Client created successfully');
        }
      } else {
        const res = await authFetch(`/api/clients/${selectedClient?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientPayload)
        });
        if (res.ok) {
          showToast(lang === 'RU' ? 'Данные пользователя сохранены' : 'Client settings saved');
        }
      }
      setModalType(null);
      loadAllData();
    } catch (err) {
      console.error(err);
      showToast(lang === 'RU' ? 'Ошибка сохранения' : 'Saving failed', 'error');
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (window.confirm(lang === 'RU' ? `Вы действительно хотите удалить "${name}"?` : `Are you sure you want to delete client "${name}"?`)) {
      try {
        const res = await authFetch(`/api/clients/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast(lang === 'RU' ? `Пользователь "${name}" успешно удален` : `User "${name}" deleted`);
          loadAllData();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleClientStatus = async (client: VpnClient) => {
    try {
      const res = await authFetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !client.isActive })
      });
      if (res.ok) {
        showToast(lang === 'RU' ? `Пользователь "${client.name}" обновлен` : `Client "${client.name}" status updated`);
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- SERVER OPERATIONS ---
  const handleCreateServer = async (srv: any) => {
    await authFetch('/api/servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(srv)
    });
    loadAllData();
  };

  const handleUpdateServer = async (id: string, srv: any) => {
    await authFetch(`/api/servers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(srv)
    });
    loadAllData();
  };

  const handleDeleteServer = async (id: string) => {
    await authFetch(`/api/servers/${id}`, { method: 'DELETE' });
    loadAllData();
  };

  // --- PLANS OPERATIONS ---
  const handleCreatePlan = async (plan: any) => {
    await authFetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan)
    });
    loadAllData();
  };

  const handleUpdatePlan = async (id: string, plan: any) => {
    await authFetch(`/api/plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan)
    });
    loadAllData();
  };

  const handleDeletePlan = async (id: string) => {
    await authFetch(`/api/plans/${id}`, { method: 'DELETE' });
    loadAllData();
  };

  // --- BOT CONFIG OPERATIONS ---
  const handleSaveBotConfig = async (cfg: BotConfig) => {
    await authFetch('/api/bot-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    });
    loadAllData();
  };

  // --- AUDITING / PAYMENT APPROVAL ---
  const handleApprovePayment = async (id: string) => {
    const res = await authFetch(`/api/payments/${id}/approve`, { method: 'POST' });
    if (res.ok) {
      showToast(lang === 'RU' ? 'Активировано! Ссылка подписки отправлена юзеру в Telegram.' : 'Approved! Key and subscription link pushed to Telegram user.');
      loadAllData();
    }
  };

  const handleRejectPayment = async (id: string) => {
    const res = await authFetch(`/api/payments/${id}/reject`, { method: 'POST' });
    if (res.ok) {
      showToast(lang === 'RU' ? 'Платеж отклонен модератором' : 'Payment rejected', 'info');
      loadAllData();
    }
  };

  // --- REAL SIMULATE TRAFFIC (PERSISTENT ON BACKEND) ---
  const handleSimulateTraffic = async () => {
    try {
      const res = await authFetch('/api/simulate-traffic', { method: 'POST' });
      if (res.ok) {
        showToast(lang === 'RU' ? 'Имитация успешна: пользователи израсходовали трафик ⚡' : 'Simulation complete: users consumed random traffic ⚡');
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- FILTERS ---
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.uuid.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : 
                          statusFilter === 'active' ? c.isActive : !c.isActive;
    return matchesSearch && matchesStatus;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 selection:bg-cyan-500/30 selection:text-cyan-200 antialiased font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl p-6 md:p-8 shadow-2xl relative space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-cyan-600 rounded-xl shadow-md text-white animate-pulse">
              <Shield size={32} />
            </div>
            <h1 className="font-display font-bold text-xl tracking-wider text-white mt-4 uppercase">
              VLESS REALITY PANEL
            </h1>
            <p className="text-xs text-slate-400">
              {lang === 'RU' ? 'Доступ защищен паролем администратора' : 'Admin Panel is password protected'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">
                {lang === 'RU' ? 'Пароль администратора' : 'Admin Password'}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value);
                  setLoginError('');
                }}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2.5 text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 transition text-center"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/20 border border-rose-500/20 p-2.5 rounded-lg">
                <AlertCircle size={14} className="shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-750 disabled:text-slate-500 text-slate-950 font-bold text-xs py-2.5 rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider"
            >
              <Lock size={12} />
              <span>{isLoggingIn ? (lang === 'RU' ? 'Проверка...' : 'Verifying...') : (lang === 'RU' ? 'Войти в панель' : 'Login')}</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-850/50">
            <button
              onClick={() => setLang(prev => prev === 'RU' ? 'EN' : 'RU')}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition font-mono"
            >
              {lang === 'RU' ? 'Switch to English 🇬🇧' : 'Переключить на Русский 🇷🇺'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeClientsCount = clients.filter(c => c.isActive).length;
  const totalUsedTrafficGb = parseFloat(clients.reduce((acc, c) => acc + c.usedTrafficGb, 0).toFixed(1));
  const pendingPaymentsCount = payments.filter(p => p.status === 'pending').length;

  const currentHost = window.location.origin;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 antialiased font-sans">
      
      {/* Dynamic Toast Alert */}
      {generalAlert && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900 border border-cyan-500 text-cyan-200 px-4 py-2.5 rounded-lg shadow-xl shadow-cyan-950/40 text-xs font-semibold animate-bounce">
          <Sparkles size={14} className="text-cyan-400" />
          <span>{generalAlert.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-850 bg-slate-900/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-cyan-600 rounded-lg shadow-sm">
              <Shield className="text-white animate-pulse" size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display font-bold text-sm tracking-wider text-white">
                  VLESS REALITY NETWORK
                </h1>
                <span className="text-[9px] uppercase tracking-widest bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 font-mono">
                  Multi-Node
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {lang === 'RU' ? 'Админка агрегации VPN и продаж' : 'VPN aggregation & automated billing engine'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Real Simulation button */}
            <button
              onClick={handleSimulateTraffic}
              className="flex items-center gap-1.5 text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-750 px-2.5 py-1.5 rounded-md cursor-pointer transition text-slate-300 hover:text-white"
              title="Add random persistent traffic usage to active clients"
            >
              <Activity size={12} className="text-cyan-400" />
              <span>{lang === 'RU' ? 'Симулировать расход' : 'Simulate Traffic'}</span>
            </button>

            {/* Language toggle */}
            <button
              onClick={() => setLang(prev => prev === 'RU' ? 'EN' : 'RU')}
              className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-750 px-2.5 py-1.5 rounded-md font-medium cursor-pointer text-slate-300 hover:text-white transition"
            >
              <Globe size={12} className="text-cyan-400" />
              <span>{lang === 'RU' ? 'RU/EN' : 'EN/RU'}</span>
            </button>

            {/* Logout button */}
            <button
              onClick={() => {
                localStorage.removeItem('admin_token');
                setIsAuthenticated(false);
                showToast(lang === 'RU' ? 'Вы вышли из системы' : 'Logged out successfully');
              }}
              className="flex items-center gap-1 text-[11px] bg-red-950/30 hover:bg-red-900/30 border border-red-500/10 px-2.5 py-1.5 rounded-md font-medium cursor-pointer text-red-400 hover:text-red-300 transition"
              title="Sign out of Admin Session"
            >
              <LogOut size={12} />
              <span>{lang === 'RU' ? 'Выйти' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {/* Metric widgets block */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-cyan-950 rounded-md text-cyan-400 border border-cyan-500/20">
              <Users size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{lang === 'RU' ? 'Пользователи' : 'Subscribers'}</p>
              <p className="text-sm font-bold text-white mt-0.5 font-mono">
                {activeClientsCount} <span className="text-slate-500 text-xs font-sans font-normal">/ {clients.length} active</span>
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-purple-950 rounded-md text-purple-400 border border-purple-500/20">
              <Activity size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{lang === 'RU' ? 'Суммарный трафик' : 'Byte Volume'}</p>
              <p className="text-sm font-bold text-white mt-0.5 font-mono">
                {totalUsedTrafficGb.toFixed(1)} GB
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-emerald-950 rounded-md text-emerald-400 border border-emerald-500/20">
              <Globe size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{lang === 'RU' ? 'Кластер серверов' : 'Cluster Location'}</p>
              <p className="text-sm font-bold text-white mt-0.5 font-mono">
                {servers.filter(s => s.isActive).length} <span className="text-slate-500 text-xs font-sans font-normal">/ {servers.length} online</span>
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-amber-950 rounded-md text-amber-400 border border-amber-500/20">
              <ShieldAlert size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{lang === 'RU' ? 'Очередь оплат' : 'Audit Pipeline'}</p>
              <p className="text-sm font-bold text-white mt-0.5 font-mono">
                {pendingPaymentsCount} <span className="text-slate-500 text-xs font-sans font-normal">{lang === 'RU' ? 'проверяется' : 'reviewing'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Sidebar/Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-850 pb-2">
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5 border ${activeTab === 'clients' ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30' : 'bg-transparent text-slate-400 hover:text-white border-transparent'}`}
          >
            <Users size={13} />
            <span>{lang === 'RU' ? 'Клиенты' : 'Subscribers'}</span>
          </button>
          <button
            onClick={() => setActiveTab('servers')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5 border ${activeTab === 'servers' ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30' : 'bg-transparent text-slate-400 hover:text-white border-transparent'}`}
          >
            <Server size={13} />
            <span>{lang === 'RU' ? 'Серверы' : 'VPN Nodes'}</span>
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5 border ${activeTab === 'plans' ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30' : 'bg-transparent text-slate-400 hover:text-white border-transparent'}`}
          >
            <Layers size={13} />
            <span>{lang === 'RU' ? 'Тарифы' : 'Billing Plans'}</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5 border relative ${activeTab === 'payments' ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30' : 'bg-transparent text-slate-400 hover:text-white border-transparent'}`}
          >
            <CreditCard size={13} />
            <span>{lang === 'RU' ? 'Оплата' : 'Payments Queue'}</span>
            {pendingPaymentsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white font-bold text-[8px] rounded-full flex items-center justify-center animate-pulse">
                {pendingPaymentsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('bot')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5 border ${activeTab === 'bot' ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30' : 'bg-transparent text-slate-400 hover:text-white border-transparent'}`}
          >
            <Settings size={13} />
            <span>{lang === 'RU' ? 'ТГ Бот' : 'Telegram Bot'}</span>
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5 border ${activeTab === 'deploy' ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30' : 'bg-transparent text-slate-400 hover:text-white border-transparent'}`}
          >
            <Terminal size={13} />
            <span>{lang === 'RU' ? 'Деплой панели' : 'VPS Hosting Guide'}</span>
          </button>
        </div>

        {/* Tab contents execution */}
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw size={24} className="text-cyan-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">{lang === 'RU' ? 'Синхронизация данных...' : 'Synchronizing database...'}</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === 'clients' && (
              <div className="space-y-4">
                {/* Search / Filters layout */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-850 p-3 rounded-xl">
                  <div className="flex flex-1 items-center gap-2 bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5">
                    <Search size={14} className="text-slate-500" />
                    <input
                      type="text"
                      placeholder={lang === 'RU' ? 'Поиск клиентов по имени или UUID...' : 'Search by client name or UUID...'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-transparent text-xs text-slate-200 focus:outline-none w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-300 px-3 py-1.5 cursor-pointer focus:outline-none focus:border-cyan-500"
                    >
                      <option value="all">{lang === 'RU' ? 'Все статусы' : 'All States'}</option>
                      <option value="active">{lang === 'RU' ? 'Только активные' : 'Active Only'}</option>
                      <option value="suspended">{lang === 'RU' ? 'Только приостановленные' : 'Suspended Only'}</option>
                    </select>

                    <button
                      onClick={handleOpenAddClient}
                      className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      <UserPlus size={13} />
                      <span>{lang === 'RU' ? 'Новый клиент' : 'New Client'}</span>
                    </button>
                  </div>
                </div>

                {/* Subscribers list row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                  {filteredClients.map((client) => {
                    const plan = plans.find(p => p.id === client.planId);
                    const isOverlimit = client.limitTrafficGb > 0 && client.usedTrafficGb >= client.limitTrafficGb;
                    
                    // Expiry parsing
                    const hasExpiry = client.expiryDate !== 'unlimited';
                    const daysRemaining = hasExpiry 
                      ? Math.ceil((new Date(client.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;
                    const isExpired = daysRemaining !== null && daysRemaining <= 0;

                    const trafficPercent = client.limitTrafficGb === 0 
                      ? 0 
                      : Math.min(100, Math.round((client.usedTrafficGb / client.limitTrafficGb) * 100));

                    return (
                      <div key={client.id} className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between group hover:border-slate-800 transition">
                        <div className="space-y-3">
                          
                          {/* Card header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xs font-bold text-white group-hover:text-cyan-400 transition leading-tight">
                                {client.name}
                              </h3>
                              {client.telegramUsername && (
                                <p className="text-[10px] text-cyan-400 font-mono mt-0.5">@{client.telegramUsername}</p>
                              )}
                            </div>

                            <button
                              onClick={() => handleToggleClientStatus(client)}
                              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${client.isActive && !isOverlimit && !isExpired ? 'bg-cyan-500' : 'bg-slate-700'}`}
                            >
                              <div className={`w-3.5 h-3.5 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${client.isActive && !isOverlimit && !isExpired ? 'right-0.5' : 'left-0.5'}`} />
                            </button>
                          </div>

                          {/* Progress/Usage values */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-slate-500">{lang === 'RU' ? 'Трафик:' : 'Usage:'}</span>
                              <span className="text-slate-300 font-bold">
                                {client.usedTrafficGb.toFixed(1)} / {client.limitTrafficGb === 0 ? 'Unlimited' : `${client.limitTrafficGb} GB`}
                              </span>
                            </div>

                            {client.limitTrafficGb > 0 && (
                              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${trafficPercent >= 90 ? 'bg-red-500' : trafficPercent >= 70 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                                  style={{ width: `${trafficPercent}%` }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Key details list */}
                          <div className="space-y-1 text-[9px] font-mono text-slate-500 leading-normal border-t border-slate-850/50 pt-2.5">
                            <div className="flex justify-between">
                              <span>Plan:</span>
                              <span className="text-slate-300">{plan ? plan.name : (lang === 'RU' ? 'Ручной тариф' : 'Manual Plan')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Expires:</span>
                              <span className={`font-semibold ${isExpired ? 'text-red-400' : daysRemaining !== null && daysRemaining <= 5 ? 'text-amber-400' : 'text-slate-300'}`}>
                                {client.expiryDate === 'unlimited' 
                                  ? 'Never' 
                                  : `${client.expiryDate} (${daysRemaining}d left)`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>UUID:</span>
                              <span className="text-slate-400 truncate max-w-[130px]">{client.uuid}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="flex items-center justify-between border-t border-slate-850 mt-4 pt-3">
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              // Default first server
                              if (servers.length > 0) {
                                setSelectedServerIdForConfig(servers[0].id);
                              }
                              setModalType('configs');
                            }}
                            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-cyan-400 px-2 py-1 rounded text-[10px] font-bold cursor-pointer border border-slate-750 transition"
                          >
                            <QrCode size={11} />
                            <span>{lang === 'RU' ? 'Ключи / Подписка' : 'Configs / URL'}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditClient(client)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded border border-slate-750 cursor-pointer"
                            >
                              <Settings size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteClient(client.id, client.name)}
                              className="p-1.5 bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 rounded border border-slate-750 hover:border-red-500/20 cursor-pointer"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredClients.length === 0 && (
                    <div className="col-span-full py-20 text-center text-xs text-slate-500 border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
                      {lang === 'RU' ? 'Пользователи не найдены по заданным фильтрам.' : 'No subscribers found matching filters.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'servers' && (
              <ServersTab
                lang={lang}
                servers={servers}
                clients={clients}
                onCreateServer={handleCreateServer}
                onUpdateServer={handleUpdateServer}
                onDeleteServer={handleDeleteServer}
                showToast={showToast}
              />
            )}

            {activeTab === 'plans' && (
              <PlansTab
                lang={lang}
                plans={plans}
                onCreatePlan={handleCreatePlan}
                onUpdatePlan={handleUpdatePlan}
                onDeletePlan={handleDeletePlan}
                showToast={showToast}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsTab
                lang={lang}
                payments={payments}
                onApprove={handleApprovePayment}
                onReject={handleRejectPayment}
              />
            )}

            {activeTab === 'bot' && (
              <BotTab
                lang={lang}
                botConfig={botConfig}
                onSaveBotConfig={handleSaveBotConfig}
                onChangePassword={handleChangePassword}
                showToast={showToast}
              />
            )}

            {activeTab === 'deploy' && (
              <DeployTab
                lang={lang}
                showToast={showToast}
              />
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: ADD / EDIT CLIENT */}
      {(modalType === 'add' || modalType === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-850 rounded-xl p-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-850 mb-4">
              <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-white">
                {modalType === 'add' ? (lang === 'RU' ? 'Зарегистрировать нового клиента' : 'Register New Subscriber') : (lang === 'RU' ? 'Изменить параметры клиента' : 'Modify Subscriber Credentials')}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">{lang === 'RU' ? 'Имя клиента / Ярлык' : 'Subscriber Name / Label'}</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Macbook"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">{lang === 'RU' ? 'Telegram Username (Опционально)' : 'Telegram Username (Optional)'}</label>
                  <input
                    type="text"
                    placeholder="e.g. alex_vpn"
                    value={formTelegramUsername}
                    onChange={(e) => setFormTelegramUsername(e.target.value.replace('@', ''))}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">{lang === 'RU' ? 'UUID ключ авторизации' : 'Authorization UUID Key'}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formUuid}
                    onChange={(e) => setFormUuid(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setFormUuid(generateUuid())}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-1 rounded text-xs font-bold cursor-pointer transition border border-slate-750"
                  >
                    Gen
                  </button>
                </div>
              </div>

              {/* Plans list shortcut fill */}
              {plans.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">{lang === 'RU' ? 'Связать с тарифным планом' : 'Bind to Pricing Plan'}</label>
                  <select
                    value={formPlanId}
                    onChange={(e) => handleSelectPlan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-300 px-3 py-2 cursor-pointer focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">{lang === 'RU' ? '— Выбрать тарифный план (автозаполнение) —' : '— Select a Tariff (auto-fill values) —'}</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.priceRub} ₽ — {p.durationDays} {lang === 'RU' ? 'дн.' : 'days'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">Flow (XTLS Reality)</label>
                  <select
                    value={formFlow}
                    onChange={(e) => setFormFlow(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="none">None (Standard TCP)</option>
                    <option value="xtls-r-vless">xtls-r-vless (Vision)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">{lang === 'RU' ? 'Срок действия' : 'Expiration Date'}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={formExpiryDate}
                      disabled={formIsUnlimitedExpiry}
                      onChange={(e) => setFormExpiryDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none disabled:opacity-40"
                    />
                    <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={formIsUnlimitedExpiry}
                        onChange={(e) => setFormIsUnlimitedExpiry(e.target.checked)}
                        className="rounded accent-cyan-500"
                      />
                      <span>Never</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Traffic caps */}
              <div className="bg-[#080B11]/50 p-3 rounded-lg border border-slate-850 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">{lang === 'RU' ? 'Безлимитный трафик' : 'Unlimited Traffic'}</span>
                    <span className="text-[9px] text-slate-400">{lang === 'RU' ? 'Не ограничивать трафик для пользователя' : 'Disable monthly consumption checks'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormIsUnlimitedTraffic(!formIsUnlimitedTraffic)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${formIsUnlimitedTraffic ? 'bg-cyan-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${formIsUnlimitedTraffic ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>

                {!formIsUnlimitedTraffic && (
                  <div className="space-y-1 border-t border-slate-850/60 pt-2 animate-fade-in">
                    <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">{lang === 'RU' ? 'Лимит трафика (ГБ / GB)' : 'Traffic Byte Limit (GB)'}</label>
                    <input
                      type="number"
                      min="1"
                      value={formLimitTraffic}
                      onChange={(e) => setFormLimitTraffic(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Multi-server selection bounds */}
              {servers.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400 block">{lang === 'RU' ? 'Доступные серверы (Агрегация)' : 'Allowed Servers (Aggregation)'}</label>
                  <p className="text-[9px] text-slate-500 leading-none">{lang === 'RU' ? 'Выберите, какие локации войдут в универсальную подписку. Если ничего не выбрано — доступны ВСЕ активные серверы.' : 'Pick locations included in the unified URL. If empty, client gains access to ALL active servers.'}</p>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 border border-slate-850 p-2.5 rounded-lg max-h-[100px] overflow-y-auto">
                    {servers.map(srv => {
                      const isChecked = formSelectedServers.includes(srv.id);
                      return (
                        <label key={srv.id} className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer hover:text-white">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setFormSelectedServers(prev => prev.filter(id => id !== srv.id));
                              } else {
                                setFormSelectedServers(prev => [...prev, srv.id]);
                              }
                            }}
                            className="rounded accent-cyan-500"
                          />
                          <span>{srv.location === 'NL' ? '🇳🇱' : srv.location === 'DE' ? '🇩🇪' : srv.location === 'FI' ? '🇫🇮' : '🌐'} {srv.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition"
                >
                  {lang === 'RU' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1 shadow-md"
                >
                  <Check size={12} />
                  <span>{lang === 'RU' ? 'Сохранить' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONNECTION CONFIGS & MULTI-SERVER SUB LINK */}
      {modalType === 'configs' && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-850 rounded-xl p-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-850 mb-4">
              <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-white">
                {lang === 'RU' ? `Конфигурация подключения: ${selectedClient.name}` : `Connection Credentials: ${selectedClient.name}`}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white cursor-pointer bg-slate-800 px-2 py-1 rounded text-[10px] font-bold">
                {lang === 'RU' ? 'Закрыть' : 'Close'}
              </button>
            </div>

            {/* Config Sub-Tabs */}
            <div className="flex border-b border-slate-850 pb-2 mb-4 gap-1">
              <button
                onClick={() => setActiveConfigTab('sub')}
                className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition ${activeConfigTab === 'sub' ? 'bg-cyan-950 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                🔗 {lang === 'RU' ? 'Единая ссылка подписки (happ/Hiddify)' : 'Unified Subscription Link'}
              </button>
              <button
                onClick={() => setActiveConfigTab('vless')}
                className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition ${activeConfigTab === 'vless' ? 'bg-cyan-950 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                🔑 {lang === 'RU' ? 'Одиночные VLESS Reality ключи' : 'Individual VLESS URLs'}
              </button>
              <button
                onClick={() => setActiveConfigTab('singbox')}
                className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition ${activeConfigTab === 'singbox' ? 'bg-cyan-950 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                ⚙️ Sing-Box JSON
              </button>
            </div>

            {/* TAB CONTENTS */}
            {activeConfigTab === 'sub' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-3 bg-cyan-950/20 border border-cyan-500/15 rounded-xl">
                  <p className="text-[11px] text-cyan-300 leading-normal">
                    💡 <strong>{lang === 'RU' ? 'Универсальная интеграция:' : 'Unified multi-node aggregation:'}</strong><br />
                    {lang === 'RU' ? (
                      <>
                        Это одна универсальная ссылка подписки. При её добавлении в Hiddify, Shadowrocket или Nekobox, клиент <strong>автоматически скачивает маршруты ко всем активным серверам сразу</strong>! Если в будущем вы добавите новую локацию, она автоматически появится у пользователя без необходимости перенастройки!
                      </>
                    ) : (
                      <>
                        This is an aggregated subscription stream. Importing this single URL into Nekobox, Hiddify or Shadowrocket <strong>pulls all active servers automatically</strong>! Any new location added to the cluster in the future is synchronized automatically with the user!
                      </>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className="md:col-span-7 space-y-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">
                      {lang === 'RU' ? 'Универсальный URL подписки' : 'Unified Subscription URL'}
                    </p>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={`${currentHost}/api/sub/${selectedClient.subscriptionToken}`}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-3 pr-20 py-2.5 text-[10px] font-mono text-cyan-300 focus:outline-none select-all"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${currentHost}/api/sub/${selectedClient.subscriptionToken}`);
                          showToast(lang === 'RU' ? 'Скопировано!' : 'Copied!');
                        }}
                        className="absolute right-2 top-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white px-2 py-1 rounded text-[9px] font-bold cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-5 flex justify-center">
                    <QrCodeView value={`${currentHost}/api/sub/${selectedClient.subscriptionToken}`} size={160} />
                  </div>
                </div>
              </div>
            )}

            {activeConfigTab === 'vless' && (
              <div className="space-y-4 animate-fade-in">
                {servers.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">{lang === 'RU' ? 'Выберите сервер для генерации одиночного ключа' : 'Select Target Server Node'}</label>
                      <select
                        value={selectedServerIdForConfig}
                        onChange={(e) => setSelectedServerIdForConfig(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer font-sans"
                      >
                        {servers.map(s => (
                          <option key={s.id} value={s.id}>{s.location === 'NL' ? '🇳🇱' : s.location === 'DE' ? '🇩🇪' : s.location === 'FI' ? '🇫🇮' : '🌐'} {s.name} ({s.ip})</option>
                        ))}
                      </select>
                    </div>

                    {servers.find(s => s.id === selectedServerIdForConfig) && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                        <div className="md:col-span-7 space-y-3">
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">VLESS Reality URL</p>
                          <div className="relative">
                            <textarea
                              rows={3}
                              readOnly
                              value={generateVlessLink(selectedClient, servers.find(s => s.id === selectedServerIdForConfig)!)}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-300 focus:outline-none select-all leading-normal"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(generateVlessLink(selectedClient, servers.find(s => s.id === selectedServerIdForConfig)!));
                                showToast(lang === 'RU' ? 'Скопировано!' : 'Copied!');
                              }}
                              className="absolute right-2 bottom-2 bg-slate-800 hover:bg-slate-750 text-slate-300 px-2 py-1 rounded text-[9px] font-bold cursor-pointer"
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-5 flex justify-center">
                          <QrCodeView value={generateVlessLink(selectedClient, servers.find(s => s.id === selectedServerIdForConfig)!)} size={160} />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500">{lang === 'RU' ? 'Пожалуйста, сначала создайте хотя бы один сервер.' : 'Please add a server first.'}</div>
                )}
              </div>
            )}

            {activeConfigTab === 'singbox' && (
              <div className="space-y-4 animate-fade-in">
                {servers.length > 0 ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">{lang === 'RU' ? 'Выберите сервер для Sing-Box' : 'Select Server for Sing-Box JSON'}</label>
                      <select
                        value={selectedServerIdForConfig}
                        onChange={(e) => setSelectedServerIdForConfig(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-300 px-3 py-1.5 focus:outline-none cursor-pointer"
                      >
                        {servers.map(s => (
                          <option key={s.id} value={s.id}>{s.location === 'NL' ? '🇳🇱' : s.location === 'DE' ? '🇩🇪' : s.location === 'FI' ? '🇫🇮' : '🌐'} {s.name}</option>
                        ))}
                      </select>
                    </div>

                    {servers.find(s => s.id === selectedServerIdForConfig) && (
                      <div className="relative">
                        <pre className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-[9px] font-mono text-slate-300 overflow-x-auto max-h-[300px] leading-normal">
                          {generateClientSingBoxConfig(selectedClient, servers.find(s => s.id === selectedServerIdForConfig)!)}
                        </pre>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generateClientSingBoxConfig(selectedClient, servers.find(s => s.id === selectedServerIdForConfig)!));
                            showToast(lang === 'RU' ? 'Скопировано!' : 'Copied!');
                          }}
                          className="absolute right-2 top-2 bg-slate-800 hover:bg-slate-750 text-slate-300 px-2 py-1 rounded text-[9px] font-bold cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500">{lang === 'RU' ? 'Серверы не найдены.' : 'No servers found.'}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
