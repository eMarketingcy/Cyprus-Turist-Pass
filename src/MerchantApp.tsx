import { useState } from 'react';
import { Store, ScanLine, Calculator, CreditCard, CheckCircle2, ArrowRight, Percent } from 'lucide-react';

export default function MerchantApp() {
  const [step, setStep] = useState<'scan' | 'calculate' | 'success'>('scan');
  const [billAmount, setBillAmount] = useState('');
  
  // Mock Merchant Data
  const merchant = {
    name: 'Ocean View Seafood',
    discountRate: 15, // 15%
    platformFeeRate: 10 // 10%
  };

  const amount = parseFloat(billAmount) || 0;
  const discountAmount = amount * (merchant.discountRate / 100);
  const finalAmount = amount - discountAmount;
  const platformFee = finalAmount * (merchant.platformFeeRate / 100);
  const merchantPayout = finalAmount - platformFee;

  const handleProcessPayment = () => {
    // In a real app, this would trigger Stripe Connect / JCC
    setStep('success');
  };

  return (
    <div className="flex flex-col items-center p-4 font-sans w-full">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{merchant.name}</h1>
            <p className="text-slate-400 text-sm mt-1">Merchant POS Terminal</p>
          </div>
          <div className="bg-slate-800 p-2 rounded-xl">
            <Store className="w-6 h-6 text-indigo-400" />
          </div>
        </div>

        {/* SCAN STEP */}
        {step === 'scan' && (
          <div className="p-8 animate-in fade-in duration-500 flex flex-col items-center text-center">
            <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-6 relative overflow-hidden">
              <div className="absolute inset-0 border-4 border-indigo-500 border-dashed rounded-full animate-[spin_10s_linear_infinite] opacity-20"></div>
              <ScanLine className="w-12 h-12 text-indigo-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Scan Customer QR</h2>
            <p className="text-slate-500 mb-8">Ask the customer to show their Tourist Pass QR code to apply the discount.</p>
            
            <button 
              onClick={() => setStep('calculate')}
              className="w-full bg-indigo-600 text-white font-medium py-3.5 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center"
            >
              Simulate Scan <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}

        {/* CALCULATE STEP */}
        {step === 'calculate' && (
          <div className="p-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between mb-6 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <div className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2" />
                <span className="font-medium text-emerald-800">Valid Tourist Pass</span>
              </div>
              <div className="bg-emerald-200/50 text-emerald-800 px-2.5 py-1 rounded-lg text-sm font-bold flex items-center">
                <Percent className="w-3.5 h-3.5 mr-1" /> {merchant.discountRate}% OFF
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Total Bill Amount (£)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-lg">£</span>
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
                    <span>£{amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({merchant.discountRate}%)</span>
                    <span>-£{discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-slate-200 w-full my-2"></div>
                  <div className="flex justify-between text-slate-800 font-bold text-xl">
                    <span>Customer Pays</span>
                    <span>£{finalAmount.toFixed(2)}</span>
                  </div>
                  
                  {/* Internal split breakdown (Usually hidden from customer, shown to merchant) */}
                  <div className="mt-4 pt-4 border-t border-slate-200/60">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Split (Stripe Connect)</p>
                    <div className="flex justify-between text-slate-500 text-sm mb-1">
                      <span>Platform Fee ({merchant.platformFeeRate}%)</span>
                      <span>-£{platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-indigo-700 font-medium text-sm">
                      <span>Your Payout</span>
                      <span>£{merchantPayout.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <button 
                onClick={handleProcessPayment}
                disabled={amount <= 0}
                className="w-full bg-slate-900 text-white font-medium py-4 rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg shadow-lg shadow-slate-200"
              >
                <CreditCard className="w-5 h-5 mr-2" /> Charge £{finalAmount.toFixed(2)}
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS STEP */}
        {step === 'success' && (
          <div className="p-8 animate-in zoom-in-95 duration-500 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful</h2>
            <p className="text-slate-500 mb-6">The transaction has been processed via Stripe Connect.</p>
            
            <div className="bg-slate-50 w-full rounded-2xl p-4 mb-8 border border-slate-100">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Customer Paid</span>
                <span className="font-bold text-slate-800">£{finalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Your Payout</span>
                <span className="font-bold text-indigo-600">£{merchantPayout.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={() => {
                setBillAmount('');
                setStep('scan');
              }}
              className="w-full bg-slate-100 text-slate-700 font-medium py-3.5 rounded-xl hover:bg-slate-200 transition-colors"
            >
              New Transaction
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
