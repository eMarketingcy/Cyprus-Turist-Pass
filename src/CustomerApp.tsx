import { useState, useEffect } from 'react';
import { useAuth, useApi } from './hooks/useAuth';
import { Car, CheckCircle2, XCircle, Loader2, MapPin, Search, Percent, ArrowRight, QrCode, Clock, History } from 'lucide-react';

export default function CustomerApp() {
  const { user, refreshUser } = useAuth();
  const api = useApi();

  const [activeTab, setActiveTab] = useState<'validate' | 'discover' | 'qr' | 'history'>('validate');
  const [contractNumber, setContractNumber] = useState('');
  const [agencyName, setAgencyName] = useState('Sixt');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Contract status
  const [contractStatus, setContractStatus] = useState<any>(null);

  // Merchants
  const [merchants, setMerchants] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantsLoading, setMerchantsLoading] = useState(false);

  // QR
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [qrData, setQrData] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Transactions
  const [transactions, setTransactions] = useState<any[]>([]);

  // Check contract status on load
  useEffect(() => {
    checkContractStatus();
  }, []);

  const checkContractStatus = async () => {
    try {
      const res = await api('/api/rental/status');
      if (res.ok) {
        const data = await res.json();
        setContractStatus(data);
        if (data.hasContract && data.isActive) {
          setActiveTab('discover');
          loadMerchants();
        }
      }
    } catch {}
  };

  const loadMerchants = async () => {
    setMerchantsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      const res = await api(`/api/merchants?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMerchants(data.merchants);
      }
    } catch {}
    setMerchantsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'discover') loadMerchants();
    if (activeTab === 'history') loadTransactions();
  }, [activeTab, searchQuery]);

  const loadTransactions = async () => {
    try {
      const res = await api('/api/payment/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
      }
    } catch {}
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await api('/api/rental/validate', {
        method: 'POST',
        body: JSON.stringify({ contractNumber, agencyName }),
      });
      const data = await res.json();
      setResult({ status: res.status, data });
      if (res.ok) {
        await refreshUser();
        await checkContractStatus();
        setTimeout(() => {
          setActiveTab('discover');
          loadMerchants();
        }, 1500);
      }
    } catch {
      setResult({ status: 500, data: { error: 'Network error' } });
    }
    setLoading(false);
  };

  const handleGenerateQR = async (merchant: any) => {
    setSelectedMerchant(merchant);
    setActiveTab('qr');
    setQrLoading(true);
    setQrData(null);

    try {
      const res = await api('/api/payment/create-qr', {
        method: 'POST',
        body: JSON.stringify({ merchantId: merchant.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setQrData(data);
      } else {
        const data = await res.json();
        setQrData({ error: data.error });
      }
    } catch {
      setQrData({ error: 'Failed to generate QR code' });
    }
    setQrLoading(false);
  };

  const hasActiveContract = contractStatus?.hasContract && contractStatus?.isActive;

  const typeColors: Record<string, string> = {
    RESTAURANT: 'bg-orange-100 text-orange-700',
    HOTEL: 'bg-blue-100 text-blue-700',
    ACTIVITY: 'bg-emerald-100 text-emerald-700',
    SPA: 'bg-purple-100 text-purple-700',
    TOUR: 'bg-cyan-100 text-cyan-700',
  };

  return (
    <div className="flex flex-col items-center p-4 font-sans w-full">
      {/* Navigation */}
      <div className="w-full max-w-md bg-white rounded-full shadow-sm mb-6 p-1 flex items-center justify-between">
        <button
          onClick={() => setActiveTab('validate')}
          className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === 'validate' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Contract
        </button>
        <button
          onClick={() => { setActiveTab('discover'); loadMerchants(); }}
          disabled={!hasActiveContract}
          className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === 'discover' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Discover
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          disabled={!selectedMerchant}
          className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === 'qr' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          My QR
        </button>
        <button
          onClick={() => setActiveTab('history')}
          disabled={!hasActiveContract}
          className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === 'history' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          History
        </button>
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">

        {/* VALIDATE TAB */}
        {activeTab === 'validate' && (
          <div>
            <div className="bg-indigo-600 p-8 text-white text-center rounded-b-[2rem]">
              <Car className="w-14 h-14 mx-auto mb-4 opacity-90" />
              <h1 className="text-2xl font-bold tracking-tight">Cyprus Tourist Pass</h1>
              <p className="text-indigo-100 mt-2 text-sm">
                {hasActiveContract
                  ? `Valid until ${new Date(contractStatus.contract.endDate).toLocaleDateString()}`
                  : 'Link your rental contract to unlock exclusive island-wide discounts'}
              </p>
            </div>

            {hasActiveContract ? (
              <div className="p-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                  <div className="flex items-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mr-2" />
                    <h3 className="font-bold text-emerald-800">Contract Active</h3>
                  </div>
                  <div className="space-y-2 text-sm text-emerald-700">
                    <p><strong>Contract:</strong> {contractStatus.contract.contractNumber}</p>
                    <p><strong>Agency:</strong> {contractStatus.contract.agencyName}</p>
                    <p><strong>Vehicle:</strong> {contractStatus.contract.vehicleClass}</p>
                    <p><strong>Valid Until:</strong> {new Date(contractStatus.contract.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setActiveTab('discover'); loadMerchants(); }}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3.5 rounded-xl transition-all flex items-center justify-center shadow-md shadow-indigo-200"
                >
                  Browse Discounts <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            ) : (
              <div className="p-6">
                <form onSubmit={handleValidate} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Rental Agency</label>
                    <select
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="Sixt">Sixt</option>
                      <option value="Hertz">Hertz</option>
                      <option value="GeoDrive">GeoDrive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Contract Number</label>
                    <input
                      type="text"
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      placeholder='e.g. TEST-12345'
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-2">* For testing, use any contract starting with "TEST"</p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !contractNumber}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md shadow-indigo-200"
                  >
                    {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Validating...</> : 'Validate Contract'}
                  </button>
                </form>

                {result && (
                  <div className={`mt-6 p-4 rounded-xl border ${result.status === 200 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start">
                      {result.status === 200 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                      )}
                      <div>
                        <h3 className={`font-medium ${result.status === 200 ? 'text-emerald-800' : 'text-red-800'}`}>
                          {result.status === 200 ? 'Contract Validated!' : 'Validation Failed'}
                        </h3>
                        <p className={`text-sm mt-1 ${result.status === 200 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {result.status === 200 ? result.data.message : result.data.error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* DISCOVER TAB */}
        {activeTab === 'discover' && (
          <div className="bg-slate-50 h-[600px] overflow-y-auto">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Partnered Spots</h2>
              <p className="text-sm text-slate-500">Exclusive discounts for your trip</p>
              <div className="mt-4 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search restaurants, hotels..."
                  className="w-full bg-slate-100 border-none rounded-full py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="p-4 space-y-4">
              {merchantsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : merchants.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No merchants found</p>
                </div>
              ) : (
                merchants.map((merchant) => (
                  <div key={merchant.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 transition-transform active:scale-[0.98]">
                    {merchant.imageUrl && (
                      <div className="h-32 w-full relative">
                        <img src={merchant.imageUrl} alt={merchant.businessName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center shadow-sm">
                          <Percent className="w-3 h-3 text-indigo-600 mr-1" />
                          <span className="text-xs font-bold text-indigo-700">{merchant.discountRate}% OFF</span>
                        </div>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-slate-800">{merchant.businessName}</h3>
                        <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md ${typeColors[merchant.businessType] || 'bg-slate-100 text-slate-500'}`}>
                          {merchant.businessType}
                        </span>
                      </div>
                      {merchant.description && (
                        <p className="text-xs text-slate-500 mb-2 line-clamp-2">{merchant.description}</p>
                      )}
                      <div className="flex items-center text-slate-500 text-sm mb-4">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        {merchant.city} - {merchant.address}
                      </div>
                      <button
                        onClick={() => handleGenerateQR(merchant)}
                        className="w-full bg-slate-900 text-white text-sm font-medium py-2.5 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors"
                      >
                        Claim Discount <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* QR CODE TAB */}
        {activeTab === 'qr' && selectedMerchant && (
          <div className="p-6 flex flex-col items-center justify-center min-h-[500px]">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Your Discount Pass</h2>
              <p className="text-slate-500 mt-2">Show this QR code to the merchant when paying</p>
            </div>

            {qrLoading ? (
              <div className="py-12">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
                <p className="text-sm text-slate-500 mt-4">Generating your pass...</p>
              </div>
            ) : qrData?.error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center w-full">
                <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-700">{qrData.error}</p>
              </div>
            ) : qrData ? (
              <>
                <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-600 rounded-tl-xl m-4"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-600 rounded-tr-xl m-4"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-600 rounded-bl-xl m-4"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-600 rounded-br-xl m-4"></div>

                  <div className="flex flex-col items-center p-4">
                    <QrCode className="w-40 h-40 text-slate-800" />
                    <p className="text-[10px] font-mono text-slate-400 mt-3 break-all max-w-[200px] text-center">
                      {qrData.qrToken?.substring(0, 20)}...
                    </p>
                  </div>
                </div>

                <div className="mt-6 text-center bg-slate-50 w-full p-4 rounded-2xl border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">Paying at</p>
                  <h3 className="font-bold text-lg text-slate-800">{qrData.merchantName}</h3>
                  <div className="inline-flex items-center mt-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold">
                    {qrData.discountRate}% Discount Applied
                  </div>
                  <div className="flex items-center justify-center mt-3 text-xs text-slate-400">
                    <Clock className="w-3 h-3 mr-1" />
                    Expires: {new Date(qrData.expiresAt).toLocaleTimeString()}
                  </div>
                </div>
              </>
            ) : null}

            <button
              onClick={() => setActiveTab('discover')}
              className="mt-6 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
            >
              Back to Discovery
            </button>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-slate-50 h-[600px] overflow-y-auto">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Transaction History</h2>
              <p className="text-sm text-slate-500">Your past discounted purchases</p>
            </div>
            <div className="p-4 space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No transactions yet</p>
                </div>
              ) : (
                transactions.map((tx: any) => (
                  <div key={tx.id} className="bg-white rounded-xl p-4 border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-slate-800">{tx.merchant?.businessName}</h4>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                        {tx.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400">Original</p>
                        <p className="font-medium text-slate-600">&euro;{tx.originalAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Discount</p>
                        <p className="font-medium text-emerald-600">-{tx.discountRate}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400">You Paid</p>
                        <p className="font-bold text-slate-800">&euro;{tx.finalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
