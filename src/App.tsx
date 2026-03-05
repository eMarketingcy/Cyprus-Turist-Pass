import { useAuth } from './hooks/useAuth';
import AuthScreen from './AuthScreen';
import CustomerApp from './CustomerApp';
import MerchantApp from './MerchantApp';
import AdminApp from './AdminApp';
import { Loader2, LogOut, Car, User } from 'lucide-react';

export default function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading Cyprus Tourist Pass...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const roleLabel = user.role === 'CUSTOMER' ? 'Tourist' : user.role === 'MERCHANT' ? 'Merchant' : 'Admin';
  const roleColor = user.role === 'CUSTOMER' ? 'bg-indigo-600' : user.role === 'MERCHANT' ? 'bg-emerald-600' : 'bg-orange-600';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between shadow-md z-50 relative">
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-sm tracking-tight hidden sm:inline">Cyprus Tourist Pass</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-slate-300" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium leading-tight">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-slate-400">{user.email}</p>
            </div>
            <span className={`${roleColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider`}>
              {roleLabel}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Render app based on role */}
      <div className="flex-1 flex justify-center overflow-auto">
        {user.role === 'CUSTOMER' && <CustomerApp />}
        {user.role === 'MERCHANT' && <MerchantApp />}
        {user.role === 'ADMIN' && <AdminApp />}
      </div>
    </div>
  );
}
