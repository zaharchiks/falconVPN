import React, { useState } from 'react';
import { Send, Check, Settings, Sparkles, HelpCircle, AlertCircle } from 'lucide-react';
import { BotConfig } from '../types';

interface BotTabProps {
  lang: 'RU' | 'EN';
  botConfig: BotConfig;
  onSaveBotConfig: (config: BotConfig) => Promise<void>;
  showToast: (msg: string) => void;
}

export function BotTab({ lang, botConfig, onSaveBotConfig, showToast }: BotTabProps) {
  const [token, setToken] = useState(botConfig.token);
  const [welcomeRu, setWelcomeRu] = useState(botConfig.welcomeMessageRu);
  const [welcomeEn, setWelcomeEn] = useState(botConfig.welcomeMessageEn);
  const [payDetails, setPayDetails] = useState(botConfig.paymentDetails);
  const [isEnabled, setIsEnabled] = useState(botConfig.isEnabled);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSaveBotConfig({
        token,
        welcomeMessageRu: welcomeRu,
        welcomeMessageEn: welcomeEn,
        paymentDetails: payDetails,
        isEnabled
      });
      showToast(lang === 'RU' ? 'Настройки Telegram-бота успешно сохранены!' : 'Telegram Bot settings saved successfully!');
    } catch (err) {
      console.error(err);
      showToast(lang === 'RU' ? 'Ошибка при сохранении' : 'Error saving config');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="telegram-bot-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Settings Form */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-4">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider font-display border-b border-slate-850 pb-2 flex items-center gap-1.5">
          <Settings size={14} className="text-cyan-400" />
          {lang === 'RU' ? 'Настройки Telegram-бота' : 'Telegram Bot Settings'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between bg-[#080B11]/50 p-3 rounded-lg border border-slate-850">
            <div>
              <p className="text-xs font-bold text-slate-200">
                {lang === 'RU' ? 'Активность бота' : 'Bot Active Status'}
              </p>
              <p className="text-[10px] text-slate-400">
                {lang === 'RU' ? 'Включить или отключить обработку команд в Telegram' : 'Enable or disable processing commands in Telegram'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEnabled(!isEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${isEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-slate-950 absolute top-1 transition-transform ${isEnabled ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">
              {lang === 'RU' ? 'API Токен (от @BotFather)' : 'API Token (from @BotFather)'}
            </label>
            <input
              type="password"
              placeholder="e.g. 1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">
              {lang === 'RU' ? 'Приветствие (RU)' : 'Welcome Message (RU)'}
            </label>
            <textarea
              rows={3}
              value={welcomeRu}
              onChange={(e) => setWelcomeRu(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition leading-normal"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">
              {lang === 'RU' ? 'Приветствие (EN)' : 'Welcome Message (EN)'}
            </label>
            <textarea
              rows={3}
              value={welcomeEn}
              onChange={(e) => setWelcomeEn(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition leading-normal"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">
              {lang === 'RU' ? 'Реквизиты и Инструкции по Оплате' : 'Payment Details & Instructions'}
            </label>
            <textarea
              rows={4}
              value={payDetails}
              onChange={(e) => setPayDetails(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-cyan-500 transition leading-normal"
              placeholder="e.g. 💳 Сбербанк: 4276..."
            />
            <p className="text-[9px] text-slate-500 leading-normal">
              {lang === 'RU' ? '* Поддерживает разметку Markdown. Этот текст показывается пользователю при выборе тарифа для оплаты.' : '* Supports Markdown formatting. This text is displayed to the user when they choose a plan to purchase.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-750 disabled:text-slate-500 text-slate-950 font-bold text-xs py-2 rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 shadow-md"
          >
            <Send size={12} />
            <span>{isSubmitting ? (lang === 'RU' ? 'Сохранение...' : 'Saving...') : (lang === 'RU' ? 'Сохранить настройки' : 'Save Settings')}</span>
          </button>
        </form>
      </div>

      {/* Bot Diagnostic and Tutorial Card */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Diagnostic Status Card */}
        <div className="bg-slate-900 border border-slate-850 rounded-xl p-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display mb-3">
            {lang === 'RU' ? 'Диагностика бота' : 'Bot Diagnostics'}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 p-2.5 bg-[#080B11]/50 border border-slate-850 rounded-lg">
              <div className={`h-2.5 w-2.5 rounded-full ${isEnabled && token ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <div>
                <p className="text-[11px] font-bold text-white leading-none">
                  {isEnabled && token ? (lang === 'RU' ? 'Бот запущен и опрашивает API' : 'Bot is active & polling Telegram') : (lang === 'RU' ? 'Бот остановлен / Ожидает токен' : 'Bot is inactive / Missing token')}
                </p>
                <p className="text-[9px] text-slate-400 mt-1">
                  {isEnabled && token ? (lang === 'RU' ? 'Ошибок связи с серверами Telegram нет.' : 'No communication issues with Telegram.') : (lang === 'RU' ? 'Введите API токен слева и включите активность.' : 'Enter your API token on the left and enable active status.')}
                </p>
              </div>
            </div>

            <div className="p-3 bg-cyan-950/20 border border-cyan-500/15 rounded-lg space-y-1.5">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-1">
                <Sparkles size={11} />
                {lang === 'RU' ? 'Как устроен процесс продаж' : 'Automated Sales Pipeline'}
              </span>
              <ol className="list-decimal pl-3.5 text-[10px] text-slate-400 space-y-1 leading-normal">
                <li>{lang === 'RU' ? 'Пользователь нажимает "/start" в боте и выбирает тариф' : 'User runs "/start" and picks a subscription plan'}</li>
                <li>{lang === 'RU' ? 'Бот выдает ваши реквизиты, юзер оплачивает и нажимает "Я оплатил"' : 'Bot displays payment credentials, user transfers money, and hits "I paid"'}</li>
                <li>{lang === 'RU' ? 'В панели (вкладка "Платежи") появляется мигающий красный индикатор' : 'Dashboard displays a blinking notification on the "Payments" tab'}</li>
                <li>{lang === 'RU' ? 'Вы одобряете платеж: панель генерирует ключ и отправляет его боту' : 'You approve the transfer: panel issues their keys and pushes it to their Telegram chatId'}</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Setup Tutorial */}
        <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-3 text-xs leading-normal">
          <h3 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs font-display">
            <HelpCircle size={14} className="text-cyan-400" />
            {lang === 'RU' ? 'Инструкция по созданию бота' : 'How to Create a Telegram Bot'}
          </h3>
          <ul className="space-y-2 text-[10px] text-slate-400 pl-1">
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold">1.</span>
              <span>{lang === 'RU' ? 'Найдите в Telegram официального бота @BotFather.' : 'Find @BotFather on Telegram.'}</span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold">2.</span>
              <span>{lang === 'RU' ? 'Отправьте команду /newbot и следуйте подсказкам: введите имя бота и юзернейм (оканчивающийся на "bot").' : 'Send /newbot and provide a display name and a unique username ending in "bot".'}</span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold">3.</span>
              <span>{lang === 'RU' ? 'Скопируйте полученный API токен (длинная строка букв и цифр).' : 'Copy the generated HTTP API access token.'}</span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400 font-bold">4.</span>
              <span>{lang === 'RU' ? 'Вставьте токен в форму слева, включите активность бота и нажмите кнопку сохранения.' : 'Paste the token into the field on the left, activate, and click Save Settings.'}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
