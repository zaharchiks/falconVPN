import { CheckCircle2, XCircle, Clock, Check, X, ShieldAlert } from 'lucide-react';

interface Payment {
  id: string;
  clientId: string;
  clientName: string;
  planId: string;
  planName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  telegramUsername?: string;
}

interface PaymentsTabProps {
  lang: 'RU' | 'EN';
  payments: Payment[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export function PaymentsTab({ lang, payments, onApprove, onReject }: PaymentsTabProps) {
  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
            <CheckCircle2 size={10} />
            <span>{lang === 'RU' ? 'Одобрен' : 'Approved'}</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-red-400 bg-red-950/40 border border-red-500/20 px-2 py-0.5 rounded">
            <XCircle size={10} />
            <span>{lang === 'RU' ? 'Отклонен' : 'Rejected'}</span>
          </span>
        );
      case 'pending':
        default:
        return (
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded animate-pulse">
            <Clock size={10} />
            <span>{lang === 'RU' ? 'Ожидает' : 'Pending'}</span>
          </span>
        );
    }
  };

  return (
    <div id="payments-audit-tab" className="space-y-4">
      <div className="border-b border-slate-850 pb-2">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider font-display flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-cyan-400" />
          {lang === 'RU' ? 'Аудит платежей и активации' : 'Payment Audits & Activations'}
        </h2>
        <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
          {lang === 'RU' ? 'Подтвердите переводы пользователей из Telegram для автоматической активации их доступа' : 'Confirm financial transfers from Telegram customers to trigger automated keys delivery'}
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850">
              <tr>
                <th className="px-4 py-3">{lang === 'RU' ? 'Пользователь / Telegram' : 'Client / Telegram'}</th>
                <th className="px-4 py-3">{lang === 'RU' ? 'Тарифный план' : 'Plan Requested'}</th>
                <th className="px-4 py-3">{lang === 'RU' ? 'Сумма' : 'Amount'}</th>
                <th className="px-4 py-3">{lang === 'RU' ? 'Дата заявки' : 'Applied Date'}</th>
                <th className="px-4 py-3">{lang === 'RU' ? 'Статус' : 'Status'}</th>
                <th className="px-4 py-3 text-right">{lang === 'RU' ? 'Действия' : 'Action Review'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-sans">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/50 transition">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-bold text-white">{p.clientName}</p>
                      {p.telegramUsername ? (
                        <p className="text-[10px] text-cyan-400 font-mono">@{p.telegramUsername}</p>
                      ) : (
                        <p className="text-[10px] text-slate-500 font-mono">—</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-200">{p.planName}</span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-cyan-300">
                    {p.amount} ₽
                  </td>
                  <td className="px-4 py-3 text-[10px] text-slate-400 font-mono">
                    {new Date(p.createdAt).toLocaleString(lang === 'RU' ? 'ru-RU' : 'en-US')}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(p.status)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onApprove(p.id)}
                          className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider px-2 py-1 rounded cursor-pointer transition shadow"
                        >
                          <Check size={11} />
                          <span>{lang === 'RU' ? 'Одобрить' : 'Approve'}</span>
                        </button>
                        <button
                          onClick={() => onReject(p.id)}
                          className="flex items-center gap-1 bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 font-bold text-[10px] uppercase tracking-wider px-2 py-1 rounded cursor-pointer transition border border-slate-750 hover:border-red-500/20"
                        >
                          <X size={11} />
                          <span>{lang === 'RU' ? 'Отклонить' : 'Reject'}</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">{lang === 'RU' ? 'Проверено' : 'Audited'}</span>
                    )}
                  </td>
                </tr>
              ))}

              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-xs text-slate-500">
                    {lang === 'RU' ? 'История платежей пуста. Заявки из Telegram появятся здесь.' : 'No billing transfers logged yet. Incoming purchases will display here.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
