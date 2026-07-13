import { VpnClient, ServerConfig } from './types';

// Simple UUID generator
export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Generate hexadecimal short ID for Reality (usually 8 or 16 hex characters)
export function generateShortId(length: number = 8): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Generate realistic looking Curve25519 / X25519 Private/Public keys (Base64 Url Safe)
// In a real CLI this uses `xray x25519`. Here we generate compliant-looking base64 keys.
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  
  const genKey = (len: number) => {
    let key = '';
    for (let i = 0; i < len; i++) {
      key += chars[Math.floor(Math.random() * chars.length)];
    }
    return key;
  };

  // Standard Curve25519 keys are 43 characters long plus optional padding in standard base64
  return {
    privateKey: genKey(43) + '=',
    publicKey: genKey(43) + '='
  };
}

// Generate standard VLESS + Reality URL link
export function generateVlessLink(client: VpnClient, server: ServerConfig): string {
  const uuid = encodeURIComponent(client.uuid);
  const ip = server.ip || 'YOUR_VPS_IP';
  const port = server.port;
  const sni = encodeURIComponent(server.sni);
  const pbk = encodeURIComponent(server.publicKey);
  const sid = encodeURIComponent(server.shortId);
  const flow = client.flow === 'xtls-r-vless' ? 'xtls-r-vless' : '';
  const name = encodeURIComponent(client.name);
  
  let link = `vless://${uuid}@${ip}:${port}?security=reality&sni=${sni}&fp=chrome&pbk=${pbk}&sid=${sid}&type=tcp`;
  
  if (flow) {
    link += `&flow=${flow}`;
  }
  
  link += `#${name}`;
  return link;
}

// Generate full client JSON config (Sing-Box format)
export function generateClientSingBoxConfig(client: VpnClient, server: ServerConfig): string {
  const config = {
    "outbounds": [
      {
        "type": "vless",
        "tag": "VLESS-Reality",
        "server": server.ip || "YOUR_VPS_IP",
        "server_port": server.port,
        "uuid": client.uuid,
        "flow": client.flow === "xtls-r-vless" ? "xtls-r-vless" : "",
        "packet_encoding": "xudp",
        "tls": {
          "enabled": true,
          "server_name": server.sni,
          "utls": {
            "enabled": true,
            "fingerprint": "chrome"
          },
          "reality": {
            "enabled": true,
            "public_key": server.publicKey,
            "short_id": server.shortId
          }
        }
      },
      {
        "type": "direct",
        "tag": "direct"
      },
      {
        "type": "dns",
        "tag": "dns-out"
      }
    ],
    "route": {
      "rules": [
        {
          "protocol": "dns",
          "outbound": "dns-out"
        }
      ]
    }
  };
  return JSON.stringify(config, null, 2);
}

// Generate complete Server Config for Xray-core
export function generateServerXrayConfig(clients: VpnClient[], server: ServerConfig): string {
  const activeClients = clients.filter(c => c.isActive);
  
  const xrayClients = activeClients.map(c => {
    const item: any = {
      "id": c.uuid,
      "email": `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@vless.reality`
    };
    if (c.flow === 'xtls-r-vless') {
      item["flow"] = "xtls-r-vless";
    }
    return item;
  });

  const config = {
    "log": {
      "loglevel": "warning",
      "access": "/var/log/xray/access.log",
      "error": "/var/log/xray/error.log"
    },
    "inbounds": [
      {
        "port": server.port,
        "protocol": "vless",
        "settings": {
          "clients": xrayClients,
          "decryption": "none"
        },
        "streamSettings": {
          "network": "tcp",
          "security": "reality",
          "realitySettings": {
            "show": false,
            "dest": `${server.sni}:443`,
            "xver": 0,
            "serverNames": [
              server.sni
            ],
            "privateKey": server.privateKey,
            "minClientVer": "",
            "maxClientVer": "",
            "maxTimeDiff": 0,
            "shortIds": [
              server.shortId
            ]
          }
        }
      }
    ],
    "outbounds": [
      {
        "protocol": "freedom",
        "tag": "direct"
      },
      {
        "protocol": "blackhole",
        "tag": "block"
      }
    ]
  };

  return JSON.stringify(config, null, 2);
}

// Generate shell script to install Xray-core and configure it with VLESS + Reality automatically
export function generateBashScript(clients: VpnClient[], server: ServerConfig): string {
  const configJson = generateServerXrayConfig(clients, server);
  
  return `#!/bin/bash

# ====================================================================
# Автоматическая установка VLESS + Reality от VLESS Reality Panel
# Сгенерировано: ${new Date().toLocaleDateString('ru-RU')}
# ====================================================================

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
  echo -e "\\e[31mОшибка: Этот скрипт должен быть запущен от имени root!\\e[0m"
  exit 1
fi

echo -e "\\e[34m[1/5]\\e[0m Обновление системы и установка зависимостей..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl jq uuid-runtime unzip systemd

echo -e "\\e[34m[2/5]\\e[0m Установка Xray-core (официальный скрипт)..."
bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install

echo -e "\\e[34m[3/5]\\e[0m Создание конфигурационного файла Xray..."
mkdir -p /usr/local/etc/xray
mkdir -p /var/log/xray

cat << 'EOF' > /usr/local/etc/xray/config.json
${configJson}
EOF

echo -e "\\e[34m[4/5]\\e[0m Настройка брандмауэра (открытие порта ${server.port})..."
if command -v ufw >/dev/null; then
  ufw allow ${server.port}/tcp
  ufw reload
elif command -v firewall-cmd >/dev/null; then
  firewall-cmd --add-port=${server.port}/tcp --permanent
  firewall-cmd --reload
fi

# Настройка BBR для ускорения TCP (крайне рекомендуется для VPN)
echo -e "\\e[34m[4.5/5]\\e[0m Оптимизация сетевого стека (BBR)..."
if ! sysctl net.ipv4.tcp_congestion_control | grep -q bbr; then
  echo "net.core.default_qdisc=fq" >> /etc/sysctl.conf
  echo "net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf
  sysctl -p
fi

echo -e "\\e[34m[5/5]\\e[0m Запуск и добавление Xray в автозагрузку..."
systemctl daemon-reload
systemctl enable xray
systemctl restart xray

# Проверка статуса службы
if systemctl is-active --quiet xray; then
  echo -e "\\e[32m============================================================\\e[0m"
  echo -e "\\e[32mУстановка успешно завершена! Xray VLESS + Reality запущен.\\e[0m"
  echo -e "Порт: \\e[36m${server.port}\\e[0m"
  echo -e "Домен маскировки (SNI): \\e[36m${server.sni}\\e[0m"
  echo -e "Публичный ключ (PBK): \\e[36m${server.publicKey}\\e[0m"
  echo -e "Короткий ID (ShortID): \\e[36m${server.shortId}\\e[0m"
  echo -e "\\e[32m============================================================\\e[0m"
else
  echo -e "\\e[31mОшибка: служба xray не смогла запуститься. Проверьте логи: journalctl -u xray --no-pager\\e[0m"
fi
`;
}
