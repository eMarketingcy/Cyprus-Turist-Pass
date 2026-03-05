import { useState } from 'react';
import { Car, CheckCircle2, XCircle, Loader2, MapPin, QrCode, Search, Percent, ArrowRight } from 'lucide-react';

// Mock Data for Merchants
const MOCK_MERCHANTS = [
  { id: '1', name: 'Ocean View Seafood', type: 'Restaurant', discount: 15, location: 'Paphos', image: 'https://picsum.photos/seed/seafood/400/250' },
  { id: '2', name: 'Aphrodite Hills Resort', type: 'Hotel', discount: 10, location: 'Limassol', image: 'https://picsum.photos/seed/hotel/400/250' },
  { id: '3', name: 'Blue Lagoon Cruises', type: 'Activity', discount: 20, location: 'Akamas', image: 'https://picsum.photos/seed/cruise/400/250' },
  { id: '4', name: 'Taverna Agia Napa', type: 'Restaurant', discount: 5, location: 'Ayia Napa', image: 'https://picsum.photos/seed/taverna/400/250' },
];

export default function CustomerApp() {
  const [activeTab, setActiveTab] = useState<'validate' | 'discover' | 'qr'>('validate');
  const [contractNumber, setContractNumber] = useState('');
  const [agencyName, setAgencyName] = useState('Sixt');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/rental/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractNumber, agencyName }),
      });
      
      const data = await response.json();
      setResult({ status: response.status, data });
      if (response.status === 200) {
        setTimeout(() => setActiveTab('discover'), 1500);
      }
    } catch (error) {
      setResult({ status: 500, data: { error: 'Network error' } });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = (merchant: any) => {
    setSelectedMerchant(merchant);
    setActiveTab('qr');
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
          onClick={() => setActiveTab('discover')}
          disabled={!result || result.status !== 200}
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
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* VALIDATE TAB */}
        {activeTab === 'validate' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-indigo-600 p-8 text-white text-center rounded-b-[2rem]">
              <Car className="w-14 h-14 mx-auto mb-4 opacity-90" />
              <h1 className="text-2xl font-bold tracking-tight">Cyprus Tourist Pass</h1>
              <p className="text-indigo-100 mt-2 text-sm">Link your rental contract to unlock exclusive island-wide discounts</p>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleValidate} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Rental Agency
                  </label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Contract Number
                  </label>
                  <input 
                    type="text"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    placeholder="e.g. TEST-12345"
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    * For MVP testing, use any contract starting with "TEST"
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={loading || !contractNumber}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md shadow-indigo-200"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Validating...</>
                  ) : (
                    'Validate Contract'
                  )}
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
                      
                      {result.status === 200 && result.data.data && (
                        <div className="mt-3 bg-white/60 rounded-lg p-3 text-sm text-emerald-800">
                          <p><strong>Valid Until:</strong> {new Date(result.data.data.endDate).toLocaleDateString()}</p>
                          <p><strong>Vehicle:</strong> {result.data.data.vehicleClass}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DISCOVER TAB */}
        {activeTab === 'discover' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-50 h-[600px] overflow-y-auto">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Partnered Spots</h2>
              <p className="text-sm text-slate-500">Exclusive discounts for your trip</p>
              
              <div className="mt-4 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search restaurants, hotels..." 
                  className="w-full bg-slate-100 border-none rounded-full py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="p-4 space-y-4">
              {MOCK_MERCHANTS.map((merchant) => (
                <div key={merchant.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 transition-transform active:scale-[0.98]">
                  <div className="h-32 w-full relative">
                    <img src={merchant.image} alt={merchant.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center shadow-sm">
                      <Percent className="w-3 h-3 text-indigo-600 mr-1" />
                      <span className="text-xs font-bold text-indigo-700">{merchant.discount}% OFF</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-slate-800">{merchant.name}</h3>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{merchant.type}</span>
                    </div>
                    <div className="flex items-center text-slate-500 text-sm mb-4">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {merchant.location}
                    </div>
                    <button 
                      onClick={() => handleGenerateQR(merchant)}
                      className="w-full bg-slate-900 text-white text-sm font-medium py-2.5 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors"
                    >
                      Claim Discount <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR CODE TAB */}
        {activeTab === 'qr' && selectedMerchant && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-6 flex flex-col items-center justify-center min-h-[500px]">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Your Discount Pass</h2>
              <p className="text-slate-500 mt-2">Show this QR code to the merchant when paying</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 relative overflow-hidden">
              {/* Decorative corner elements */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-600 rounded-tl-xl m-4"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-600 rounded-tr-xl m-4"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-600 rounded-bl-xl m-4"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-600 rounded-br-xl m-4"></div>
              
              <QrCode className="w-48 h-48 text-slate-800" />
            </div>

            <div className="mt-8 text-center bg-slate-50 w-full p-4 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">Paying at</p>
              <h3 className="font-bold text-lg text-slate-800">{selectedMerchant.name}</h3>
              <div className="inline-flex items-center mt-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold">
                {selectedMerchant.discount}% Discount Applied
              </div>
            </div>

            <button 
              onClick={() => setActiveTab('discover')}
              className="mt-6 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
            >
              Back to Discovery
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
