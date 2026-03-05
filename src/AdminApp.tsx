import { useState } from 'react';
import { LayoutDashboard, Users, Store, Settings, TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function AdminApp() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex min-h-screen bg-slate-50 w-full font-sans">
      
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-6 hidden md:flex flex-col">
        <div className="flex items-center mb-10">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">SuperAdmin</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Activity className="w-4 h-4 mr-3" /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('merchants')}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'merchants' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Store className="w-4 h-4 mr-3" /> Merchants
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users className="w-4 h-4 mr-3" /> Tourists
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings className="w-4 h-4 mr-3" /> Platform Settings
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Platform Overview</h2>
            <p className="text-slate-500 text-sm mt-1">Cyprus Tourism Marketplace</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-600 flex items-center shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
              System Operational
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 font-medium text-sm">Total Volume</h3>
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">£124,500</p>
            <div className="flex items-center mt-2 text-sm text-emerald-600 font-medium">
              <TrendingUp className="w-4 h-4 mr-1" /> +14% this month
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 font-medium text-sm">Platform Revenue</h3>
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">£12,450</p>
            <p className="text-sm text-slate-500 mt-2">Avg. 10% commission</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 font-medium text-sm">Active Merchants</h3>
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                <Store className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">142</p>
            <p className="text-sm text-slate-500 mt-2">Across 4 cities</p>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Recent Transactions</h3>
            <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">Transaction ID</th>
                  <th className="p-4 font-medium">Merchant</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Platform Fee</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {[
                  { id: 'TX-9823', merchant: 'Ocean View Seafood', amount: 120.00, fee: 12.00, status: 'Completed' },
                  { id: 'TX-9822', merchant: 'Aphrodite Hills Resort', amount: 450.00, fee: 45.00, status: 'Completed' },
                  { id: 'TX-9821', merchant: 'Blue Lagoon Cruises', amount: 85.00, fee: 8.50, status: 'Completed' },
                  { id: 'TX-9820', merchant: 'Taverna Agia Napa', amount: 45.00, fee: 4.50, status: 'Completed' },
                ].map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-slate-600">{tx.id}</td>
                    <td className="p-4 font-medium text-slate-800">{tx.merchant}</td>
                    <td className="p-4 text-slate-600">£{tx.amount.toFixed(2)}</td>
                    <td className="p-4 text-indigo-600 font-medium">£{tx.fee.toFixed(2)}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
