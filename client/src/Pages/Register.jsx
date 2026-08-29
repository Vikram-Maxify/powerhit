import {
  ChevronDown,
  Eye,
  EyeOff,
  Gift,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearError, register } from "../redux/slices/authSlice";

const HERO_IMAGE = "https://i.ibb.co/DffFKgD0/imagepng1.png";

// Country data with flags (using emoji flags)
const countries = [
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { code: "AE", name: "Dubai", flag: "🇦🇪", dialCode: "+971" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", dialCode: "+92" },
  { code: "NP", name: "Nepal", flag: "🇳🇵", dialCode: "+977" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
];

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error, success, message } = useSelector(
    (state) => state.auth,
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
    country: "IN",
    termsAccepted: false,
  });

  const [formErrors, setFormErrors] = useState({});

  // Get selected country details
  const selectedCountry = countries.find(
    (country) => country.code === formData.country,
  );

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const refCode = queryParams.get("ref");
    if (refCode) {
      setFormData((prev) => ({ ...prev, referralCode: refCode.toUpperCase() }));
    }
  }, [location.search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target)
      ) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (error) {
      dispatch(clearError());
    }
  };

  const handleCountrySelect = (countryCode) => {
    setFormData((prev) => ({ ...prev, country: countryCode }));
    setShowCountryDropdown(false);
    if (formErrors.country) {
      setFormErrors((prev) => ({ ...prev, country: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (/\s/.test(formData.name.trim())) {
      errors.name = "Space is not allowed in name";
    }

    if (!formData.mobile.trim()) {
      errors.mobile = "Mobile number is required";
    } else {
      // Validate based on country
      const mobileDigits = formData.mobile.replace(/\D/g, "");
      if (formData.country === "IN" && !/^[0-9]{10}$/.test(mobileDigits)) {
        errors.mobile = "Please enter a valid 10-digit mobile number";
      } else if (
        formData.country === "CA" &&
        !/^[0-9]{10,11}$/.test(mobileDigits)
      ) {
        errors.mobile = "Please enter a valid mobile number";
      } else if (
        formData.country === "AE" &&
        !/^[0-9]{9}$/.test(mobileDigits)
      ) {
        errors.mobile = "Please enter a valid 9-digit mobile number";
      } else if (
        formData.country === "PK" &&
        !/^[0-9]{10}$/.test(mobileDigits)
      ) {
        errors.mobile = "Please enter a valid 10-digit mobile number";
      } else if (
        formData.country === "NP" &&
        !/^[0-9]{10}$/.test(mobileDigits)
      ) {
        errors.mobile = "Please enter a valid 10-digit mobile number";
      } else if (
        formData.country === "AU" &&
        !/^[0-9]{10}$/.test(mobileDigits)
      ) {
        errors.mobile = "Please enter a valid 9-digit mobile number";
      }
    }

    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.termsAccepted) {
      errors.termsAccepted = "You must accept the Terms & Conditions";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const userData = {
      name: formData.name.trim().toLowerCase(),
      mobile: formData.mobile.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      country: formData.country,
      countryCode: selectedCountry.dialCode,
      referralCode: formData.referralCode.trim().toUpperCase() || undefined,
    };

    try {
      const result = await dispatch(register(userData)).unwrap();
      console.log("Registration successful:", result);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Registration failed:", err);
      const errorElement = document.querySelector(".error-message");
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center items-start md:items-center p-3 md:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100">
        {/* Hero */}
        <div className="text-center">
          <img
            src={HERO_IMAGE}
            alt="WINZOX"
            loading="lazy"
            className="w-64 mx-auto object-contain"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>

        {/* Form Card */}
        <div className="mt-6 rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-full border border-amber-200 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">
                Create your account
              </h3>
              <p className="text-gray-400 text-xs">
                Fill in your details below
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formData.referralCode && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm flex items-center gap-2">
                <Gift size={16} className="text-amber-500 flex-shrink-0" />
                <span className="flex-1">
                  <strong>Referral code applied:</strong>{" "}
                  {formData.referralCode}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, referralCode: "" }))
                  }
                  className="text-amber-500 hover:text-amber-700"
                >
                  ✕
                </button>
              </div>
            )}

            {error && (
              <div className="error-message p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center justify-between">
                <span>
                  <strong>Error:</strong> {error}
                </span>
                <button
                  type="button"
                  onClick={() => dispatch(clearError())}
                  className="text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            )}

            {success && message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                <strong>Success!</strong> {message}
              </div>
            )}

            {/* Country Selection */}
            <div>
              <label className="text-sm font-bold block mb-1.5 text-gray-800">
                Country
              </label>
              <div className="relative" ref={countryDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="w-full flex items-center border border-gray-200 rounded-full px-4 h-12 bg-white hover:border-amber-300 transition-colors"
                >
                  <span className="text-2xl mr-3">{selectedCountry.flag}</span>
                  <span className="flex-1 text-left text-sm text-gray-900">
                    {selectedCountry.name}
                  </span>
                  <span className="text-sm text-gray-500 mr-2">
                    {selectedCountry.dialCode}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${
                      showCountryDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown */}
                {showCountryDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {countries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => handleCountrySelect(country.code)}
                        className={`w-full flex items-center px-4 py-3 hover:bg-amber-50 transition-colors ${
                          formData.country === country.code ? "bg-amber-50" : ""
                        }`}
                      >
                        <span className="text-2xl mr-3">{country.flag}</span>
                        <span className="flex-1 text-left text-sm text-gray-900">
                          {country.name}
                        </span>
                        <span className="text-sm text-gray-500 mr-2">
                          {country.dialCode}
                        </span>
                        {formData.country === country.code && (
                          <span className="text-amber-500">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {formErrors.country && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {formErrors.country}
                </p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="text-sm font-bold block mb-1.5 text-gray-800">
                Full Name
              </label>
              <div
                className={`flex items-center border ${
                  formErrors.name ? "border-red-400" : "border-gray-200"
                } rounded-full px-4 h-12 bg-white`}
              >
                <User size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="bg-transparent flex-1 outline-none px-2.5 text-sm text-gray-900 placeholder-gray-400"
                />
              </div>
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="text-sm font-bold block mb-1.5 text-gray-800">
                Mobile Number
              </label>
              <div
                className={`flex items-center border ${
                  formErrors.mobile ? "border-red-400" : "border-gray-200"
                } rounded-full px-4 h-12 bg-white`}
              >
                <Phone size={16} className="text-gray-400 flex-shrink-0" />
                <span className="mx-2 text-sm font-medium text-gray-600 flex-shrink-0">
                  {selectedCountry.flag} {selectedCountry.dialCode}
                </span>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  className="bg-transparent flex-1 outline-none text-sm text-gray-900 placeholder-gray-400"
                />
              </div>
              {formErrors.mobile && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {formErrors.mobile}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-bold block mb-1.5 text-gray-800">
                Email Address
              </label>
              <div
                className={`flex items-center border ${
                  formErrors.email ? "border-red-400" : "border-gray-200"
                } rounded-full px-4 h-12 bg-white`}
              >
                <Mail size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className="bg-transparent flex-1 outline-none px-2.5 text-sm text-gray-900 placeholder-gray-400"
                />
              </div>
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {formErrors.email}
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
                  formErrors.password ? "border-red-400" : "border-gray-200"
                } rounded-full px-4 h-12 bg-white`}
              >
                <Lock size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="bg-transparent flex-1 outline-none px-2.5 text-sm text-gray-900 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-bold block mb-1.5 text-gray-800">
                Confirm Password
              </label>
              <div
                className={`flex items-center border ${
                  formErrors.confirmPassword
                    ? "border-red-400"
                    : "border-gray-200"
                } rounded-full px-4 h-12 bg-white`}
              >
                <Lock size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="bg-transparent flex-1 outline-none px-2.5 text-sm text-gray-900 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Referral Code */}
            <div>
              <label className="text-sm font-bold block mb-1.5 text-gray-800">
                Referral Code (Optional)
              </label>
              <div className="flex items-center border border-gray-200 rounded-full px-4 h-12 bg-white">
                <Gift size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleChange}
                  placeholder="Enter referral code (if any)"
                  className="bg-transparent flex-1 outline-none px-2.5 text-sm text-gray-900 placeholder-gray-400"
                  maxLength="10"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                className={`mt-0.5 w-4 h-4 accent-amber-500 ${
                  formErrors.termsAccepted
                    ? "outline outline-1 outline-red-400"
                    : ""
                } rounded`}
              />
              <div>
                <p className="text-xs text-gray-500">
                  I agree to the{" "}
                  <span className="text-amber-500 font-semibold cursor-pointer hover:underline">
                    Terms &amp; Conditions
                  </span>{" "}
                  &{" "}
                  <span className="text-amber-500 font-semibold cursor-pointer hover:underline">
                    Privacy Policy
                  </span>
                </p>
                {formErrors.termsAccepted && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.termsAccepted}
                  </p>
                )}
              </div>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className={`h-12 rounded-full w-full bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-black font-bold text-base tracking-wide transition-all duration-300 ${
                loading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:from-amber-500 hover:to-amber-600"
              }`}
            >
              {loading ? "REGISTERING..." : "REGISTER"}
            </button>

            {/* Secure Registration */}
            <div className="rounded-2xl border border-gray-100 p-4 flex gap-3 items-center">
              <div className="w-11 h-11 rounded-full border border-amber-200 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={20} className="text-amber-500" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900">
                  100% Secure Registration
                </h4>
                <p className="text-gray-500 text-xs">
                  Your data is encrypted and always protected.
                </p>
              </div>
            </div>

            <p className="text-center text-gray-500 text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-amber-500 font-semibold hover:underline"
              >
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
