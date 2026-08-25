import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Landmark,
  QrCode,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getDepositMethods } from "../redux/slices/depositSlice";

const PRESET_AMOUNTS = [200, 500, 1000, 2000, 5000, 10000];

const Deposit = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { methods, loading } = useSelector((state) => state.deposit);

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    dispatch(getDepositMethods());
  }, [dispatch]);

  const validateAmount = (value, method) => {
    const num = parseFloat(value);
    if (!value || value === "") return "Please enter an amount";
    if (isNaN(num) || num <= 0) return "Please enter a valid amount";
    if (method) {
      const min = parseFloat(method.minimumDeposit);
      const max = parseFloat(method.maximumDeposit);
      if (num < min) return `Minimum amount is ${method.minimumDeposit}`;
      if (num > max) return `Maximum amount is ${method.maximumDeposit}`;
    }
    return "";
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    if (touched) setError(validateAmount(amount, method));
  };

  const handlePresetClick = (value) => {
    setAmount(String(value));
    setTouched(true);
    setError(validateAmount(String(value), selectedMethod));
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    if (touched) setError(validateAmount(value, selectedMethod));
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateAmount(amount, selectedMethod));
  };

  const getMethodIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "bank":
        return <Landmark className="w-4 h-4" />;
      case "upi":
        return <QrCode className="w-4 h-4" />;
      case "card":
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  const proceedHandler = () => {
    const amountError = validateAmount(amount, selectedMethod);
    setTouched(true);
    setError(amountError);

    if (!selectedMethod) {
      toast.error("Please select a payment method first");
      return;
    }
    if (amountError) {
      toast.error(amountError);
      return;
    }

    navigate("/deposit/payment", {
      state: { method: selectedMethod, amount },
    });
  };

  const canProceed = selectedMethod && amount && !error;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-white overflow-hidden">
      {/* Decorative background orbs */}
      <div className="pointer-events-none absolute -top-24 -right-20 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-24 w-64 h-64 bg-yellow-200/25 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl" />

      <div className="relative px-4 sm:px-6 py-6">
        <div className="max-w-md w-full mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-200 mb-3">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Deposit Funds
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Select a payment method and amount to continue
            </p>
          </div>

          {/* Payment Methods */}
          <div className="mb-5 bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Payment Method
              </h3>
              {!selectedMethod && (
                <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                  Required
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {methods.map((item) => (
                <button
                  type="button"
                  key={item.title}
                  onClick={() => handleMethodSelect(item)}
                  className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-150 text-left ${
                    selectedMethod?.title === item.title
                      ? "border-amber-400 bg-amber-50/70 shadow-sm"
                      : "border-gray-100 bg-gray-50/50 hover:border-amber-200 hover:bg-amber-50/30"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      selectedMethod?.title === item.title
                        ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm"
                        : "bg-white text-gray-400 border border-gray-200"
                    }`}
                  >
                    {getMethodIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {item.processingTime}
                    </p>
                  </div>
                  {selectedMethod?.title === item.title && (
                    <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {selectedMethod && (
              <p className="mt-3.5 text-[11px] text-gray-400">
                Limit: ₹{selectedMethod.minimumDeposit} – ₹
                {selectedMethod.maximumDeposit}
              </p>
            )}
          </div>

          {/* Amount Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100 p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Amount
            </h3>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handlePresetClick(val)}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all duration-150 border ${
                    String(amount) === String(val)
                      ? "bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200] border border-[#FFD75A] shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)]"
                      : "bg-gray-50/60 text-gray-600 border-gray-200 hover:border-amber-300 hover:bg-amber-50/40"
                  }`}
                >
                  ₹{val.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Custom amount
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
                ₹
              </span>
              <input
                type="number"
                className={`w-full rounded-xl border p-3 pl-8 text-sm text-gray-800 bg-gray-50/60 transition focus:outline-none focus:ring-2 ${
                  touched && error
                    ? "border-red-300 focus:ring-red-100 bg-red-50/40"
                    : touched && !error && amount
                      ? "border-green-300 focus:ring-green-100 bg-green-50/40"
                      : "border-gray-200 focus:ring-amber-100"
                }`}
                value={amount}
                onChange={handleAmountChange}
                onBlur={handleBlur}
                placeholder="Enter amount"
                step="0.01"
                min="0"
              />
            </div>
            {touched && error && (
              <p className="mt-1.5 text-[11px] text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}

            {!selectedMethod && (
              <div className="mt-5 px-3.5 py-3 bg-amber-50/70 border border-amber-100 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <p className="text-[11px] text-amber-700 font-medium">
                  Select a payment method above to proceed
                </p>
              </div>
            )}
          </div>

          {/* Amount summary + Proceed button (in normal flow, always visible) */}
          <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400 font-medium">
                You'll deposit
              </span>
              <span className="text-xl font-bold text-gray-900">
                {amount ? `₹${Number(amount).toLocaleString("en-IN")}` : "₹0"}
              </span>
            </div>
            <button
              type="button"
              disabled={loading || !canProceed}
              onClick={proceedHandler}
              className={`w-full font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-1.5 ${
                loading || !canProceed
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200] border border-[#FFD75A] shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] hover:from-amber-600 hover:to-amber-700 text-black shadow-amber-200 active:scale-[0.98]"
              }`}
            >
              Proceed to Payment
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deposit;
