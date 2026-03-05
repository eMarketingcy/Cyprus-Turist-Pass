import { useState, useEffect } from 'react';
import { useAuth, useApi } from './hooks/useAuth';
import { Store, ScanLine, Calculator, CreditCard, CheckCircle2, ArrowRight, Percent, Loader2, XCircle, History, Settings, AlertCircle } from 'lucide-react';

export default function MerchantApp() {
  const { user } = useAuth();
  const api = useApi();

  const [activeView, setActiveView] = useState<'pos' | 'transactions' | 'settings'>('pos');
  const [step, setStep] = useState<'scan' | 'calculate' | 'processing' | 'success'>('scan');
  const [billAmount, setBillAmount] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Merchant profile
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Settings form
  const [editDiscount, setEditDiscount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await api('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user.merchantProfile);
        setEditDiscount(String(data.user.merchantProfile?.discountRate || 5));
        setEditDescription(data.user.merchantProfile?.description || '');
      }
    } catch {}
    setProfileLoading(false);
  };

  const loadTransactions = async () => {
    try {
      const res = await api('/api/payment/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
      }
    } catch {}
  };

  useEffect(() => {
    if (activeView === 'transactions') loadTransactions();
  }, [activeView]);

  const handleScanQR = async () => {
    if (!qrToken.trim()) {
      setScanError('Please enter or scan a QR token');
      return;
    }
    setScanLoading(true);
    setScanError('');
    setScanResult(null);

    try {
      const res = await api('/api/payment/validate-qr', {
        method: 'POST',
        body: JSON.stringify({ qrToken: qrToken.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setScanResult(data);
        setStep('calculate');
      } else {
        setScanError(data.error || 'Invalid QR code');
      }
    } catch {
      setScanError('Network error');
    }
    setScanLoading(false);
  };

  const amount = parseFloat(billAmount) || 0;
  const discountRate = scanResult?.discountRate || profile?.discountRate || 15;
  const platformFeeRate = profile?.platformFeeRate || 10;
  const discountAmount = amount * (discountRate / 100);
  const finalAmount = amount - discountAmount;
  const platformFee = finalAmount * (platformFeeRate / 100);
  const merchantPayout = finalAmount - platformFee;

  const handleProcessPayment = async () => {
    setPaymentLoading(true);
    setStep('processing');

    try {
      const res = await api('/api/payment/process', {
        method: 'POST',
        body: JSON.stringify({
          qrToken: scanResult.qrToken,
          originalAmount: amount,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentResult(data.transaction);
        setStep('success');
      } else {
        setScanError(data.error || 'Payment failed');
        setStep('calculate');
      }
    } catch {
      setScanError('Payment processing failed');
      setStep('calculate');
    }
    setPaymentLoading(false);
  };

  const resetTransaction = () => {
    setBillAmount('');
    setQrToken('');
    setScanResult(null);
    setScanError('');
    setPaymentResult(null);
    setStep('scan');
  };

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    setSaveMsg('');
    try {
      const res = await api('/api/merchants/profile', {
        method: 'PUT',
        body: JSON.stringify({
          discountRate: parseFloat(editDiscount),
          description: editDescription,
        }),
      });
      if (res.ok) {
        setSaveMsg('Profile updated successfully');
        loadProfile();
      } else {
        const data = await res.json();
        setSaveMsg(data.error || 'Failed to update');
      }
    } catch {
      setSaveMsg('Network error');
    }
    setSaveLoading(false);
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Check if merchant is approved
  if (profile?.status === 'PENDING') {
    return (
      <div className="flex flex-col items-center p-8 font-sans w-full max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Pending Approval</h2>
          <p className="text-slate-500 text-sm">
            Your merchant account is pending admin approval. You'll be able to accept payments once approved.
          </p>
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
            Business: <strong>{profile.businessName}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 font-sans w-full">
      {/* View switcher */}
      <div className="w-full max-w-md bg-white rounded-full shadow-sm mb-6 p-1 flex items-center justify-between">
        <button
          onClick={() => setActiveView('pos')}
          className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${activeView === 'pos' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'}`}
        >
          POS Terminal
        </button>
        <button
          onClick={() => setActiveView('transactions')}
          className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${activeView === 'transactions' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'}`}
        >
          History
        </button>
        <button
          onClick={() => setActiveView('settings')}
          className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${activeView === 'settings' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'}`}
        >
          Settings
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">

        {activeView === 'pos' && (
          <>
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight">{profile?.businessName || 'My Business'}</h1>
                <p className="text-slate-400 text-sm mt-1">Merchant POS Terminal</p>
              </div>
              <div className="bg-slate-800 p-2 rounded-xl">
                <Store className="w-6 h-6 text-indigo-400" />
              </div>
            </div>

            {/* SCAN STEP */}
            {step === 'scan' && (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 border-4 border-indigo-500 border-dashed rounded-full animate-[spin_10s_linear_infinite] opacity-20"></div>
                  <ScanLine className="w-12 h-12 text-indigo-600" />
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-2">Scan Customer QR</h2>
                <p className="text-slate-500 mb-6 text-sm">Enter the customer's QR token or scan their code</p>

                <div className="w-full space-y-3">
                  <input
                    type="text"
                    value={qrToken}
                    onChange={(e) => { setQrToken(e.target.value); setScanError(''); }}
                    placeholder="Paste QR token here..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />

                  {scanError && (
                    <div className="flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                      <XCircle className="w-4 h-4 mr-2 flex-shrink-0" /> {scanError}
                    </div>
                  )}

                  <button
                    onClick={handleScanQR}
                    disabled={scanLoading || !qrToken.trim()}
                    className="w-full bg-indigo-600 text-white font-medium py-3.5 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {scanLoading ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Validating...</>
                    ) : (
                      <>Validate QR <ArrowRight className="w-5 h-5 ml-2" /></>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* CALCULATE STEP */}
            {step === 'calculate' && scanResult && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2" />
                    <div>
                      <span className="font-medium text-emerald-800 block">Valid Tourist Pass</span>
                      <span className="text-xs text-emerald-600">{scanResult.customerName}</span>
                    </div>
                  </div>
                  <div className="bg-emerald-200/50 text-emerald-800 px-2.5 py-1 rounded-lg text-sm font-bold flex items-center">
                    <Percent className="w-3.5 h-3.5 mr-1" /> {scanResult.discountRate}% OFF
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Total Bill Amount (&euro;)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-lg">&euro;</span>
                      <input
                        type="number"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full border-2 border-slate-200 rounded-2xl pl-10 pr-4 py-4 text-2xl font-bold text-slate-800 focus:border-indigo-500 focus:ring-0 outline-none transition-colors"
                        autoFocus
                      />
                    </div>
                  </div>

                  {amount > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                      <div className="flex justify-between text-slate-500">
                        <span>Original Amount</span>
                        <span>&euro;{amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Discount ({discountRate}%)</span>
                        <span>-&euro;{discountAmount.toFixed(2)}</span>
                      </div>
                      <div className="h-px bg-slate-200 w-full my-2"></div>
                      <div className="flex justify-between text-slate-800 font-bold text-xl">
                        <span>Customer Pays</span>
                        <span>&euro;{finalAmount.toFixed(2)}</span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-200/60">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Split</p>
                        <div className="flex justify-between text-slate-500 text-sm mb-1">
                          <span>Platform Fee ({platformFeeRate}%)</span>
                          <span>-&euro;{platformFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-indigo-700 font-medium text-sm">
                          <span>Your Payout</span>
                          <span>&euro;{merchantPayout.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleProcessPayment}
                    disabled={amount <= 0}
                    className="w-full bg-slate-900 text-white font-medium py-4 rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg shadow-lg shadow-slate-200"
                  >
                    <CreditCard className="w-5 h-5 mr-2" /> Charge &euro;{finalAmount.toFixed(2)}
                  </button>
                </div>
              </div>
            )}

            {/* PROCESSING STEP */}
            {step === 'processing' && (
              <div className="p-8 flex flex-col items-center text-center">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-6" />
                <h2 className="text-xl font-bold text-slate-800">Processing Payment</h2>
                <p className="text-slate-500 mt-2 text-sm">Connecting to Stripe Connect...</p>
              </div>
            )}

            {/* SUCCESS STEP */}
            {step === 'success' && paymentResult && (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful</h2>
                <p className="text-slate-500 mb-6">Transaction processed via Stripe Connect</p>

                <div className="bg-slate-50 w-full rounded-2xl p-4 mb-8 border border-slate-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Customer Paid</span>
                    <span className="font-bold text-slate-800">&euro;{paymentResult.finalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Discount Applied</span>
                    <span className="font-medium text-emerald-600">{paymentResult.discountRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Your Payout</span>
                    <span className="font-bold text-indigo-600">&euro;{paymentResult.merchantPayout.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={resetTransaction}
                  className="w-full bg-slate-100 text-slate-700 font-medium py-3.5 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  New Transaction
                </button>
              </div>
            )}
          </>
        )}

        {/* TRANSACTIONS VIEW */}
        {activeView === 'transactions' && (
          <div className="bg-slate-50 h-[600px] overflow-y-auto">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Transaction History</h2>
              <p className="text-sm text-slate-500">All payments received</p>
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
                      <div>
                        <h4 className="font-medium text-slate-800">
                          {tx.customer?.user ? `${tx.customer.user.firstName} ${tx.customer.user.lastName}` : 'Customer'}
                        </h4>
                        <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                        {tx.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                      <div>
                        <p className="text-slate-400">Bill</p>
                        <p className="font-medium text-slate-600">&euro;{tx.originalAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Discount</p>
                        <p className="font-medium text-emerald-600">-{tx.discountRate}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Your Payout</p>
                        <p className="font-bold text-indigo-700">&euro;{tx.merchantPayout.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SETTINGS VIEW */}
        {activeView === 'settings' && profile && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Business Settings</h2>
              <p className="text-sm text-slate-500">Manage your profile and discount rate</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Business Info</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name</span>
                  <span className="font-medium text-slate-800">{profile.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium text-slate-800">{profile.businessType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">City</span>
                  <span className="font-medium text-slate-800">{profile.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-medium text-emerald-600">{profile.status}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Discount Rate (%)</label>
                <input
                  type="number"
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(e.target.value)}
                  min="5"
                  max="25"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Minimum 5%, maximum 25%</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Describe your business to tourists..."
                />
              </div>

              {saveMsg && (
                <div className={`text-sm p-3 rounded-xl ${saveMsg.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {saveMsg}
                </div>
              )}

              <button
                onClick={handleSaveProfile}
                disabled={saveLoading}
                className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {saveLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Settings className="w-4 h-4 mr-2" /> Save Changes</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
