import React, { useState } from 'react';
import { Plus, Edit, Trash2, Key, FileText, Check, Copy, Wifi, Globe, Server, Cpu, HardDrive, Users, X } from 'lucide-react';
import { VpnServer, VpnClient } from '../types';
import { generateKeyPair, generateShortId, generateBashScript } from '../helpers';

interface ServersTabProps {
  lang: 'RU' | 'EN';
  servers: VpnServer[];
  clients: VpnClient[];
  onCreateServer: (server: Omit<VpnServer, 'id' | 'cpuUsage' | 'ramUsage' | 'onlineUsers'>) => Promise<void>;
  onUpdateServer: (id: string, server: Partial<VpnServer>) => Promise<void>;
  onDeleteServer: (id: string) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'info') => void;
}

export function ServersTab({
  lang,
  servers,
  clients,
  onCreateServer,
  onUpdateServer,
  onDeleteServer,
  showToast
}: ServersTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<VpnServer | null>(null);
  
  // Bash Script modal
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [selectedServerForScript, setSelectedServerForScript] = useState<VpnServer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState(443);
  const [sni, setSni] = useState('images.apple.com');
  const [shortId, setShortId] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [spiderX, setSpiderX] = useState('/');
  const [location, setLocation] = useState('NL');
  const [isActive, setIsActive] = useState(true);

  // Key feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingServer(null);
    setName('');
    setIp('');
    setPort(443);
    setSni('images.apple.com');
    setSpiderX('/');
    setLocation('NL');
    setIsActive(true);
    
    // Auto-generate keys for convenience!
    const keys = generateKeyPair();
    setPrivateKey(keys.privateKey);
    setPublicKey(keys.publicKey);
    setShortId(generateShortId(16));
    
    setModalOpen(true);
  };

  const handleOpenEdit = (srv: VpnServer) => {
    setEditingServer(srv);
    setName(srv.name);
    setIp(srv.ip);
    setPort(srv.port);
    setSni(srv.sni);
    setShortId(srv.shortId);
    setPrivateKey(srv.privateKey);
    setPublicKey(srv.publicKey);
    setSpiderX(srv.spiderX);
    setLocation(srv.location);
    setIsActive(srv.isActive);
    setModalOpen(true);
  };

  const handleGenerateNewKeys = () => {
    const keys = generateKeyPair();
    setPrivateKey(keys.privateKey);
    setPublicKey(keys.publicKey);
    setShortId(generateShortId(16));
    showToast(lang === 'RU' ? 'Сгенерированы новые Reality-ключи X25519!' : 'New Reality X25519 keys generated!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast(lang === 'RU' ? 'Введите название сервера!' : 'Enter server name!', 'info');
      return;
    }
    if (!ip.trim()) {
      showToast(lang === 'RU' ? 'Введите IP-адрес сервера!' : 'Enter server IP address!', 'info');
      return;
    }

    try {
      const serverData = {
        name,
        ip,
        port: Number(port),
        sni,
        shortId,
        privateKey,
        publicKey,
        spiderX,
        location,
        isActive
      };

      if (editingServer) {
        await onUpdateServer(editingServer.id, serverData);
        showToast(lang === 'RU' ? `Сервер "${name}" сохранен` : `Server "${name}" updated successfully`);
      } else {
        await onCreateServer(serverData);
        showToast(lang === 'RU' ? `Сервер "${name}" успешно добавлен в сеть` : `Server "${name}" registered successfully`);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast(lang === 'RU' ? 'Ошибка сохранения' : 'Error saving server');
    }
  };

  const handleDelete = async (id: string, srvName: string) => {
    if (window.confirm(lang === 'RU' ? `Вы уверены, что хотите удалить сервер "${srvName}"?` : `Are you sure you want to delete server "${srvName}"?`)) {
      try {
        await onDeleteServer(id);
        showToast(lang === 'RU' ? `Сервер "${srvName}" удален` : `Server "${srvName}" deleted`);
      } catch (err) {
        console.error(err);
        showToast(lang === 'RU' ? 'Ошибка удаления' : 'Error deleting server');
      }
    }
  };

  const triggerCopyFeedback = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(lang === 'RU' ? 'Скопировано в буфер!' : 'Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="servers-manager-tab" className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider font-display flex items-center gap-1.5">
            <Server size={14} className="text-cyan-400" />
            {lang === 'RU' ? 'Кластер серверов и локаций' : 'VPN Server Locations Cluster'}
          </h2>
          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
            {lang === 'RU' ? 'Добавляйте и редактируйте локации. Скрипты инсталляции генерируются под каждый сервер отдельно.' : 'Register custom nodes. Separate installer scripts are generated dynamically for each server Node.'}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded cursor-pointer transition shadow-sm"
        >
          <Plus size={11} />
          <span>{lang === 'RU' ? 'Добавить узел' : 'Add Node'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.map((s) => (
          <div key={s.id} className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-850 transition duration-200">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg" title={`Location: ${s.location}`}>
                      {s.location === 'NL' ? '🇳🇱' : s.location === 'DE' ? '🇩🇪' : s.location === 'FI' ? '🇫🇮' : s.location === 'TR' ? '🇹🇷' : '🌐'}
                    </span>
                    <h3 className="text-xs font-bold text-white font-display">
                      {s.name}
                    </h3>
                  </div>
                  <p className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">{s.ip}:{s.port}</p>
                </div>

                <button
                  onClick={() => onUpdateServer(s.id, { isActive: !s.isActive })}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${s.isActive ? 'bg-cyan-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${s.isActive ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Server Metrics Block */}
              {s.isActive ? (
                <div className="grid grid-cols-3 gap-2 bg-[#080B11]/50 border border-slate-850 p-2 rounded-lg text-[10px] font-mono">
                  <div className="text-center p-1 border-r border-slate-850">
                    <span className="text-slate-500 block text-[8px] uppercase">{lang === 'RU' ? 'Польз.' : 'Users'}</span>
                    <span className="text-slate-200 font-bold flex items-center justify-center gap-0.5 mt-0.5">
                      <Users size={10} className="text-cyan-400" />
                      {s.onlineUsers}
                    </span>
                  </div>
                  <div className="text-center p-1 border-r border-slate-850">
                    <span className="text-slate-500 block text-[8px] uppercase">CPU</span>
                    <span className="text-slate-200 font-bold flex items-center justify-center gap-0.5 mt-0.5">
                      <Cpu size={10} className="text-purple-400" />
                      {s.cpuUsage}%
                    </span>
                  </div>
                  <div className="text-center p-1">
                    <span className="text-slate-500 block text-[8px] uppercase">RAM</span>
                    <span className="text-slate-200 font-bold flex items-center justify-center gap-0.5 mt-0.5">
                      <HardDrive size={10} className="text-emerald-400" />
                      {s.ramUsage}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-3 text-center text-[10px] bg-slate-950/40 border border-slate-850 text-slate-500 rounded-lg uppercase tracking-wider font-mono font-semibold">
                  🔴 {lang === 'RU' ? 'Узел отключен' : 'Node Paused'}
                </div>
              )}

              {/* Reality parameters list */}
              <div className="space-y-1 text-[9px] font-mono text-slate-500 leading-normal border-t border-slate-850/60 pt-2.5">
                <div className="flex justify-between">
                  <span>SNI / Masking:</span>
                  <span className="text-slate-400 truncate max-w-[150px]">{s.sni}</span>
                </div>
                <div className="flex justify-between">
                  <span>ShortID:</span>
                  <span className="text-slate-400">{s.shortId.substring(0, 8)}...</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-850 mt-4 pt-3 shrink-0">
              <button
                onClick={() => {
                  setSelectedServerForScript(s);
                  setScriptModalOpen(true);
                }}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-cyan-400 px-2 py-1 rounded border border-slate-750 text-[10px] font-bold cursor-pointer transition"
                title={lang === 'RU' ? 'Показать Bash-скрипт установки Xray' : 'Show Ubuntu bash installer script'}
              >
                <FileText size={11} />
                <span>{lang === 'RU' ? 'Установить' : 'Bash Setup'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded cursor-pointer transition border border-slate-750"
                  title={lang === 'RU' ? 'Редактировать' : 'Edit'}
                >
                  <Edit size={11} />
                </button>
                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  className="p-1.5 bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 rounded cursor-pointer transition border border-slate-750 hover:border-red-500/20"
                  title={lang === 'RU' ? 'Удалить' : 'Delete'}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Server Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-850 rounded-xl p-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-850 mb-4">
              <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-white">
                {editingServer ? (lang === 'RU' ? 'Редактировать узел' : 'Edit VPN Node') : (lang === 'RU' ? 'Добавить узел сети' : 'Add VPN Node')}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">{lang === 'RU' ? 'Название сервера' : 'Server Name'}</label>
                  <input
                    type="text"
                    placeholder="e.g. Frankfurt Main"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">{lang === 'RU' ? 'Локация (Код)' : 'Location (Code)'}</label>
                  <input
                    type="text"
                    placeholder="NL / DE / TR / US"
                    value={location}
                    onChange={(e) => setLocation(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">{lang === 'RU' ? 'IP-адрес сервера (IPv4)' : 'Server IP address (IPv4)'}</label>
                  <input
                    type="text"
                    placeholder="e.g. 194.87.214.45"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">{lang === 'RU' ? 'Порт' : 'Port'}</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">{lang === 'RU' ? 'Маскировка SNI (Домен)' : 'SNI Mask Domain'}</label>
                  <input
                    type="text"
                    value={sni}
                    onChange={(e) => setSni(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">{lang === 'RU' ? 'Fallback Path (SpiderX)' : 'Fallback Path (SpiderX)'}</label>
                  <input
                    type="text"
                    value={spiderX}
                    onChange={(e) => setSpiderX(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              {/* Reality Cryptography Parameters */}
              <div className="bg-[#080B11]/50 p-3 rounded-lg border border-slate-850 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">{lang === 'RU' ? 'Параметры Reality TLS' : 'Reality TLS Cryptography'}</span>
                  <button
                    type="button"
                    onClick={handleGenerateNewKeys}
                    className="flex items-center gap-1 text-[9px] font-bold text-cyan-400 hover:text-cyan-300 bg-slate-800 border border-slate-750 px-2 py-1 rounded cursor-pointer"
                  >
                    <Key size={10} />
                    <span>{lang === 'RU' ? 'Сгенерировать' : 'Generate Keys'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-wider font-bold font-mono text-slate-500">{lang === 'RU' ? 'Короткий ID (Short ID)' : 'Short ID'}</label>
                    <input
                      type="text"
                      value={shortId}
                      onChange={(e) => setShortId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-wider font-bold font-mono text-slate-500">{lang === 'RU' ? 'Публичный ключ (PBK)' : 'Public Key (PBK)'}</label>
                    <input
                      type="text"
                      value={publicKey}
                      onChange={(e) => setPublicKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-wider font-bold font-mono text-slate-500">{lang === 'RU' ? 'Приватный ключ (Server Private Key)' : 'Private Key (Server Secret)'}</label>
                  <input
                    type="text"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition"
                >
                  {lang === 'RU' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1 shadow-sm"
                >
                  <Check size={12} />
                  <span>{lang === 'RU' ? 'Сохранить' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bash Setup Script Modal */}
      {scriptModalOpen && selectedServerForScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-850 rounded-xl p-4 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-850 mb-3">
              <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                <FileText size={14} className="text-cyan-400" />
                {lang === 'RU' ? `Установка Xray на сервер "${selectedServerForScript.name}"` : `Install Xray on Node "${selectedServerForScript.name}"`}
              </h3>
              <button onClick={() => setScriptModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer bg-slate-800 hover:bg-slate-750 px-2 py-1 rounded text-[10px] font-bold">
                {lang === 'RU' ? 'Закрыть' : 'Close'}
              </button>
            </div>

            <p className="text-[10px] text-slate-400 mb-3 leading-normal">
              {lang === 'RU' ? (
                <>
                  Скопируйте скрипт ниже, подключитесь к вашему новому серверу <strong>{selectedServerForScript.ip}</strong> по SSH от имени <strong>root</strong>, вставьте скрипт в консоль и нажмите <strong>Enter</strong>. Скрипт установит Xray-core, настроит Reality под этот узел, откроет порт {selectedServerForScript.port}, оптимизирует ядро с помощью BBR и пропишет текущих активных пользователей панели!
                </>
              ) : (
                <>
                  Copy the script below, connect to your server <strong>{selectedServerForScript.ip}</strong> via SSH as <strong>root</strong>, paste the code and press <strong>Enter</strong>. This will automatically deploy Xray-core, configure Reality keys, map port {selectedServerForScript.port}, boost TCP with BBR, and load all active clients!
                </>
              )}
            </p>

            <div className="relative">
              <pre className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-[9px] font-mono text-slate-300 overflow-x-auto max-h-[40vh] leading-normal">
                {generateBashScript(clients, selectedServerForScript)}
              </pre>
              <button
                onClick={() => triggerCopyFeedback(generateBashScript(clients, selectedServerForScript), 'server_bash')}
                className="absolute right-2 top-2 bg-slate-800/80 hover:bg-slate-750 text-slate-300 px-2.5 py-1 rounded text-[9px] font-bold cursor-pointer border border-slate-850 flex items-center gap-1"
              >
                {copiedId === 'server_bash' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                <span>{copiedId === 'server_bash' ? (lang === 'RU' ? 'Успешно!' : 'Success!') : (lang === 'RU' ? 'Копировать' : 'Copy')}</span>
              </button>
            </div>

            <p className="text-[9px] text-slate-500 mt-3 leading-normal">
              * {lang === 'RU' ? 'Примечание: при добавлении новых пользователей вы можете просто обновить серверный JSON-конфиг или запустить этот скрипт повторно.' : 'Note: adding new clients later simply requires reloading xray server JSON or running this installer again.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
