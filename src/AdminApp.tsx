import { useState, useEffect } from 'react';
import { useApi } from './hooks/useAuth';
import { LayoutDashboard, Users, Store, Settings, TrendingUp, DollarSign, Activity, CheckCircle2, XCircle, Loader2, Clock, AlertCircle } from 'lucide-react';

export default function AdminApp() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Settings form
  const [editFee, setEditFee] = useState('');
  const [editMinDiscount, setEditMinDiscount] = useState('');
  const [editMaxDiscount, setEditMaxDiscount] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Merchant fee edit
  const [editingMerchant, setEditingMerchant] = useState<string | null>(null);
  const [merchantFee, setMerchantFee] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [statsRes, txRes] = await Promise.all([
          api('/api/admin/stats'),
          api('/api/admin/transactions?limit=5'),
        ]);
        if (statsRes.ok) setStats((await statsRes.json()).stats);
        if (txRes.ok) {
          const txData = await txRes.json();
          setTransactions(txData.transactions);
        }
      } else if (activeTab === 'merchants') {
        const res = await api('/api/admin/merchants');
        if (res.ok) setMerchants((await res.json()).merchants);
      } else if (activeTab === 'users') {
        const res = await api('/api/admin/customers');
        if (res.ok) setCustomers((await res.json()).customers);
      } else if (activeTab === 'settings') {
        const res = await api('/api/admin/settings');
        if (res.ok) {
          const data = (await res.json()).settings;
          setSettings(data);
          setEditFee(String(data.defaultPlatformFee));
          setEditMinDiscount(String(data.minimumDiscountRate));
          setEditMaxDiscount(String(data.maximumDiscountRate));
        }
      }
    } catch {}
    setLoading(false);
  };

  const updateMerchantStatus = async (id: string, status: string) => {
    try {
      const res = await api(`/api/admin/merchants/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (res.ok) loadData();
    } catch {}
  };

  const updateMerchantFee = async (id: string) => {
    try {
      const res = await api(`/api/admin/merchants/${id}/fee`, {
        method: 'PUT',
        body: JSON.stringify({ platformFeeRate: parseFloat(merchantFee) }),
      });
      if (res.ok) {
        setEditingMerchant(null);
        loadData();
      }
    } catch {}
  };

  const saveSettings = async () => {
    setSaveLoading(true);
    setSaveMsg('');
    try {
      const res = await api('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          defaultPlatformFee: parseFloat(editFee),
          minimumDiscountRate: parseFloat(editMinDiscount),
          maximumDiscountRate: parseFloat(editMaxDiscount),
        }),
      });
      if (res.ok) {
        setSaveMsg('Settings saved successfully');
        loadData();
      } else {
        setSaveMsg('Failed to save settings');
      }
    } catch {
      setSaveMsg('Network error');
    }
    setSaveLoading(false);
  };

  const statusColors: Record<string, string> = {
    APPROVED: 'bg-emerald-100 text-emerald-800',
    PENDING: 'bg-amber-100 text-amber-800',
    REJECTED: 'bg-red-100 text-red-800',
    SUSPENDED: 'bg-slate-100 text-slate-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    FAILED: 'bg-red-100 text-red-800',
  };

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
          {[
            { id: 'overview', icon: Activity, label: 'Overview' },
            { id: 'merchants', icon: Store, label: 'Merchants' },
            { id: 'users', icon: Users, label: 'Tourists' },
            { id: 'settings', icon: Settings, label: 'Platform Settings' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon className="w-4 h-4 mr-3" /> {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-50">
        {[
          { id: 'overview', icon: Activity, label: 'Overview' },
          { id: 'merchants', icon: Store, label: 'Merchants' },
          { id: 'users', icon: Users, label: 'Tourists' },
          { id: 'settings', icon: Settings, label: 'Settings' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex-1 py-3 flex flex-col items-center text-[10px] font-medium ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <item.icon className="w-5 h-5 mb-1" /> {item.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto pb-20 md:pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {activeTab === 'overview' && stats && (
              <>
                <header className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Platform Overview</h2>
                    <p className="text-slate-500 text-sm mt-1">Cyprus Tourism Marketplace</p>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-600 flex items-center shadow-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                    System Operational
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Total Volume', value: `\u20AC${stats.totalVolume.toLocaleString()}`, icon: DollarSign, color: 'emerald' },
                    { label: 'Platform Revenue', value: `\u20AC${stats.totalPlatformRevenue.toLocaleString()}`, icon: TrendingUp, color: 'indigo' },
                    { label: 'Active Merchants', value: stats.activeMerchants, icon: Store, color: 'orange', sub: stats.pendingMerchants > 0 ? `${stats.pendingMerchants} pending` : undefined },
                    { label: 'Total Tourists', value: stats.totalCustomers, icon: Users, color: 'cyan' },
                  ].map((card) => (
                    <div key={card.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-slate-500 font-medium text-xs">{card.label}</h3>
                        <div className={`w-9 h-9 bg-${card.color}-50 rounded-full flex items-center justify-center`}>
                          <card.icon className={`w-4 h-4 text-${card.color}-600`} />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                      {card.sub && <p className="text-xs text-amber-600 mt-1 font-medium">{card.sub}</p>}
                    </div>
                  ))}
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Recent Transactions</h3>
                    <span className="text-xs text-slate-400">{stats.totalTransactions} total</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="p-4 font-medium">Merchant</th>
                          <th className="p-4 font-medium">Customer</th>
                          <th className="p-4 font-medium">Amount</th>
                          <th className="p-4 font-medium">Platform Fee</th>
                          <th className="p-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {transactions.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-slate-400">No transactions yet</td></tr>
                        ) : (
                          transactions.map((tx: any) => (
                            <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-medium text-slate-800">{tx.merchant?.businessName}</td>
                              <td className="p-4 text-slate-600">
                                {tx.customer?.user ? `${tx.customer.user.firstName} ${tx.customer.user.lastName}` : '-'}
                              </td>
                              <td className="p-4 text-slate-600">&euro;{tx.finalAmount.toFixed(2)}</td>
                              <td className="p-4 text-indigo-600 font-medium">&euro;{tx.platformFee.toFixed(2)}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[tx.status] || 'bg-slate-100 text-slate-800'}`}>
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* MERCHANTS */}
            {activeTab === 'merchants' && (
              <>
                <header className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-800">Merchant Management</h2>
                  <p className="text-slate-500 text-sm mt-1">Approve, manage, and configure merchants</p>
                </header>

                <div className="space-y-4">
                  {merchants.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                      <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No merchants registered yet</p>
                    </div>
                  ) : (
                    merchants.map((m: any) => (
                      <div key={m.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-slate-800 text-lg">{m.businessName}</h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[m.status] || 'bg-slate-100'}`}>
                                {m.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-sm">
                              <div>
                                <span className="text-slate-400">Type:</span>{' '}
                                <span className="text-slate-700">{m.businessType}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">City:</span>{' '}
                                <span className="text-slate-700">{m.city}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Discount:</span>{' '}
                                <span className="text-emerald-600 font-medium">{m.discountRate}%</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Platform Fee:</span>{' '}
                                <span className="text-indigo-600 font-medium">{m.platformFeeRate ?? 'Default'}%</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Owner:</span>{' '}
                                <span className="text-slate-700">{m.user?.firstName} {m.user?.lastName}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Email:</span>{' '}
                                <span className="text-slate-700">{m.user?.email}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Transactions:</span>{' '}
                                <span className="text-slate-700">{m._count?.transactions || 0}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {m.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => updateMerchantStatus(m.id, 'APPROVED')}
                                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Approve
                                </button>
                                <button
                                  onClick={() => updateMerchantStatus(m.id, 'REJECTED')}
                                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors flex items-center gap-1"
                                >
                                  <XCircle className="w-4 h-4" /> Reject
                                </button>
                              </>
                            )}
                            {m.status === 'APPROVED' && (
                              <button
                                onClick={() => updateMerchantStatus(m.id, 'SUSPENDED')}
                                className="px-4 py-2 bg-amber-100 text-amber-800 text-sm font-medium rounded-xl hover:bg-amber-200 transition-colors"
                              >
                                Suspend
                              </button>
                            )}
                            {m.status === 'SUSPENDED' && (
                              <button
                                onClick={() => updateMerchantStatus(m.id, 'APPROVED')}
                                className="px-4 py-2 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-xl hover:bg-emerald-200 transition-colors"
                              >
                                Reactivate
                              </button>
                            )}

                            {/* Custom fee */}
                            {editingMerchant === m.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={merchantFee}
                                  onChange={(e) => setMerchantFee(e.target.value)}
                                  min="2"
                                  max="15"
                                  step="0.5"
                                  className="w-20 border border-slate-200 rounded-lg px-2 py-2 text-sm"
                                  placeholder="%"
                                />
                                <button
                                  onClick={() => updateMerchantFee(m.id)}
                                  className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingMerchant(null)}
                                  className="px-3 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditingMerchant(m.id); setMerchantFee(String(m.platformFeeRate || 10)); }}
                                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
                              >
                                Set Fee
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* TOURISTS/CUSTOMERS */}
            {activeTab === 'users' && (
              <>
                <header className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-800">Tourist Accounts</h2>
                  <p className="text-slate-500 text-sm mt-1">All registered tourists and their contract status</p>
                </header>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="p-4 font-medium">Name</th>
                          <th className="p-4 font-medium">Email</th>
                          <th className="p-4 font-medium">Contract</th>
                          <th className="p-4 font-medium">Agency</th>
                          <th className="p-4 font-medium">Valid Until</th>
                          <th className="p-4 font-medium">Transactions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {customers.length === 0 ? (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-400">No tourists registered yet</td></tr>
                        ) : (
                          customers.map((c: any) => (
                            <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-medium text-slate-800">{c.user?.firstName} {c.user?.lastName}</td>
                              <td className="p-4 text-slate-600">{c.user?.email}</td>
                              <td className="p-4">
                                {c.contract ? (
                                  <span className="font-mono text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg">
                                    {c.contract.contractNumber}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs">No contract</span>
                                )}
                              </td>
                              <td className="p-4 text-slate-600">{c.contract?.agencyName || '-'}</td>
                              <td className="p-4">
                                {c.contract ? (
                                  <span className={`text-xs ${new Date(c.contract.endDate) > new Date() ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {new Date(c.contract.endDate).toLocaleDateString()}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="p-4 text-slate-600">{c._count?.transactions || 0}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* SETTINGS */}
            {activeTab === 'settings' && settings && (
              <>
                <header className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-800">Platform Settings</h2>
                  <p className="text-slate-500 text-sm mt-1">Configure global platform parameters</p>
                </header>

                <div className="max-w-lg">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Default Platform Fee (%)</label>
                      <input
                        type="number"
                        value={editFee}
                        onChange={(e) => setEditFee(e.target.value)}
                        min="2"
                        max="15"
                        step="0.5"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <p className="text-xs text-slate-500 mt-1">Applied to merchants without a custom fee (2-15%)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Minimum Discount Rate (%)</label>
                      <input
                        type="number"
                        value={editMinDiscount}
                        onChange={(e) => setEditMinDiscount(e.target.value)}
                        min="1"
                        max="50"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <p className="text-xs text-slate-500 mt-1">Minimum discount merchants must offer</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Maximum Discount Rate (%)</label>
                      <input
                        type="number"
                        value={editMaxDiscount}
                        onChange={(e) => setEditMaxDiscount(e.target.value)}
                        min="5"
                        max="50"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    {saveMsg && (
                      <div className={`text-sm p-3 rounded-xl ${saveMsg.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {saveMsg}
                      </div>
                    )}

                    <button
                      onClick={saveSettings}
                      disabled={saveLoading}
                      className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {saveLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
