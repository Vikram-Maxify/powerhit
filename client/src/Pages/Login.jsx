import {
  Eye,
  EyeOff,
  Lock,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { clearError, login } from "../redux/slices/authSlice";

const HERO_IMAGE = "https://i.ibb.co/DffFKgD0/imagepng1.png";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    loading,
    error,
    success,
    message,
    isAuthenticated,
  } = useSelector((state) => state.auth);

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    mobile: "",
    password: "",
    country: "IN",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let inputValue = value;

    if (name === "mobile") {
      // Only digits
      inputValue = value.replace(/\D/g, "").slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: inputValue,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (error) {
      dispatch(clearError());
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.mobile.trim()) {
      errors.mobile = "Mobile number is required";
    } else {
      const mobileDigits = formData.mobile.replace(/\D/g, "");

      if (!/^[0-9]{10}$/.test(mobileDigits)) {
        errors.mobile = "Please enter a valid 10-digit mobile number";
      }
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const userData = {
      mobile: formData.mobile.trim(),
      password: formData.password,
      country: formData.country,
    };

    try {
      const result = await dispatch(login(userData)).unwrap();

      console.log("Login successful:", result);

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="bg-white flex justify-center items-start md:items-center p-3 md:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100">
        {/* Hero */}
        <div className="text-center">
          <img
            src={HERO_IMAGE}
            alt="WINZOX"
            className="w-56 mx-auto object-contain"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />

          <h2 className="text-2xl font-bold text-gray-900 mt-3">
            Welcome Back!
          </h2>

          <p className="text-sm text-gray-500 mt-0.5">
            Login to continue your winning journey
          </p>
        </div>

        {/* Form Card */}
        <div className="mt-6 rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-full border border-amber-200 flex items-center justify-center flex-shrink-0">
              <Lock size={18} className="text-amber-500" />
            </div>

            <div>
              <h3 className="font-bold text-base text-gray-900">
                Login to your account
              </h3>

              <p className="text-gray-400 text-xs">
                Enter your details below
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center justify-between">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() => dispatch(clearError())}
                  className="text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Success */}
            {success && message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                {message}
              </div>
            )}

            {/* Mobile Number */}
            <div>
              <label className="text-sm font-bold block mb-1.5 text-gray-800">
                Mobile Number
              </label>

              <div
                className={`flex items-center border ${
                  formErrors.mobile
                    ? "border-red-400"
                    : "border-gray-200"
                } rounded-full px-4 h-12 bg-white`}
              >
                <Phone
                  size={16}
                  className="text-gray-400 flex-shrink-0"
                />

                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="tel"
                  className="bg-transparent flex-1 outline-none px-2.5 text-sm text-gray-900 placeholder-gray-400"
                />
              </div>

              {formErrors.mobile && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {formErrors.mobile}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-bold block mb-1.5 text-gray-800">
                Password
              </label>

              <div
                className={`flex items-center border ${
                  formErrors.password
                    ? "border-red-400"
                    : "border-gray-200"
                } rounded-full px-4 h-12 bg-white`}
              >
                <Lock
                  size={16}
                  className="text-gray-400 flex-shrink-0"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="bg-transparent flex-1 outline-none px-2.5 text-sm text-gray-900 placeholder-gray-400"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>

              {formErrors.password && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-amber-500 text-sm font-semibold hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`h-12 rounded-full w-full bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
              border border-[#FFD75A]
              shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)]
              text-black font-bold text-base tracking-wide transition-all duration-300 ${
                loading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:from-amber-500 hover:to-amber-600"
              }`}
            >
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>

            {/* Secure Login */}
            <div className="rounded-2xl border border-gray-100 p-4 flex gap-3 items-center">
              <div className="w-11 h-11 rounded-full border border-amber-200 flex items-center justify-center flex-shrink-0">
                <ShieldCheck
                  size={20}
                  className="text-amber-500"
                />
              </div>

              <div>
                <h4 className="font-bold text-sm text-gray-900">
                  100% Secure Login
                </h4>

                <p className="text-gray-500 text-xs">
                  Your data is encrypted and always protected with us.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;