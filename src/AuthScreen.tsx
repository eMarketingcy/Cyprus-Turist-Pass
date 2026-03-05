import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { Car, Loader2, Store, Shield } from "lucide-react";

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"CUSTOMER" | "MERCHANT">("CUSTOMER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    businessName: "",
    businessType: "RESTAURANT",
    address: "",
    city: "Paphos",
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let result;
    if (mode === "login") {
      result = await login(form.email, form.password);
    } else {
      result = await register({ ...form, role });
    }

    if (!result.success) {
      setError(result.error || "Something went wrong");
    }
    setLoading(false);
  };

  const handleDemoLogin = async (email: string) => {
    setLoading(true);
    setError("");
    const result = await login(email, "password123");
    if (!result.success) setError(result.error || "Demo login failed. Run the seed script first.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
            <Car className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Cyprus Tourist Pass</h1>
          <p className="text-indigo-200 mt-2 text-sm">Exclusive discounts for car rental customers</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${mode === "login" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${mode === "register" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400"}`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === "register" && (
              <>
                {/* Role selector */}
                <div className="flex gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setRole("CUSTOMER")}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-all flex items-center justify-center gap-2 ${role === "CUSTOMER" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500"}`}
                  >
                    <Car className="w-4 h-4" /> Tourist
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("MERCHANT")}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-all flex items-center justify-center gap-2 ${role === "MERCHANT" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"}`}
                  >
                    <Store className="w-4 h-4" /> Merchant
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">First Name</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => update("firstName", e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => update("lastName", e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      required
                    />
                  </div>
                </div>

                {role === "MERCHANT" && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Business Name</label>
                      <input
                        type="text"
                        value={form.businessName}
                        onChange={(e) => update("businessName", e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                        <select
                          value={form.businessType}
                          onChange={(e) => update("businessType", e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        >
                          <option value="RESTAURANT">Restaurant</option>
                          <option value="HOTEL">Hotel</option>
                          <option value="ACTIVITY">Activity</option>
                          <option value="TOUR">Tour</option>
                          <option value="SPA">Spa</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
                        <select
                          value={form.city}
                          onChange={(e) => update("city", e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        >
                          <option>Paphos</option>
                          <option>Limassol</option>
                          <option>Larnaca</option>
                          <option>Nicosia</option>
                          <option>Ayia Napa</option>
                          <option>Protaras</option>
                          <option>Troodos</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        required
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Min 6 characters"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="px-6 pb-6">
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400 text-center mb-3 font-medium uppercase tracking-wider">Quick Demo Login</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleDemoLogin("tourist@example.com")}
                  disabled={loading}
                  className="py-2 px-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                >
                  <Car className="w-3 h-3" /> Tourist
                </button>
                <button
                  onClick={() => handleDemoLogin("ocean@merchant.com")}
                  disabled={loading}
                  className="py-2 px-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                >
                  <Store className="w-3 h-3" /> Merchant
                </button>
                <button
                  onClick={() => handleDemoLogin("admin@cypruspass.com")}
                  disabled={loading}
                  className="py-2 px-2 bg-orange-50 text-orange-700 rounded-xl text-xs font-medium hover:bg-orange-100 transition-colors flex items-center justify-center gap-1"
                >
                  <Shield className="w-3 h-3" /> Admin
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-indigo-300/50 text-xs mt-6">Cyprus Tourist Pass MVP v1.0</p>
      </div>
    </div>
  );
}
