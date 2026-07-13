import React, { useState } from 'react';
import { Plus, Edit, Trash2, Layers, Check, X, Sparkles, AlertCircle } from 'lucide-react';
import { SubscriptionPlan } from '../types';

interface PlansTabProps {
  lang: 'RU' | 'EN';
  plans: SubscriptionPlan[];
  onCreatePlan: (plan: Omit<SubscriptionPlan, 'id'>) => Promise<void>;
  onUpdatePlan: (id: string, plan: Partial<SubscriptionPlan>) => Promise<void>;
  onDeletePlan: (id: string) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'info') => void;
}

export function PlansTab({
  lang,
  plans,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
  showToast
}: PlansTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [limitTraffic, setLimitTraffic] = useState(150);
  const [isUnlimitedTraffic, setIsUnlimitedTraffic] = useState(false);
  const [price, setPrice] = useState(300);
  const [description, setDescription] = useState('');

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setName('');
    setDuration(30);
    setLimitTraffic(150);
    setIsUnlimitedTraffic(false);
    setPrice(300);
    setDescription('');
    setModalOpen(true);
  };

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setDuration(plan.durationDays);
    setLimitTraffic(plan.limitTrafficGb);
    setIsUnlimitedTraffic(plan.limitTrafficGb === 0);
    setPrice(plan.priceRub);
    setDescription(plan.description);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast(lang === 'RU' ? 'Введите название тарифа!' : 'Enter plan name!', 'info');
      return;
    }

    try {
      const planData = {
        name,
        durationDays: Number(duration),
        limitTrafficGb: isUnlimitedTraffic ? 0 : Number(limitTraffic),
        priceRub: Number(price),
        description
      };

      if (editingPlan) {
        await onUpdatePlan(editingPlan.id, planData);
        showToast(lang === 'RU' ? `Тариф "${name}" успешно сохранен` : `Plan "${name}" updated successfully`);
      } else {
        await onCreatePlan(planData);
        showToast(lang === 'RU' ? `Тариф "${name}" создан!` : `Plan "${name}" created!`);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast(lang === 'RU' ? 'Ошибка сохранения' : 'Error saving plan');
    }
  };

  const handleDelete = async (id: string, planName: string) => {
    if (window.confirm(lang === 'RU' ? `Вы уверены, что хотите удалить тарифный план "${planName}"?` : `Are you sure you want to delete subscription plan "${planName}"?`)) {
      try {
        await onDeletePlan(id);
        showToast(lang === 'RU' ? `Тариф "${planName}" удален` : `Plan "${planName}" deleted`);
      } catch (err) {
        console.error(err);
        showToast(lang === 'RU' ? 'Ошибка удаления' : 'Error deleting plan');
      }
    }
  };

  return (
    <div id="vless-plans-tab" className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider font-display flex items-center gap-1.5">
            <Layers size={14} className="text-cyan-400" />
            {lang === 'RU' ? 'Управление тарифами подписок' : 'Subscription Plan Management'}
          </h2>
          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
            {lang === 'RU' ? 'Настройте сроки доступа, лимиты трафика и цены для ваших клиентов' : 'Configure durations, traffic quotas, and price variables for your customers'}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded cursor-pointer transition shadow-sm"
        >
          <Plus size={11} />
          <span>{lang === 'RU' ? 'Добавить тариф' : 'Add Plan'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-slate-800 transition duration-200">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white font-display group-hover:text-cyan-400 transition">
                    {p.name}
                  </h3>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 block mt-0.5">
                    {p.id}
                  </span>
                </div>
                <p className="text-base font-extrabold text-cyan-400 font-mono">
                  {p.priceRub} <span className="text-[10px] font-sans font-medium text-slate-400">₽</span>
                </p>
              </div>

              <div className="space-y-1 bg-[#080B11]/50 border border-slate-850 p-2.5 rounded-lg text-[10px] font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">{lang === 'RU' ? 'Срок действия:' : 'Duration:'}</span>
                  <span className="text-slate-200 font-bold">{p.durationDays} {lang === 'RU' ? 'дн.' : 'days'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{lang === 'RU' ? 'Лимит трафика:' : 'Traffic Limit:'}</span>
                  <span className="text-slate-200 font-bold">
                    {p.limitTrafficGb === 0 ? (lang === 'RU' ? 'Безлимит' : 'Unlimited') : `${p.limitTrafficGb} GB`}
                  </span>
                </div>
              </div>

              {p.description && (
                <p className="text-[10px] text-slate-400 leading-normal min-h-[30px]">
                  {p.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-850 mt-4 pt-3 shrink-0">
              <button
                onClick={() => handleOpenEdit(p)}
                className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded cursor-pointer transition border border-slate-700/50"
                title={lang === 'RU' ? 'Редактировать' : 'Edit'}
              >
                <Edit size={12} />
              </button>
              <button
                onClick={() => handleDelete(p.id, p.name)}
                className="p-1.5 bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 rounded cursor-pointer transition border border-slate-700/50 hover:border-red-500/20"
                title={lang === 'RU' ? 'Удалить' : 'Delete'}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}

        {plans.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-slate-500">
            {lang === 'RU' ? 'У вас пока не добавлено ни одного тарифного плана. Создайте первый!' : 'No subscription plans configured yet. Create one!'}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-xl p-4 shadow-2xl relative">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-850 mb-4">
              <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-white">
                {editingPlan ? (lang === 'RU' ? 'Редактировать тариф' : 'Edit Plan') : (lang === 'RU' ? 'Создать тарифный план' : 'Add Subscription Plan')}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">
                  {lang === 'RU' ? 'Название тарифа' : 'Plan Name'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Standard — 30 дней"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">
                    {lang === 'RU' ? 'Длительность (дней)' : 'Duration (Days)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">
                    {lang === 'RU' ? 'Цена (₽ / RUB)' : 'Price (RUB)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div className="bg-[#080B11]/50 p-3 rounded-lg border border-slate-850 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      {lang === 'RU' ? 'Безлимитный трафик' : 'Unlimited Traffic'}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {lang === 'RU' ? 'Нет ограничений по объему потребления' : 'No byte caps placed on the customer'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUnlimitedTraffic(!isUnlimitedTraffic)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${isUnlimitedTraffic ? 'bg-cyan-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${isUnlimitedTraffic ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>

                {!isUnlimitedTraffic && (
                  <div className="space-y-1 pt-2 border-t border-slate-850 animate-fade-in">
                    <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">
                      {lang === 'RU' ? 'Лимит трафика (ГБ / GB)' : 'Traffic limit (GB)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={limitTraffic}
                      onChange={(e) => setLimitTraffic(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider font-bold font-mono text-slate-400">
                  {lang === 'RU' ? 'Описание тарифа' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Подходит для фонового серфинга..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition leading-normal"
                />
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
    </div>
  );
}
