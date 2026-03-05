import { useState } from 'react';
import CustomerApp from './CustomerApp';
import MerchantApp from './MerchantApp';
import AdminApp from './AdminApp';

export default function App() {
  const [view, setView] = useState<'customer' | 'merchant' | 'admin'>('customer');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Global App Switcher (For Demo Purposes) */}
      <div className="bg-slate-900 text-white p-3 flex justify-center space-x-2 shadow-md z-50 relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hidden sm:block">
          CYPRUS TOURISM MVP
        </span>
        <button 
          onClick={() => setView('customer')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${view === 'customer' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          Customer App
        </button>
        <button 
          onClick={() => setView('merchant')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${view === 'merchant' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          Merchant POS
        </button>
        <button 
          onClick={() => setView('admin')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${view === 'admin' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          Admin Dashboard
        </button>
      </div>

      {/* Render Active View */}
      <div className="flex-1 flex justify-center overflow-auto">
        {view === 'customer' && <CustomerApp />}
        {view === 'merchant' && <MerchantApp />}
        {view === 'admin' && <AdminApp />}
      </div>
    </div>
  );
}
