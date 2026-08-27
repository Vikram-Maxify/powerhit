// pages/Withdrawal.jsx
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  CreditCard,
  Gem,
  Gift,
  History,
  Loader2,
  Mail,
  Phone,
  Shield,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

// Import from withdrawal slice
import {
  clearWithdrawalError,
  clearWithdrawalSuccess,
  fetchWithdrawalHistory,
  fetchWithdrawalSettings,
  requestWithdrawal,
  selectCurrentWithdrawal,
  selectHistoryLoading,
  selectPagination,
  selectRequestError,
  selectRequestLoading,
  selectRequestSuccess,
  selectSettingsError,
  selectSettingsLoading,
  selectSummary,
  selectWithdrawalError,
  selectWithdrawalHistory,
  selectWithdrawalMessage,
  selectWithdrawalSettings,
} from "../redux/slices/withdrawalSlice";

const Withdrawal = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Redux state
  const settings = useSelector(selectWithdrawalSettings);
  const settingsLoading = useSelector(selectSettingsLoading);
  const settingsError = useSelector(selectSettingsError);
  const withdrawalHistory = useSelector(selectWithdrawalHistory);
  const historyLoading = useSelector(selectHistoryLoading);
  const summary = useSelector(selectSummary);
  const pagination = useSelector(selectPagination);
  const requestLoading = useSelector(selectRequestLoading);
  const requestError = useSelector(selectRequestError);
  const requestSuccess = useSelector(selectRequestSuccess);
  const currentWithdrawal = useSelector(selectCurrentWithdrawal);
  const error = useSelector(selectWithdrawalError);
  const message = useSelector(selectWithdrawalMessage);

  // Local state
  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "",
    bankDetails: {
      accountNumber: "",
      accountHolderName: "",
      bankName: "",
      ifscCode: "",
      branchName: "",
    },
    upiDetails: {
      upiId: "",
      upiName: "",
    },
    paypalDetails: {
      email: "",
    },
    cryptoDetails: {
      walletAddress: "",
      network: "BTC",
    },
  });

  const [formErrors, setFormErrors] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [fee, setFee] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch withdrawal settings and history
  useEffect(() => {
    dispatch(fetchWithdrawalSettings());
    dispatch(fetchWithdrawalHistory());
  }, [dispatch]);

  // Handle success state
  useEffect(() => {
    if (requestSuccess && currentWithdrawal) {
      setShowSuccessModal(true);
      setFormData((prev) => ({
        ...prev,
        amount: "",
      }));
      setFee(0);
      setNetAmount(0);
      dispatch(fetchWithdrawalHistory());
      setTimeout(() => {
        setShowSuccessModal(false);
        dispatch(clearWithdrawalSuccess());
      }, 5000);
    }
  }, [requestSuccess, currentWithdrawal, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearWithdrawalError());
    }
    if (requestError) {
      toast.error(requestError);
      dispatch(clearWithdrawalError());
    }
    if (settingsError) {
      toast.error(settingsError);
      dispatch(clearWithdrawalError());
    }
  }, [error, requestError, settingsError, dispatch]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "amount") {
      calculateFeeAndNet(value, formData.paymentMethod);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: method,
    }));
    setSelectedPaymentMethod(method);
    setFormErrors({});
    calculateFeeAndNet(formData.amount, method);
  };

  const calculateFeeAndNet = (amount, method) => {
    if (!amount || !settings) {
      setFee(0);
      setNetAmount(0);
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFee(0);
      setNetAmount(0);
      return;
    }

    let calculatedFee = 0;
    if (settings.processingFeeType === "percentage") {
      calculatedFee = (numAmount * settings.processingFee) / 100;
    } else {
      calculatedFee = settings.processingFee || 0;
    }

    setFee(calculatedFee);
    setNetAmount(numAmount - calculatedFee);
  };

  // Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.amount) {
      errors.amount = "Please enter withdrawal amount";
    } else if (parseFloat(formData.amount) < settings?.minWithdrawal) {
      errors.amount = `Minimum withdrawal amount is ${settings?.currencySymbol}${settings?.minWithdrawal}`;
    } else if (parseFloat(formData.amount) > settings?.maxWithdrawal) {
      errors.amount = `Maximum withdrawal amount is ${settings?.currencySymbol}${settings?.maxWithdrawal}`;
    } else if (parseFloat(formData.amount) > user?.balance) {
      errors.amount = `Insufficient balance. Available: ${settings?.currencySymbol}${user?.balance}`;
    }

    if (!formData.paymentMethod) {
      errors.paymentMethod = "Please select a payment method";
    }

    const method = formData.paymentMethod;
    if (method === "bank_transfer") {
      if (!formData.bankDetails.accountNumber) {
        errors["bankDetails.accountNumber"] = "Account number is required";
      }
      if (!formData.bankDetails.accountHolderName) {
        errors["bankDetails.accountHolderName"] =
          "Account holder name is required";
      }
      if (!formData.bankDetails.bankName) {
        errors["bankDetails.bankName"] = "Bank name is required";
      }
      if (!formData.bankDetails.ifscCode) {
        errors["bankDetails.ifscCode"] = "IFSC code is required";
      }
    } else if (["upi", "phonepe", "googlepay", "paytm"].includes(method)) {
      if (!formData.upiDetails.upiId) {
        errors["upiDetails.upiId"] = "UPI ID is required";
      }
      if (!formData.upiDetails.upiName) {
        errors["upiDetails.upiName"] = "UPI holder name is required";
      }
    } else if (["paypal", "skrill", "neteller"].includes(method)) {
      if (!formData.paypalDetails.email) {
        errors["paypalDetails.email"] = "Email address is required";
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.paypalDetails.email)
      ) {
        errors["paypalDetails.email"] = "Please enter a valid email address";
      }
    } else if (method === "crypto") {
      if (!formData.cryptoDetails.walletAddress) {
        errors["cryptoDetails.walletAddress"] = "Wallet address is required";
      }
      if (!formData.cryptoDetails.network) {
        errors["cryptoDetails.network"] = "Network is required";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit withdrawal using Redux
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = document.querySelector(".error-message");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    const withdrawalData = {
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod,
    };

    const method = formData.paymentMethod;
    if (method === "bank_transfer") {
      withdrawalData.bankDetails = formData.bankDetails;
    } else if (["upi", "phonepe", "googlepay", "paytm"].includes(method)) {
      withdrawalData.upiDetails = formData.upiDetails;
    } else if (["paypal", "skrill", "neteller"].includes(method)) {
      withdrawalData.paypalDetails = formData.paypalDetails;
    } else if (method === "crypto") {
      withdrawalData.cryptoDetails = formData.cryptoDetails;
    }

    dispatch(requestWithdrawal(withdrawalData));
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      processing: "bg-blue-50 text-blue-700 border-blue-200",
      completed: "bg-green-50 text-green-700 border-green-200",
      failed: "bg-red-50 text-red-700 border-red-200",
      cancelled: "bg-gray-50 text-gray-700 border-gray-200",
      rejected: "bg-red-50 text-red-700 border-red-200",
    };
    return statusMap[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    const icons = {
      bank_transfer: <Building2 size={16} />,
      upi: <Phone size={16} />,
      phonepe: <Phone size={16} />,
      googlepay: <Phone size={16} />,
      paytm: <Phone size={16} />,
      paypal: <Mail size={16} />,
      skrill: <Mail size={16} />,
      neteller: <Mail size={16} />,
      crypto: <CreditCard size={16} />,
    };
    return icons[method] || <CreditCard size={16} />;
  };

  // Get payment method display name
  const getPaymentMethodName = (method) => {
    const names = {
      bank_transfer: "Bank Transfer",
      upi: "UPI",
      phonepe: "PhonePe",
      googlepay: "Google Pay",
      paytm: "Paytm",
      paypal: "PayPal",
      skrill: "Skrill",
      neteller: "Neteller",
      crypto: "Cryptocurrency",
    };
    return names[method] || method;
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!settings) return `₹${amount}`;
    return `${settings.currencySymbol}${amount?.toFixed(2) || "0.00"}`;
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin mx-auto"></div>
            <Sparkles className="w-6 h-6 text-yellow-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading withdrawal settings...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (settingsError && !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Withdrawal Not Available
          </h2>
          <p className="text-gray-600 mb-6">
            {settingsError ||
              "Withdrawal settings are not configured for your country. Please contact support."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all duration-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 py-4 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header - Premium */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-100/50 p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100/80 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-400/5 rounded-full blur-2xl"></div>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Withdraw Funds
                  <span className="text-[10px] bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-normal">
                    Secure
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Withdraw your winnings securely & instantly
                </p>
              </div>
            </div>

            {/* Balance Card */}
            <div className="w-full sm:w-auto bg-gradient-to-br from-yellow-50 to-amber-50 px-4 sm:px-6 py-3 rounded-xl border border-yellow-200/50 shadow-lg shadow-yellow-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-400/20 rounded-lg">
                  <Wallet className="text-yellow-600" size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-yellow-700 font-medium uppercase tracking-wider">
                    Available Balance
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text">
                    {formatCurrency(user?.balance || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-100/50 p-4 sm:p-6 border border-gray-100/80">
              <form onSubmit={handleSubmit}>
                {/* Withdrawal Limits Info - Premium */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl p-4 mb-6 border border-blue-200/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="text-blue-600" size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-blue-900 flex items-center gap-2">
                        Withdrawal Limits
                        <Zap className="w-3 h-3 text-blue-500" />
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                        <div className="bg-white/60 rounded-lg px-3 py-1.5">
                          <p className="text-[10px] text-gray-500">Min</p>
                          <p className="text-sm font-bold text-gray-700">
                            {formatCurrency(settings?.minWithdrawal || 0)}
                          </p>
                        </div>
                        <div className="bg-white/60 rounded-lg px-3 py-1.5">
                          <p className="text-[10px] text-gray-500">Max</p>
                          <p className="text-sm font-bold text-gray-700">
                            {formatCurrency(settings?.maxWithdrawal || 0)}
                          </p>
                        </div>
                        {settings?.dailyLimit && (
                          <div className="bg-white/60 rounded-lg px-3 py-1.5">
                            <p className="text-[10px] text-gray-500">
                              Daily Limit
                            </p>
                            <p className="text-sm font-bold text-gray-700">
                              {formatCurrency(settings.dailyLimit)}
                            </p>
                          </div>
                        )}
                        {settings?.processingFee > 0 && (
                          <div className="bg-white/60 rounded-lg px-3 py-1.5">
                            <p className="text-[10px] text-gray-500">Fee</p>
                            <p className="text-sm font-bold text-orange-600">
                              {settings.processingFeeType === "percentage"
                                ? `${settings.processingFee}%`
                                : formatCurrency(settings.processingFee)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount Input - Premium */}
                <div className="mb-5">
                  <label className="text-sm font-bold text-gray-700 block mb-2">
                    Withdrawal Amount *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">
                      {settings?.currencySymbol || "₹"}
                    </div>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder={`Enter amount (min: ${settings?.minWithdrawal || 0})`}
                      className={`w-full pl-10 pr-4 py-3.5 text-lg border-2 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all ${
                        formErrors.amount
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 hover:border-yellow-300"
                      }`}
                      step="0.01"
                      min={settings?.minWithdrawal || 0}
                      max={settings?.maxWithdrawal || 0}
                    />
                  </div>
                  {formErrors.amount && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1 error-message">
                      <AlertCircle size={14} /> {formErrors.amount}
                    </p>
                  )}

                  {/* Fee and Net Amount Display - Premium */}
                  {formData.amount && parseFloat(formData.amount) > 0 && (
                    <div className="mt-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-[10px] text-gray-500">
                              Withdrawal
                            </p>
                            <p className="text-sm font-bold text-gray-700">
                              {formatCurrency(parseFloat(formData.amount))}
                            </p>
                          </div>
                          {fee > 0 && (
                            <>
                              <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
                              <div>
                                <p className="text-[10px] text-gray-500">Fee</p>
                                <p className="text-sm font-bold text-red-500">
                                  -{formatCurrency(fee)}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 px-4 py-2 rounded-lg border border-yellow-200/50">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <div>
                            <p className="text-[10px] text-gray-500">
                              Net Amount
                            </p>
                            <p className="text-base font-bold text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text">
                              {formatCurrency(netAmount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method Selection - Premium */}
                <div className="mb-5">
                  <label className="text-sm font-bold text-gray-700 block mb-3">
                    Payment Method *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {settings?.paymentMethods?.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => handlePaymentMethodChange(method)}
                        className={`p-3 border-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                          selectedPaymentMethod === method
                            ? "border-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 shadow-lg shadow-yellow-500/10 scale-105"
                            : "border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/50 text-gray-600 hover:scale-105"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className={`p-1.5 rounded-lg ${
                              selectedPaymentMethod === method
                                ? "bg-yellow-200/50"
                                : "bg-gray-100"
                            }`}
                          >
                            {getPaymentMethodIcon(method)}
                          </div>
                          <span className="text-[10px] sm:text-xs">
                            {getPaymentMethodName(method)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {formErrors.paymentMethod && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle size={14} /> {formErrors.paymentMethod}
                    </p>
                  )}
                </div>

                {/* Dynamic Payment Method Fields - Premium */}
                {selectedPaymentMethod && (
                  <div className="animate-fadeIn">
                    {/* Bank Transfer */}
                    {selectedPaymentMethod === "bank_transfer" && (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 sm:p-5 rounded-xl border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                          <Building2 size={18} className="text-yellow-500" />
                          Bank Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <label className="text-xs text-gray-600 font-medium block mb-1">
                              Account Holder Name *
                            </label>
                            <input
                              type="text"
                              name="bankDetails.accountHolderName"
                              value={formData.bankDetails.accountHolderName}
                              onChange={handleChange}
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                              placeholder="Enter account holder name"
                            />
                            {formErrors["bankDetails.accountHolderName"] && (
                              <p className="text-red-500 text-xs mt-1">
                                {formErrors["bankDetails.accountHolderName"]}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 font-medium block mb-1">
                              Account Number *
                            </label>
                            <input
                              type="text"
                              name="bankDetails.accountNumber"
                              value={formData.bankDetails.accountNumber}
                              onChange={handleChange}
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                              placeholder="Enter account number"
                            />
                            {formErrors["bankDetails.accountNumber"] && (
                              <p className="text-red-500 text-xs mt-1">
                                {formErrors["bankDetails.accountNumber"]}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 font-medium block mb-1">
                              Bank Name *
                            </label>
                            <input
                              type="text"
                              name="bankDetails.bankName"
                              value={formData.bankDetails.bankName}
                              onChange={handleChange}
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                              placeholder="Enter bank name"
                            />
                            {formErrors["bankDetails.bankName"] && (
                              <p className="text-red-500 text-xs mt-1">
                                {formErrors["bankDetails.bankName"]}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 font-medium block mb-1">
                              IFSC Code *
                            </label>
                            <input
                              type="text"
                              name="bankDetails.ifscCode"
                              value={formData.bankDetails.ifscCode}
                              onChange={handleChange}
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                              placeholder="Enter IFSC code"
                              maxLength="11"
                            />
                            {formErrors["bankDetails.ifscCode"] && (
                              <p className="text-red-500 text-xs mt-1">
                                {formErrors["bankDetails.ifscCode"]}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 font-medium block mb-1">
                              Branch Name (Optional)
                            </label>
                            <input
                              type="text"
                              name="bankDetails.branchName"
                              value={formData.bankDetails.branchName}
                              onChange={handleChange}
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                              placeholder="Enter branch name"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* UPI */}
                    {["upi", "phonepe", "googlepay", "paytm"].includes(
                      selectedPaymentMethod,
                    ) && (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 sm:p-5 rounded-xl border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                          <Phone size={18} className="text-yellow-500" />
                          {getPaymentMethodName(selectedPaymentMethod)} Details
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-600 font-medium block mb-1">
                              UPI ID *
                            </label>
                            <input
                              type="text"
                              name="upiDetails.upiId"
                              value={formData.upiDetails.upiId}
                              onChange={handleChange}
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                              placeholder="e.g., user@paytm"
                            />
                            {formErrors["upiDetails.upiId"] && (
                              <p className="text-red-500 text-xs mt-1">
                                {formErrors["upiDetails.upiId"]}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 font-medium block mb-1">
                              UPI Holder Name *
                            </label>
                            <input
                              type="text"
                              name="upiDetails.upiName"
                              value={formData.upiDetails.upiName}
                              onChange={handleChange}
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                              placeholder="Enter UPI holder name"
                            />
                            {formErrors["upiDetails.upiName"] && (
                              <p className="text-red-500 text-xs mt-1">
                                {formErrors["upiDetails.upiName"]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PayPal, Skrill, Neteller */}
                    {["paypal", "skrill", "neteller"].includes(
                      selectedPaymentMethod,
                    ) && (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 sm:p-5 rounded-xl border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                          <Mail size={18} className="text-yellow-500" />
                          {getPaymentMethodName(selectedPaymentMethod)} Details
                        </h4>
                        <div>
                          <label className="text-xs text-gray-600 font-medium block mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            name="paypalDetails.email"
                            value={formData.paypalDetails.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                            placeholder="Enter email address"
                          />
                          {formErrors["paypalDetails.email"] && (
                            <p className="text-red-500 text-xs mt-1">
                              {formErrors["paypalDetails.email"]}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Crypto */}
                    {selectedPaymentMethod === "crypto" && (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 sm:p-5 rounded-xl border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                          <CreditCard size={18} className="text-yellow-500" />
                          Cryptocurrency Details
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-600 font-medium block mb-1">
                              Network *
                            </label>
                            <select
                              name="cryptoDetails.network"
                              value={formData.cryptoDetails.network}
                              onChange={handleChange}
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                            >
                              <option value="BTC">Bitcoin (BTC)</option>
                              <option value="ETH">Ethereum (ETH)</option>
                              <option value="USDT">Tether (USDT)</option>
                              <option value="BSC">Binance Smart Chain</option>
                              <option value="SOL">Solana</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 font-medium block mb-1">
                              Wallet Address *
                            </label>
                            <input
                              type="text"
                              name="cryptoDetails.walletAddress"
                              value={formData.cryptoDetails.walletAddress}
                              onChange={handleChange}
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                              placeholder="Enter wallet address"
                            />
                            {formErrors["cryptoDetails.walletAddress"] && (
                              <p className="text-red-500 text-xs mt-1">
                                {formErrors["cryptoDetails.walletAddress"]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button - Premium */}
                <button
                  type="submit"
                  disabled={requestLoading || !selectedPaymentMethod}
                  className="w-full mt-6 py-3.5 bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-black font-bold rounded-xl hover:shadow-2xl hover:shadow-yellow-500/30 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none text-base"
                >
                  {requestLoading ? (
                    <span className="flex items-center justify-center gap-3">
                      <Loader2 className="animate-spin" size={20} />
                      Processing Withdrawal...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Gem className="w-4 h-4" />
                      Request Withdrawal ({formatCurrency(netAmount || 0)})
                    </span>
                  )}
                </button>

                {/* Processing Time Info */}
                {settings?.processingTime && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 bg-gray-50 py-2 rounded-lg">
                    <Clock size={14} className="text-yellow-500" />
                    <span>
                      Processing time:{" "}
                      <strong className="text-gray-700">
                        {settings.processingTime}
                      </strong>
                    </span>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Sidebar - Premium */}
          <div className="lg:col-span-1 space-y-4">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-100/50 p-4 sm:p-5 border border-gray-100/80">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-yellow-500" />
                Withdrawal Summary
              </h3>
              {summary && summary.length > 0 ? (
                <div className="space-y-2">
                  {summary.map((item) => (
                    <div
                      key={item._id}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-600 capitalize flex items-center gap-1.5">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item._id === "pending"
                              ? "bg-yellow-400"
                              : item._id === "processing"
                                ? "bg-blue-400"
                                : item._id === "completed"
                                  ? "bg-green-400"
                                  : "bg-gray-400"
                          }`}
                        ></div>
                        {item._id}
                      </span>
                      <span className="text-sm font-bold text-gray-800">
                        {item.count} ({formatCurrency(item.totalAmount)})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  No withdrawals yet
                </p>
              )}
            </div>

            {/* Quick Actions - Withdrawal History */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-100/50 p-4 sm:p-5 border border-gray-100/80">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between p-2 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 rounded-xl transition-all duration-300"
              >
                <span className="flex items-center gap-2 text-gray-700 font-medium">
                  <History size={18} className="text-yellow-500" />
                  <span>Withdrawal History</span>
                </span>
                {showHistory ? (
                  <ChevronUp size={18} className="text-yellow-500" />
                ) : (
                  <ChevronDown size={18} className="text-yellow-500" />
                )}
              </button>

              {showHistory && (
                <div className="mt-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {historyLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2
                        className="animate-spin text-yellow-500"
                        size={24}
                      />
                    </div>
                  ) : withdrawalHistory && withdrawalHistory.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-6">
                      No withdrawal history
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {withdrawalHistory?.slice(0, 5).map((item) => (
                        <div
                          key={item._id}
                          className="border border-gray-100 rounded-xl p-3 hover:shadow-md transition-shadow duration-300"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-gray-900">
                                {formatCurrency(item.amount)}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                {getPaymentMethodIcon(item.paymentMethod)}
                                <span>
                                  {getPaymentMethodName(item.paymentMethod)}
                                </span>
                              </p>
                            </div>
                            <span
                              className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${getStatusBadge(item.status)}`}
                            >
                              {item.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(item.requestedAt)}
                          </p>
                        </div>
                      ))}
                      {withdrawalHistory?.length > 5 && (
                        <button className="w-full text-center text-xs text-yellow-500 font-medium hover:underline py-2">
                          View All ({withdrawalHistory.length})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Support - Premium */}
            <div className="bg-gradient-to-br from-white to-gray-50/80 rounded-2xl shadow-xl shadow-gray-100/50 p-4 sm:p-5 border border-gray-100/80">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-xl">
                  <Gift size={18} className="text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-700 text-sm">
                    Need Help?
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Contact our support team for assistance with your
                    withdrawal.
                  </p>
                  <button
                    onClick={() => navigate("/support")}
                    className="text-xs text-yellow-600 font-bold hover:text-yellow-700 mt-2 inline-flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Contact Support →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal - Premium */}
      {showSuccessModal && currentWithdrawal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-scaleIn">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <CheckCircle className="text-green-500" size={36} />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {currentWithdrawal.status === "completed"
                  ? "🎉 Withdrawal Successful!"
                  : "✅ Withdrawal Request Submitted!"}
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                {currentWithdrawal.status === "completed"
                  ? "Your withdrawal has been processed successfully."
                  : `Your withdrawal request has been submitted and will be processed within ${settings?.processingTime || "24-48 hours"}.`}
              </p>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 mb-6 border border-gray-200">
                <div className="flex justify-between text-sm py-1.5">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold">
                    {formatCurrency(
                      currentWithdrawal.withdrawal?.amount ||
                        currentWithdrawal.amount,
                    )}
                  </span>
                </div>
                {fee > 0 && (
                  <div className="flex justify-between text-sm py-1.5 border-t border-gray-200">
                    <span className="text-gray-600">Fee:</span>
                    <span className="text-red-500 font-bold">
                      -{formatCurrency(fee)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm py-1.5 border-t border-gray-200 font-bold">
                  <span className="text-gray-700">Net Amount:</span>
                  <span className="text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text">
                    {formatCurrency(netAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-t border-gray-200">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`font-bold capitalize ${
                      currentWithdrawal.status === "completed"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {currentWithdrawal.status}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  dispatch(clearWithdrawalSuccess());
                  navigate("/dashboard");
                }}
                className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all duration-300"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #fbbf24;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f59e0b;
        }
      `}</style>
    </div>
  );
};

export default Withdrawal;
