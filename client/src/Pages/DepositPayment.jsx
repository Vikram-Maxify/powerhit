import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  FileText,
  Image as ImageIcon,
  Landmark,
  Loader2,
  QrCode,
  ShieldCheck,
  Upload,
  Wallet,
  XCircle,
} from "lucide-react";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

import {
  clearDepositState,
  createDeposit,
} from "../redux/slices/depositSlice";

const DepositPayment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    loading,
    success,
    message,
    error: apiError,
  } = useSelector((state) => state.deposit);

  const selectedMethod = location.state?.method;
  const amount = location.state?.amount;

  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState("");

  const [touched, setTouched] = useState({
    transactionId: false,
    screenshot: false,
  });

  const [errors, setErrors] = useState({
    transactionId: "",
    screenshot: "",
  });

  // ---------------------------------------------------------
  // Redirect if payment method / amount is missing
  // ---------------------------------------------------------
  useEffect(() => {
    if (!selectedMethod || !amount) {
      toast.error("Please select a payment method and amount first");
      navigate("/deposit", { replace: true });
    }
  }, [selectedMethod, amount, navigate]);

  // ---------------------------------------------------------
  // Handle deposit success / error
  // ---------------------------------------------------------
  useEffect(() => {
    if (success) {
      toast.success(
        message || "Deposit request submitted successfully!"
      );

      dispatch(clearDepositState());

      navigate("/deposit-history", {
        replace: true,
      });
    }

    if (apiError) {
      toast.error(apiError || "Something went wrong");
      dispatch(clearDepositState());
    }
  }, [
    success,
    apiError,
    message,
    dispatch,
    navigate,
  ]);

  // ---------------------------------------------------------
  // Validation
  // ---------------------------------------------------------
  const validateTransactionId = (value) => {
    if (!value || value.trim() === "") {
      return "Please enter transaction ID";
    }

    if (value.trim().length < 3) {
      return "Transaction ID must be at least 3 characters";
    }

    return "";
  };

  const validateScreenshot = (file) => {
    if (!file) {
      return "Please upload a screenshot";
    }

    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!validTypes.includes(file.type)) {
      return "Please upload a valid image (PNG, JPG, JPEG, WEBP)";
    }

    if (file.size > 5 * 1024 * 1024) {
      return "Image size must be less than 5MB";
    }

    return "";
  };

  // ---------------------------------------------------------
  // Blur handlers
  // ---------------------------------------------------------
  const handleBlur = (field) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));

    if (field === "transactionId") {
      setErrors((prev) => ({
        ...prev,
        transactionId: validateTransactionId(transactionId),
      }));
    }

    if (field === "screenshot") {
      setErrors((prev) => ({
        ...prev,
        screenshot: validateScreenshot(screenshot),
      }));
    }
  };

  // ---------------------------------------------------------
  // Transaction ID
  // ---------------------------------------------------------
  const handleTransactionIdChange = (e) => {
    const value = e.target.value;

    setTransactionId(value);

    if (touched.transactionId) {
      setErrors((prev) => ({
        ...prev,
        transactionId: validateTransactionId(value),
      }));
    }
  };

  // ---------------------------------------------------------
  // Screenshot
  // ---------------------------------------------------------
  const handleImage = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const validationError = validateScreenshot(file);

    setScreenshot(file);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const objectUrl = URL.createObjectURL(file);

    setPreview(objectUrl);

    setTouched((prev) => ({
      ...prev,
      screenshot: true,
    }));

    setErrors((prev) => ({
      ...prev,
      screenshot: validationError,
    }));
  };

  // ---------------------------------------------------------
  // Remove screenshot
  // ---------------------------------------------------------
  const removeScreenshot = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setScreenshot(null);
    setPreview("");

    setTouched((prev) => ({
      ...prev,
      screenshot: false,
    }));

    setErrors((prev) => ({
      ...prev,
      screenshot: "",
    }));
  };

  // ---------------------------------------------------------
  // Method icon
  // ---------------------------------------------------------
  const getMethodIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "bank":
      case "bank transfer":
        return <Landmark className="w-4 h-4" />;

      case "upi":
        return <QrCode className="w-4 h-4" />;

      case "card":
        return <CreditCard className="w-4 h-4" />;

      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  // ---------------------------------------------------------
  // UPI details
  // ---------------------------------------------------------
  const upiId =
    selectedMethod?.details?.upiId ||
    selectedMethod?.upiId ||
    "";

  const isUPI =
    selectedMethod?.type?.toLowerCase() === "upi" ||
    Boolean(upiId);

  // ---------------------------------------------------------
  // Generate UPI payment URL
  // ---------------------------------------------------------
  const getUpiPaymentUrl = () => {
    if (!upiId) return "";

    const params = new URLSearchParams();

    params.set("pa", upiId);

    params.set(
      "pn",
      selectedMethod?.details?.payeeName ||
        selectedMethod?.title ||
        "Payment"
    );

    if (amount) {
      params.set("am", Number(amount).toFixed(2));
    }

    params.set("cu", "INR");

    if (selectedMethod?.details?.transactionNote) {
      params.set(
        "tn",
        selectedMethod.details.transactionNote
      );
    } else {
      params.set("tn", "Deposit Payment");
    }

    return `upi://pay?${params.toString()}`;
  };

  const upiPaymentUrl = getUpiPaymentUrl();

  // ---------------------------------------------------------
  // Copy UPI ID
  // ---------------------------------------------------------
  const copyUpiId = async () => {
    if (!upiId) return;

    try {
      await navigator.clipboard.writeText(upiId);
      toast.success("UPI ID copied!");
    } catch (error) {
      toast.error("Unable to copy UPI ID");
    }
  };

  // ---------------------------------------------------------
  // Copy normal detail
  // ---------------------------------------------------------
  const copyValue = async (value) => {
    if (
      value === null ||
      value === undefined ||
      typeof value === "object"
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(String(value));
      toast.success("Copied!");
    } catch (error) {
      toast.error("Unable to copy");
    }
  };

  // ---------------------------------------------------------
  // Submit
  // ---------------------------------------------------------
  const submitHandler = (e) => {
    e.preventDefault();

    const transactionError =
      validateTransactionId(transactionId);

    const screenshotError =
      validateScreenshot(screenshot);

    setTouched({
      transactionId: true,
      screenshot: true,
    });

    setErrors({
      transactionId: transactionError,
      screenshot: screenshotError,
    });

    if (transactionError || screenshotError) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    const form = new FormData();

    form.append("amount", amount);
    form.append(
      "transactionId",
      transactionId.trim()
    );

    form.append(
      "methodType",
      selectedMethod?.type || ""
    );

    form.append(
      "methodTitle",
      selectedMethod?.title || ""
    );

    form.append("screenshot", screenshot);

    dispatch(createDeposit(form));
  };

  // ---------------------------------------------------------
  // Don't render if data missing
  // ---------------------------------------------------------
  if (!selectedMethod || !amount) {
    return null;
  }

  // ---------------------------------------------------------
  // Normal payment details
  //
  // Hide "qr" because we generate QR ourselves.
  // Hide "upiId" here because it gets a dedicated section.
  // ---------------------------------------------------------
  const paymentDetails = Object.entries(
    selectedMethod.details || {}
  ).filter(([key]) => {
    const normalizedKey = key.toLowerCase();

    return (
      normalizedKey !== "qr" &&
      normalizedKey !== "upiid" &&
      normalizedKey !== "upivpa"
    );
  });

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-white overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -top-24 -left-20 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl" />

      <div className="pointer-events-none absolute top-1/3 -right-24 w-64 h-64 bg-yellow-200/25 rounded-full blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 left-0 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl" />

      <div className="relative px-4 sm:px-6 py-6">
        <div className="max-w-md w-full mx-auto">

          {/* Back */}
          <button
            type="button"
            onClick={() => navigate("/deposit")}
            className="flex items-center gap-1 text-gray-500 text-xs font-medium mb-4 hover:text-amber-600 transition w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          {/* Header */}
          <div className="mb-6">
            <span className="flex gap-2 items-center">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-200">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Complete Payment
              </h1>
            </span>

            <p className="text-sm text-gray-400 mt-1 ml-[3rem]">
              Pay using the details below, then confirm
            </p>
          </div>

          {/* Amount + Method */}
          <div className="mb-5 bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100 px-5 py-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wide text-gray-400 font-medium block">
                Amount to pay
              </span>

              <span className="text-xl font-bold text-gray-900">
                ₹
                {Number(amount).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm">
              {getMethodIcon(selectedMethod.type)}

              <span className="text-xs font-semibold">
                {selectedMethod.title}
              </span>
            </div>
          </div>

          {/* =================================================
              UPI QR SECTION
          ================================================= */}
          {isUPI && upiId && (
            <div className="mb-5 bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100 p-5">

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Scan & Pay
                  </h3>

                  <p className="text-[11px] text-gray-400 mt-1">
                    Scan this QR using any UPI app
                  </p>
                </div>

                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-amber-600" />
                </div>
              </div>

              {/* QR */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">

                  <QRCodeSVG
                    value={upiPaymentUrl}
                    size={220}
                    level="H"
                    includeMargin={true}
                  />

                </div>
              </div>

              {/* Amount */}
              <div className="mt-4 text-center">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                  Payment Amount
                </p>

                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  ₹
                  {Number(amount).toLocaleString("en-IN")}
                </p>
              </div>

              {/* UPI ID */}
              <div className="mt-4 bg-gray-50/70 rounded-xl border border-gray-100 p-3">

                <div className="flex items-center justify-between gap-2">

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      UPI ID
                    </p>

                    <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">
                      {upiId}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={copyUpiId}
                    className="shrink-0 p-2 rounded-lg bg-white border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition"
                    title="Copy UPI ID"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                  </button>

                </div>

              </div>

              <p className="text-[10px] text-gray-400 text-center mt-3">
                Open Google Pay, PhonePe, Paytm or another UPI app
                and scan the QR code.
              </p>
            </div>
          )}

          {/* =================================================
              PAYMENT DETAILS
          ================================================= */}
          {(paymentDetails.length > 0 || (!isUPI && selectedMethod.details)) && (
            <div className="mb-5 bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100 p-5">

              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3.5">
                Payment Details
              </h3>

              <div className="space-y-2.5">

                {paymentDetails.map(([key, value]) => {

                  if (
                    value === null ||
                    value === undefined ||
                    value === ""
                  ) {
                    return null;
                  }

                  // Don't display objects directly
                  if (typeof value === "object") {
                    return null;
                  }

                  return (
                    <div
                      key={key}
                      className="bg-gray-50/70 px-3.5 py-2.5 rounded-xl border border-gray-100 flex items-center gap-2 overflow-hidden"
                    >

                      <span className="text-[11px] font-medium text-gray-400 capitalize whitespace-nowrap min-w-[64px]">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) =>
                            str.toUpperCase()
                          )}
                      </span>

                      <span className="flex-1 text-xs text-gray-800 font-medium truncate">
                        {String(value)}
                      </span>

                      <button
                        type="button"
                        className="p-1.5 rounded-md bg-white border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition"
                        onClick={() =>
                          copyValue(value)
                        }
                      >
                        <Copy className="w-3 h-3 text-gray-500" />
                      </button>

                    </div>
                  );
                })}

              </div>
            </div>
          )}

          {/* =================================================
              CONFIRM PAYMENT FORM
          ================================================= */}
          <form
            onSubmit={submitHandler}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100 p-5"
          >

            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Confirm Payment
            </h3>

            {/* Transaction ID */}
            <div>

              <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1.5">
                <FileText className="w-3 h-3 text-amber-500" />
                Transaction ID
              </label>

              <div className="relative">

                <input
                  type="text"
                  className={`w-full rounded-xl border p-3 text-sm text-gray-800 bg-gray-50/60 transition focus:outline-none focus:ring-2 ${
                    touched.transactionId &&
                    errors.transactionId
                      ? "border-red-300 focus:ring-red-100 bg-red-50/40"
                      : touched.transactionId &&
                          !errors.transactionId &&
                          transactionId
                        ? "border-green-300 focus:ring-green-100 bg-green-50/40"
                        : "border-gray-200 focus:ring-amber-100"
                  }`}
                  value={transactionId}
                  onChange={handleTransactionIdChange}
                  onBlur={() =>
                    handleBlur("transactionId")
                  }
                  placeholder="e.g. TRX-12345"
                />

                {touched.transactionId &&
                  !errors.transactionId &&
                  transactionId && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}

                {touched.transactionId &&
                  errors.transactionId && (
                    <XCircle className="w-4 h-4 text-red-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}

              </div>

              {touched.transactionId &&
                errors.transactionId && (
                  <p className="mt-1.5 text-[11px] text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.transactionId}
                  </p>
                )}

            </div>

            {/* Screenshot */}
            <div className="mt-5">

              <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1.5">
                <ImageIcon className="w-3 h-3 text-amber-500" />
                Upload Screenshot
              </label>

              <div className="relative">

                <div
                  className={`rounded-xl px-4 py-5 text-center border border-dashed transition ${
                    touched.screenshot &&
                    errors.screenshot
                      ? "border-red-300 bg-red-50/30"
                      : touched.screenshot &&
                          preview
                        ? "border-green-300 bg-green-50/30"
                        : "border-gray-200 hover:border-amber-300 bg-gray-50/40"
                  }`}
                >

                  {preview ? (
                    <div className="flex items-center gap-3">

                      <img
                        src={preview}
                        alt="Payment screenshot preview"
                        className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                      />

                      <div className="flex-1 text-left">

                        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Uploaded
                        </div>

                        <button
                          type="button"
                          className="text-[11px] text-amber-600 hover:text-amber-700 font-medium underline mt-0.5"
                          onClick={removeScreenshot}
                        >
                          Remove & re-upload
                        </button>

                      </div>

                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />

                      <p className="text-xs text-gray-500">
                        Click to upload or drag & drop
                      </p>

                      <p className="text-[10px] text-gray-400 mt-0.5">
                        PNG, JPG, JPEG, WEBP · Max 5MB
                      </p>
                    </>
                  )}

                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleImage}
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                  />

                </div>

              </div>

              {touched.screenshot &&
                errors.screenshot && (
                  <p className="mt-1.5 text-[11px] text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.screenshot}
                  </p>
                )}

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`mt-6 w-full font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-1.5 ${
                loading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-200 active:scale-[0.98]"
              }`}
            >

              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Confirm Payment
                </>
              )}

            </button>

            <p className="text-[10px] text-gray-400 mt-3 text-center">
              By submitting you agree to our deposit terms and conditions
            </p>

          </form>

        </div>
      </div>
    </div>
  );
};

export default DepositPayment;
