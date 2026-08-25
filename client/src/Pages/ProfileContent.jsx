import {
  BadgeCheck,
  Calendar,
  Camera,
  Copy,
  Currency,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
  Wallet,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  clearError,
  clearMessage,
  getProfile,
  updateProfile,
} from "../redux/slices/authSlice";

// ======================================================
// CURRENCY SYMBOL
// ======================================================

const getCurrencySymbol = (country) => {
  const symbols = {
    IN: "₹",
    NP: "रु",
    PK: "Rs",
    AU: "$",
    CA: "$",
    default: "₹",
  };

  return symbols[country] || symbols.default;
};

// ======================================================
// COMPONENT
// ======================================================

export default function ProfileContent({
  formatCurrency: propFormatCurrency,
  currencySymbol: propCurrencySymbol,
}) {
  const dispatch = useDispatch();

  const { user, loading, error, profileLoaded } = useSelector(
    (state) => state.auth,
  );

  // ======================================================
  // CURRENCY
  // ======================================================

  const currencySymbol = propCurrencySymbol || getCurrencySymbol(user?.country);

  const formatCurrency =
    propFormatCurrency ||
    ((amount) =>
      `${currencySymbol}${Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`);

  // ======================================================
  // PROFILE STATE
  // ======================================================

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    mobile: "",
    city: "",
    referralCode: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [updateStatus, setUpdateStatus] = useState(null);

  // ======================================================
  // PROFILE IMAGE STATE
  // ======================================================

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const fileInputRef = useRef(null);

  // ======================================================
  // GET PROFILE
  // ======================================================

  useEffect(() => {
    if (!profileLoaded && !loading) {
      dispatch(getProfile());
    }
  }, [dispatch, profileLoaded, loading]);

  // ======================================================
  // SET PROFILE DATA
  // ======================================================

  useEffect(() => {
    if (user && !loading) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        city: user.city || "",
        referralCode: user.referralCode || "",
      });
    }
  }, [user, loading]);

  // ======================================================
  // ACCOUNT AGE
  // ======================================================

  const calculateAccountAge = () => {
    if (!user?.createdAt) return "N/A";

    const createdDate = new Date(user.createdAt);
    const today = new Date();

    const diffTime = Math.abs(today - createdDate);

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return `${diffDays} Days`;
  };

  // ======================================================
  // STATS
  // ======================================================

  const stats = [
    {
      title: "Available Balance",
      value: formatCurrency(user?.balance?.local || 0),
      icon: Currency,
      color: "text-amber-500",
    },
    {
      title: "Wallet Balance",
      value: formatCurrency(user?.balance?.local || 0),
      icon: Wallet,
      color: "text-green-600",
    },
    {
      title: "Referral Earnings",
      value: formatCurrency(user?.referralEarning || 0),
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Referrals",
      value: user?.totalReferrals || 0,
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Account Age",
      value: calculateAccountAge(),
      icon: Calendar,
      color: "text-pink-600",
    },
  ];

  // ======================================================
  // HANDLE INPUT CHANGE
  // ======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
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

    setUpdateStatus(null);
  };

  // ======================================================
  // IMAGE CHANGE
  // ======================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUpdateStatus({
        type: "error",
        message: "Please select a valid image file.",
      });

      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUpdateStatus({
        type: "error",
        message: "Image size must be less than 5MB.",
      });

      e.target.value = "";
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setSelectedImage(file);
    setImagePreview(previewUrl);
    setUpdateStatus(null);
  };

  // ======================================================
  // VALIDATE FORM
  // ======================================================

  const validateForm = () => {
    const errors = {};

    if (!profile.name.trim()) {
      errors.name = "Full name is required";
    } else if (profile.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!profile.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    const cleanMobile = profile.mobile.replace(/\D/g, "");

    if (!profile.mobile.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(cleanMobile)) {
      errors.mobile = "Please enter a valid 10-digit mobile number";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // ======================================================
  // SAVE PROFILE
  // ======================================================

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsEditing(true);
    setUpdateStatus(null);

    try {
      const formData = new FormData();

      formData.append("fullName", profile.name.trim());

      formData.append("email", profile.email.trim());

      formData.append("mobile", profile.mobile.replace(/\D/g, ""));

      formData.append("city", profile.city.trim());

      if (selectedImage) {
        formData.append("profilePic", selectedImage);
      }

      await dispatch(updateProfile(formData)).unwrap();

      setUpdateStatus({
        type: "success",
        message: "Profile updated successfully!",
      });

      setSelectedImage(null);

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await dispatch(getProfile());

      dispatch(clearMessage());
    } catch (err) {
      setUpdateStatus({
        type: "error",
        message:
          typeof err === "string"
            ? err
            : err?.message || "Failed to update profile",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // ======================================================
  // RESET
  // ======================================================

  const handleReset = () => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        city: user.city || "",
        referralCode: user.referralCode || "",
      });
    }

    setFormErrors({});
    setUpdateStatus(null);
    setSelectedImage(null);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (error) {
      dispatch(clearError());
    }
  };

  // ======================================================
  // COPY REFERRAL
  // ======================================================

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(profile.referralCode || "");

      setUpdateStatus({
        type: "success",
        message: "Referral code copied to clipboard!",
      });

      setTimeout(() => {
        setUpdateStatus(null);
      }, 3000);
    } catch {
      setUpdateStatus({
        type: "error",
        message: "Failed to copy referral code.",
      });
    }
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading && !user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2
            className="animate-spin text-amber-500 mx-auto mb-4"
            size={48}
          />

          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // ======================================================
  // PROFILE IMAGE
  // ======================================================

  const profileImage =
    imagePreview ||
    user?.profilePic ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.name || "User",
    )}&background=ffffff&color=amber&size=128`;

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* ================================================
            PROFILE HEADER
        ================================================ */}

        <div
          className="bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] rounded-2xl p-4 sm:p-6"
        >
          <div className="flex items-center gap-4">
            {/* Profile Image */}
            <div className="relative flex-shrink-0">
              <img
                src={profileImage}
                alt="Profile"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white object-cover"
              />

              {/* Camera Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isEditing}
                className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-md flex items-center justify-center text-amber-500 hover:bg-gray-100 transition disabled:opacity-50"
                title="Change profile picture"
              >
                <Camera size={15} />
              </button>

              {/* Hidden Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-black truncate">
                {user?.name || "User"}
              </h2>

              <p className="text-black/80 text-xs sm:text-sm truncate">
                @{user?._id?.slice(-8) || "N/A"}
              </p>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <BadgeCheck size={14} className="text-black flex-shrink-0" />

                <span className="text-black/90 text-xs sm:text-sm font-medium">
                  {user?.status === "blocked" ? "Blocked" : "Active"}
                </span>

                <span className="text-black/90 text-xs sm:text-sm font-medium">
                  •
                </span>

                <span className="text-black/90 text-xs sm:text-sm font-medium">
                  Silver Member
                </span>
              </div>
            </div>
          </div>

          {selectedImage && (
            <p className="mt-3 text-white/90 text-xs">
              New profile picture selected. Click "Save Changes" to upload it.
            </p>
          )}
        </div>

        {/* ================================================
            STATS
        ================================================ */}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
          {stats.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-2.5 sm:p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Icon className={item.color} size={14} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-gray-500 text-[10px] sm:text-xs truncate">
                      {item.title}
                    </p>

                    <h2
                      className={`text-xs sm:text-sm font-bold ${item.color} truncate`}
                    >
                      {item.value}
                    </h2>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================================================
            PERSONAL INFORMATION
        ================================================ */}

        <div className="mt-3 sm:mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 sm:py-4 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-bold text-gray-800">
              Personal Information
            </h2>

            <p className="text-gray-500 text-xs sm:text-sm">
              Update your account information.
            </p>
          </div>

          <div className="p-4 sm:p-6">
            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Status */}
            {updateStatus && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs sm:text-sm ${
                  updateStatus.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-600"
                    : "bg-red-50 border border-red-200 text-red-600"
                }`}
              >
                {updateStatus.message}
              </div>
            )}

            <div className="space-y-4">
              {/* ==========================================
                  FULL NAME
              ========================================== */}

              <div>
                <label className="font-semibold text-gray-700 text-xs sm:text-sm">
                  Full Name *
                </label>

                <div className="relative mt-1">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />

                  <input
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    disabled={isEditing}
                    className={`w-full h-10 rounded-xl border ${
                      formErrors.name ? "border-red-400" : "border-gray-300"
                    } pl-9 pr-3 bg-gray-50 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none text-sm disabled:opacity-60`}
                  />
                </div>

                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* ==========================================
                  EMAIL
              ========================================== */}

              <div>
                <label className="font-semibold text-gray-700 text-xs sm:text-sm">
                  Email Address *
                </label>

                <div className="relative mt-1">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />

                  <input
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleChange}
                    disabled={isEditing}
                    className={`w-full h-10 rounded-xl border ${
                      formErrors.email ? "border-red-400" : "border-gray-300"
                    } pl-9 pr-3 bg-gray-50 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none text-sm disabled:opacity-60`}
                  />
                </div>

                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* ==========================================
                  MOBILE
              ========================================== */}

              <div>
                <label className="font-semibold text-gray-700 text-xs sm:text-sm">
                  Mobile Number *
                </label>

                <div className="relative mt-1">
                  <Phone
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />

                  <input
                    name="mobile"
                    value={profile.mobile}
                    onChange={handleChange}
                    disabled={isEditing}
                    inputMode="numeric"
                    className={`w-full h-10 rounded-xl border ${
                      formErrors.mobile ? "border-red-400" : "border-gray-300"
                    } pl-9 pr-3 bg-gray-50 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none text-sm disabled:opacity-60`}
                  />
                </div>

                {formErrors.mobile && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.mobile}
                  </p>
                )}
              </div>

              {/* ==========================================
                  CITY
              ========================================== */}

              <div>
                <label className="font-semibold text-gray-700 text-xs sm:text-sm">
                  City
                </label>

                <div className="relative mt-1">
                  <MapPin
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />

                  <input
                    name="city"
                    value={profile.city}
                    onChange={handleChange}
                    disabled={isEditing}
                    className="w-full h-10 rounded-xl border border-gray-300 pl-9 pr-3 bg-gray-50 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none text-sm disabled:opacity-60"
                    placeholder="Enter your city"
                  />
                </div>
              </div>

              {/* ==========================================
                  REFERRAL CODE
              ========================================== */}

              <div>
                <label className="font-semibold text-gray-700 text-xs sm:text-sm">
                  Referral Code
                </label>

                <div className="relative mt-1">
                  <input
                    readOnly
                    value={profile.referralCode}
                    className="w-full h-10 rounded-xl border border-gray-300 bg-gray-100 px-3 pr-12 uppercase font-mono text-sm"
                  />

                  <button
                    type="button"
                    onClick={handleCopyReferral}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-600 transition-colors"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* ==========================================
                BUTTONS
            ========================================== */}

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isEditing}
                className="w-full h-10 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition text-sm disabled:opacity-50"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isEditing}
                className={`w-full h-10 rounded-xl bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-black font-semibold transition text-sm ${
                  isEditing
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:scale-[1.02]"
                }`}
              >
                {isEditing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
