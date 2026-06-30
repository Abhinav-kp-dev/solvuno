import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Shield, Sparkles, Zap, MapPin, CheckCircle2 } from 'lucide-react';

const SHOP_ITEMS = [
  {
    id: 'glow',
    name: 'Neon Name Glow',
    price: 250,
    summary: 'Add a striking neon green text shadow to your username on the Leaderboard.',
    icon: Sparkles,
    color: 'text-green-500'
  },
  {
    id: 'badge',
    name: 'Elite Sentinel Title',
    price: 500,
    summary: 'Unlock the exclusive [ elite_sentinel ] title to display under your name.',
    icon: Shield,
    color: 'text-amber-500'
  },
  {
    id: 'border',
    name: 'Premium Avatar Frame',
    price: 750,
    summary: 'Equip a glowing amber dual-ring frame around your profile picture in the feed.',
    icon: Zap,
    color: 'text-purple-500'
  }
];

export default function CivicShop() {
  const { currentUser, purchaseShopItem } = useAppContext();
  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  const handlePurchase = async (itemId: string, price: number) => {
    if (currentUser?.unlockedAssets?.includes(itemId)) {
      setToastMessage({ text: 'Item already owned!', type: 'error' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const { success, message } = await purchaseShopItem(itemId, price);
    if (success) {
      setToastMessage({ text: 'Purchase successful!', type: 'success' });
    } else {
      setToastMessage({ text: message || 'Transaction failed', type: 'error' });
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!currentUser) return null;

  return (
    <div className="w-full h-full flex flex-col p-8 overflow-y-auto custom-scrollbar relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`absolute top-8 right-8 px-4 py-3.5 font-sans text-sm font-semibold rounded-xl shadow-xl flex items-center gap-2 z-50 ${
          toastMessage.type === 'success' 
            ? 'border border-green-200 bg-green-50 text-green-800' 
            : 'border border-red-200 bg-red-50 text-red-800'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle2 size={14} className="text-green-600" />}
          {toastMessage.text}
        </div>
      )}

      {/* Header */}
      <header className="mb-10 flex items-end justify-between">
        <div>
          <h2 className="font-serif text-[2.5rem] font-bold text-civic-ink dark:text-white leading-none mb-2">Civic Bazaar</h2>
          <div className="font-mono text-[0.7rem] uppercase tracking-[0.15em] text-civic-muted">Bounty Rewards Protocol // V 1.0</div>
        </div>
        <div className="font-mono text-sm uppercase tracking-wider text-civic-ink dark:text-white bg-civic-surface dark:bg-[#1e1e1e] border border-civic-border dark:border-zinc-800 px-4 py-2 rounded-xl shadow-sm">
          [ available_balance: <span className="text-civic-accent font-bold">{currentUser.capturedBP} BP</span> ]
        </div>
      </header>

      {/* Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {SHOP_ITEMS.map((item) => {
          const isOwned = currentUser.unlockedAssets?.includes(item.id);
          return (
            <div key={item.id} className="border border-civic-border dark:border-zinc-800 bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl flex flex-col justify-between civic-card">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-civic-bg dark:bg-zinc-800 ${item.color}`}>
                    <item.icon size={24} strokeWidth={2} />
                  </div>
                  <div className="font-mono text-xs font-bold text-civic-ink dark:text-white bg-civic-bg dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-civic-border dark:border-zinc-700">
                    {item.price} BP
                  </div>
                </div>
                <h3 className="font-serif text-xl font-bold text-civic-ink dark:text-white mb-2">{item.name}</h3>
                <p className="font-sans text-sm text-civic-muted mb-6 leading-relaxed">
                  {item.summary}
                </p>
              </div>
              
              <button
                onClick={() => handlePurchase(item.id, item.price)}
                disabled={isOwned || currentUser.capturedBP < item.price}
                className={`w-full font-mono text-xs uppercase tracking-widest py-3.5 rounded-xl border transition-all duration-200 ${
                  isOwned
                    ? 'bg-civic-bg dark:bg-zinc-800 text-civic-muted border-civic-border dark:border-zinc-700 cursor-not-allowed'
                    : currentUser.capturedBP < item.price
                      ? 'bg-red-50 dark:bg-red-950/20 text-red-400 border-red-200 dark:border-red-900 cursor-not-allowed'
                      : 'bg-civic-ink dark:bg-white text-white dark:text-civic-ink border-civic-ink dark:border-white hover:bg-civic-bg hover:text-civic-ink dark:hover:bg-zinc-800 dark:hover:text-white'
                }`}
              >
                {isOwned ? '[ item_acquired ]' : '[ purchase_item ]'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
