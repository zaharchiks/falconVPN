import { Terminal, Copy, Check, ExternalLink, Globe } from 'lucide-react';
import { useState } from 'react';

interface DeployTabProps {
  lang: 'RU' | 'EN';
  showToast: (msg: string) => void;
}

export function DeployTab({ lang, showToast }: DeployTabProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [domain, setDomain] = useState('falconvpn.c6t.ru');

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
APP_URL="https://${domain || 'falconvpn.c6t.ru'}" pm2 start dist/server.cjs --name "vless-panel"

# Настройте автозапуск PM2 при перезагрузке сервера
pm2 startup
pm2 save`;

  const codeNginx = `server {
    listen 80;
    server_name ${domain || 'falconvpn.c6t.ru'};

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

        {/* Dynamic Domain Input */}
        <div className="mb-6 bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
              <Globe size={14} className="text-cyan-400 animate-pulse" />
              {lang === 'RU' ? 'УКАЖИТЕ ВАШ ДОМЕН:' : 'ENTER YOUR DOMAIN:'}
            </h4>
            <p className="text-[10px] text-slate-400 leading-normal">
              {lang === 'RU' ? 'Все команды, Nginx конфиги и SSL параметры ниже автоматически перестроятся под этот домен.' : 'All commands, Nginx server blocks, and SSL generation commands below will dynamically update.'}
            </p>
          </div>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="falconvpn.c6t.ru"
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 font-mono w-full md:w-64 tracking-wide"
          />
        </div>

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
        <div className="space-y-3 mb-6">
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

        {/* Step 5 */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
            <span className="flex items-center justify-center h-5 w-5 rounded bg-cyan-950 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold">5</span>
            {lang === 'RU' ? 'Настройка бесплатного SSL-сертификата (Let\'s Encrypt)' : 'Configure Free SSL Certificate (Let\'s Encrypt)'}
          </h3>
          <p className="text-[11px] text-slate-400 pl-6 leading-normal">
            {lang === 'RU' ? (
              <>
                ⚠️ <strong className="text-amber-400 font-medium">Самоподписанные сертификаты НЕ подходят для Telegram!</strong> Telegram Web Apps строго требуют доверенный SSL-сертификат от официального центра сертификации. Если использовать самоподписанный, бот выдаст ошибку <code className="bg-slate-950 text-rose-400 px-1 py-0.5 rounded font-mono">небезопасная схема http запрещена</code>.
                <br /><br />
                Самый простой способ — получить абсолютно бесплатный доверенный SSL-сертификат через <strong className="text-cyan-400 font-medium">Certbot (Let's Encrypt)</strong>. Для этого у вас должен быть зарегистрирован любой домен (или поддомен), направленный на IP вашего VPS.
                <br /><br />
                Выполните следующие команды для автоматической установки SSL на ваш Nginx:
              </>
            ) : (
              <>
                ⚠️ <strong className="text-amber-400 font-medium">Self-signed certificates DO NOT work for Telegram!</strong> Telegram Web Apps strictly require a trusted SSL certificate from an official CA. If you use a self-signed one, Telegram will still block it.
                <br /><br />
                The easiest way is to get a completely free trusted SSL certificate via <strong className="text-cyan-400 font-medium">Certbot (Let's Encrypt)</strong>. You must have a domain pointing to your VPS IP.
                <br /><br />
                Execute these commands to automatically install and configure SSL on Nginx:
              </>
            )}
          </p>
          <div className="pl-6 relative">
            <pre className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto leading-normal">
{`# Установите Certbot и плагин для Nginx
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Получите бесплатный SSL-сертификат (замените vpn.mydomain.com на ваш домен)
# Certbot автоматически настроит HTTPS и редирект в Nginx!
sudo certbot --nginx -d vpn.mydomain.com`}
            </pre>
            <button
              onClick={() => copyToClipboard(`sudo apt update\nsudo apt install certbot python3-certbot-nginx -y\nsudo certbot --nginx -d vpn.mydomain.com`, 'ssl')}
              className="absolute right-3 top-3 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white px-2 py-1 rounded text-[9px] font-bold cursor-pointer flex items-center gap-1 border border-slate-700/50"
            >
              {copiedId === 'ssl' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copiedId === 'ssl' ? (lang === 'RU' ? 'Скопировано!' : 'Copied!') : (lang === 'RU' ? 'Копировать' : 'Copy')}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 pl-6 leading-normal">
            {lang === 'RU' ? (
              <>
                После успешного выполнения Certbot автоматически обновит конфигурацию Nginx, переведя панель на защищенный <code className="text-cyan-400">https://ваш_домен</code>. Теперь Telegram Web App будет работать корректно и без ошибок!
                <br /><br />
                🛠️ <strong className="text-amber-400 font-medium">Если Certbot выдал ошибку "Could not install certificate" или не нашел server block:</strong>
                <br />
                Это означает, что сертификат <strong className="text-emerald-400 font-medium">успешно получен</strong>, но Certbot не смог автоматически изменить ваши файлы конфигурации. В этом случае настройте Nginx вручную. Замените содержимое конфигурационного файла (например, <code className="bg-slate-950 text-slate-300 px-1 py-0.5 rounded font-mono">/etc/nginx/sites-available/default</code>) на следующее:
              </>
            ) : (
              <>
                Upon successful run, Certbot will automatically rewrite your Nginx configuration, securing your site at <code className="text-cyan-400">https://your_domain</code>. Your Telegram Web App will now load successfully!
                <br /><br />
                🛠️ <strong className="text-amber-400 font-medium">If Certbot fails with "Could not install certificate" or cannot find your server block:</strong>
                <br />
                This means your certificate was <strong className="text-emerald-400 font-medium">successfully generated</strong>, but Certbot couldn't auto-edit your config. Simply rewrite your Nginx config file manually (e.g. <code className="bg-slate-950 text-slate-300 px-1 py-0.5 rounded font-mono">/etc/nginx/sites-available/default</code>) with the following structure:
              </>
            )}
          </p>

          <div className="pl-6 relative">
            <pre className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto leading-normal">
{`server {
    listen 80;
    server_name ${domain || 'falconvpn.c6t.ru'};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name ${domain || 'falconvpn.c6t.ru'};

    ssl_certificate /etc/letsencrypt/live/${domain || 'falconvpn.c6t.ru'}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain || 'falconvpn.c6t.ru'}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`}
            </pre>
            <button
              onClick={() => copyToClipboard(`server {
    listen 80;
    server_name ${domain || 'falconvpn.c6t.ru'};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name ${domain || 'falconvpn.c6t.ru'};

    ssl_certificate /etc/letsencrypt/live/${domain || 'falconvpn.c6t.ru'}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain || 'falconvpn.c6t.ru'}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`, 'manual_ssl')}
              className="absolute right-3 top-3 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white px-2 py-1 rounded text-[9px] font-bold cursor-pointer flex items-center gap-1 border border-slate-700/50"
            >
              {copiedId === 'manual_ssl' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copiedId === 'manual_ssl' ? (lang === 'RU' ? 'Скопировано!' : 'Copied!') : (lang === 'RU' ? 'Копировать' : 'Copy')}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 pl-6 leading-normal">
            {lang === 'RU' ? (
              <>
                Заменив конфигурацию, примените её командами:
                <br />
                <code className="bg-slate-950 text-cyan-400 px-1 py-0.5 rounded font-mono">sudo nginx -t</code> (проверка корректности) и <code className="bg-slate-950 text-cyan-400 px-1 py-0.5 rounded font-mono">sudo systemctl reload nginx</code>.
              </>
            ) : (
              <>
                After rewriting the config, apply changes using:
                <br />
                <code className="bg-slate-950 text-cyan-400 px-1 py-0.5 rounded font-mono">sudo nginx -t</code> (syntax test) and <code className="bg-slate-950 text-cyan-400 px-1 py-0.5 rounded font-mono">sudo systemctl reload nginx</code>.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
