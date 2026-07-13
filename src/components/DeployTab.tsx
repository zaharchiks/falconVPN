import { Terminal, Copy, Check, ExternalLink, Globe } from 'lucide-react';
import { useState } from 'react';

interface DeployTabProps {
  lang: 'RU' | 'EN';
  showToast: (msg: string) => void;
}

export function DeployTab({ lang, showToast }: DeployTabProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(lang === 'RU' ? 'Скопировано в буфер обмена!' : 'Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const codeInstallNode = `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git build-essential`;

  const codeCloneAndBuild = `# Клонируйте проект
git clone https://github.com/your-username/vless-reality-panel.git
cd vless-reality-panel

# Установите зависимости
npm install

# Соберите проект для продакшена
npm run build`;

  const codeRunPm2 = `# Установите PM2 глобально
sudo npm install -g pm2

# Запустите проект с указанием внешнего URL (для работы Telegram Bot ссылок)
APP_URL="http://ВАШ_IP_VPS" pm2 start dist/server.cjs --name "vless-panel"

# Настройте автозапуск PM2 при перезагрузке сервера
pm2 startup
pm2 save`;

  const codeNginx = `server {
    listen 80;
    server_name ВАШ_ДОМЕН_ИЛИ_IP;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}`;

  return (
    <div id="vps-deploy-tab" className="space-y-6">
      <div className="bg-slate-900 border border-slate-850 rounded-xl p-5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display mb-2 flex items-center gap-2">
          <Terminal size={16} className="text-cyan-400" />
          {lang === 'RU' ? 'Развертывание панели управления на Ubuntu VPS' : 'Deploying the Panel on Ubuntu VPS'}
        </h2>
        <p className="text-xs text-slate-400 leading-normal mb-4">
          {lang === 'RU' ? (
            <>
              Ниже представлена пошаговая инструкция, как запустить эту панель управления VPN и Telegram-бота на постоянной основе на вашем основном Ubuntu сервере. Вы можете использовать тот же сервер, где установлен Xray, или любой другой.
            </>
          ) : (
            <>
              Below is a step-by-step guide on how to deploy this VPN dashboard and Telegram Bot permanently on your Ubuntu VPS. You can host it on the same server where Xray runs, or any other.
            </>
          )}
        </p>

        {/* Step 1 */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
            <span className="flex items-center justify-center h-5 w-5 rounded bg-cyan-950 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold">1</span>
            {lang === 'RU' ? 'Установка Node.js 18+' : 'Install Node.js 18+'}
          </h3>
          <p className="text-[11px] text-slate-400 pl-6 leading-normal">
            {lang === 'RU' ? 'Подключитесь к вашему серверу по SSH и выполните команды для установки Node.js и Git:' : 'Connect to your server via SSH and execute commands to install Node.js and Git:'}
          </p>
          <div className="pl-6 relative">
            <pre className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto leading-normal">
              {codeInstallNode}
            </pre>
            <button
              onClick={() => copyToClipboard(codeInstallNode, 'node')}
              className="absolute right-3 top-3 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white px-2 py-1 rounded text-[9px] font-bold cursor-pointer flex items-center gap-1 border border-slate-700/50"
            >
              {copiedId === 'node' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copiedId === 'node' ? (lang === 'RU' ? 'Скопировано!' : 'Copied!') : (lang === 'RU' ? 'Копировать' : 'Copy')}</span>
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
            <span className="flex items-center justify-center h-5 w-5 rounded bg-cyan-950 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold">2</span>
            {lang === 'RU' ? 'Загрузка проекта и сборка' : 'Clone and Build Project'}
          </h3>
          <p className="text-[11px] text-slate-400 pl-6 leading-normal">
            {lang === 'RU' ? 'Склонируйте репозиторий с проектом, установите пакеты и выполните компиляцию:' : 'Clone your repository, install dependencies and compile the full-stack server:'}
          </p>
          <div className="pl-6 relative">
            <pre className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto leading-normal">
              {codeCloneAndBuild}
            </pre>
            <button
              onClick={() => copyToClipboard(codeCloneAndBuild, 'clone')}
              className="absolute right-3 top-3 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white px-2 py-1 rounded text-[9px] font-bold cursor-pointer flex items-center gap-1 border border-slate-700/50"
            >
              {copiedId === 'clone' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copiedId === 'clone' ? (lang === 'RU' ? 'Скопировано!' : 'Copied!') : (lang === 'RU' ? 'Копировать' : 'Copy')}</span>
            </button>
          </div>
        </div>

        {/* Step 3 */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
            <span className="flex items-center justify-center h-5 w-5 rounded bg-cyan-950 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold">3</span>
            {lang === 'RU' ? 'Фоновый запуск и автозапуск через PM2' : 'Run in Background with PM2'}
          </h3>
          <p className="text-[11px] text-slate-400 pl-6 leading-normal">
            {lang === 'RU' ? 'Используйте менеджер процессов PM2, чтобы панель работала в фоне круглые сутки и автоматически перезапускалась при сбое:' : 'Use the PM2 process manager to run the dashboard in the background 24/7 and auto-restart on system boot:'}
          </p>
          <div className="pl-6 relative">
            <pre className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto leading-normal">
              {codeRunPm2}
            </pre>
            <button
              onClick={() => copyToClipboard(codeRunPm2, 'pm2')}
              className="absolute right-3 top-3 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white px-2 py-1 rounded text-[9px] font-bold cursor-pointer flex items-center gap-1 border border-slate-700/50"
            >
              {copiedId === 'pm2' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copiedId === 'pm2' ? (lang === 'RU' ? 'Скопировано!' : 'Copied!') : (lang === 'RU' ? 'Копировать' : 'Copy')}</span>
            </button>
          </div>
        </div>

        {/* Step 4 */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
            <span className="flex items-center justify-center h-5 w-5 rounded bg-cyan-950 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold">4</span>
            {lang === 'RU' ? 'Настройка Nginx Proxy (Рекомендуется)' : 'Nginx Reverse Proxy Configuration (Recommended)'}
          </h3>
          <p className="text-[11px] text-slate-400 pl-6 leading-normal">
            {lang === 'RU' ? 'Чтобы открывать панель по стандартному 80 или 443 порту (например, vpn.mydomain.com), установите Nginx и настройте проксирование на порт 3000:' : 'To open the panel on standard 80 or 443 ports (e.g., vpn.mydomain.com), install Nginx and configure reverse proxy to local port 3000:'}
          </p>
          <div className="pl-6 relative">
            <pre className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto leading-normal">
              {codeNginx}
            </pre>
            <button
              onClick={() => copyToClipboard(codeNginx, 'nginx')}
              className="absolute right-3 top-3 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white px-2 py-1 rounded text-[9px] font-bold cursor-pointer flex items-center gap-1 border border-slate-700/50"
            >
              {copiedId === 'nginx' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copiedId === 'nginx' ? (lang === 'RU' ? 'Скопировано!' : 'Copied!') : (lang === 'RU' ? 'Копировать' : 'Copy')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
