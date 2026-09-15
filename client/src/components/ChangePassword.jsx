import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { showErrorToast, showSuccessToast } from "../hooks/toast";
import {
  changePassword,
  clearError,
  clearMessage,
  logout,
} from "../redux/slices/authSlice";

export default function ChangePassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReloginNotice, setShowReloginNotice] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const reloginTimerRef = useRef(null);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    minLength: false,
    hasUpperCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    return () => {
      dispatch(clearMessage());
      dispatch(clearError());
      if (reloginTimerRef.current) {
        clearTimeout(reloginTimerRef.current);
      }
    };
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "newPassword") checkPasswordStrength(value);
  };

  const checkPasswordStrength = (password) => {
    setPasswordStrength({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!form.currentPassword)
      errors.currentPassword = "Current password is required";
    else if (form.currentPassword.length < 6)
      errors.currentPassword = "Password must be at least 6 characters";
    if (!form.newPassword) errors.newPassword = "New password is required";
    else if (form.newPassword.length < 8)
      errors.newPassword = "Password must be at least 8 characters";
    else if (!passwordStrength.hasUpperCase)
      errors.newPassword =
        "Password must contain at least one uppercase letter";
    else if (!passwordStrength.hasNumber)
      errors.newPassword = "Password must contain at least one number";
    else if (!passwordStrength.hasSpecialChar)
      errors.newPassword =
        "Password must contain at least one special character";
    if (!form.confirmPassword)
      errors.confirmPassword = "Please confirm your password";
    else if (form.newPassword !== form.confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const result = await dispatch(
        changePassword({
          oldPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      ).unwrap();

      showSuccessToast(
        "Password Changed",
        result?.message || "Password changed successfully!",
      );

      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStrength({
        minLength: false,
        hasUpperCase: false,
        hasNumber: false,
        hasSpecialChar: false,
      });

      // 5 second baad relogin notice dikhao
      reloginTimerRef.current = setTimeout(() => {
        setShowReloginNotice(true);
      }, 5000);
    } catch (err) {
      showErrorToast("Change Failed", err || "Failed to change password");
    }
  };

  const handleReset = () => {
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setFormErrors({});
    setPasswordStrength({
      minLength: false,
      hasUpperCase: false,
      hasNumber: false,
      hasSpecialChar: false,
    });
    dispatch(clearError());
    dispatch(clearMessage());
  };

  const handleReloginConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await dispatch(logout()).unwrap();
    } catch (err) {
      // logout API fail bhi ho to local session clear karke login pe bhej dete hain
    } finally {
      setIsLoggingOut(false);
      setShowReloginNotice(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-5">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] flex items-center justify-center text-white flex-shrink-0"
          >
            <Lock size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Change Password
            </h2>
            <p className="text-sm text-gray-500">Keep your account secure</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
          {/* Security Recommendation */}
          <div className="mb-5 sm:mb-6 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3 sm:p-4">
            <ShieldCheck
              className="text-amber-500 flex-shrink-0 mt-0.5"
              size={18}
            />
            <div>
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                Security Tip
              </h3>
              <p className="text-sm text-gray-600">
                8+ characters with uppercase, number & special character
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Current Password */}
            <div>
              <label className="block mb-1.5 font-medium text-gray-700 text-sm sm:text-base">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter current password"
                  className={`w-full h-11 sm:h-12 rounded-xl border ${
                    formErrors.currentPassword
                      ? "border-red-400"
                      : "border-gray-300"
                  } bg-gray-50 px-4 pr-11 text-sm sm:text-base focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formErrors.currentPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block mb-1.5 font-medium text-gray-700 text-sm sm:text-base">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className={`w-full h-11 sm:h-12 rounded-xl border ${
                    formErrors.newPassword
                      ? "border-red-400"
                      : "border-gray-300"
                  } bg-gray-50 px-4 pr-11 text-sm sm:text-base focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formErrors.newPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block mb-1.5 font-medium text-gray-700 text-sm sm:text-base">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className={`w-full h-11 sm:h-12 rounded-xl border ${
                    formErrors.confirmPassword
                      ? "border-red-400"
                      : "border-gray-300"
                  } bg-gray-50 px-4 pr-11 text-sm sm:text-base focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Password Strength Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  passwordStrength.minLength
                    ? "bg-green-50 text-green-600"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                <CheckCircle2 size={14} className="flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">8+ chars</span>
              </div>
              <div
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  passwordStrength.hasUpperCase
                    ? "bg-green-50 text-green-600"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                <CheckCircle2 size={14} className="flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">
                  Uppercase
                </span>
              </div>
              <div
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  passwordStrength.hasNumber
                    ? "bg-green-50 text-green-600"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                <CheckCircle2 size={14} className="flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Number</span>
              </div>
              <div
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  passwordStrength.hasSpecialChar
                    ? "bg-green-50 text-green-600"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                <CheckCircle2 size={14} className="flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Special</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 h-11 sm:h-12 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition text-sm sm:text-base px-4"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 h-11 sm:h-12 rounded-xl bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-white font-bold shadow-md transition text-sm sm:text-base px-4 ${
                  loading
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    <span>Updating...</span>
                  </span>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Relogin Notice Modal */}
      {showReloginNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="relative bg-white rounded-2xl border border-amber-200 w-full max-w-xs p-6 text-center shadow-xl">
            <div className="w-14 h-14 rounded-full border border-amber-300 bg-amber-50 flex items-center justify-center mx-auto mb-3">
              <LogOut size={22} className="text-amber-500" />
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1">
              Please Login Again
            </h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Your password has been updated. For the changes to take effect,
              you need to log in again.
            </p>

            <button
              onClick={handleReloginConfirm}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-black font-bold text-sm transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Logging out...
                </>
              ) : (
                "OK"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
