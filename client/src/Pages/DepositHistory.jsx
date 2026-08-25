import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  FileText,
  XCircle,
} from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMyDeposits } from "../redux/slices/depositSlice";

const DepositHistory = () => {
  const dispatch = useDispatch();

  const { deposits, loading } = useSelector((state) => state.deposit);

  useEffect(() => {
    dispatch(getMyDeposits());
  }, [dispatch]);

  const getStatusBadge = (status) => {
    const configs = {
      approved: {
        icon: CheckCircle2,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Approved",
      },
      rejected: {
        icon: XCircle,
        className: "bg-red-50 text-red-700 border-red-200",
        label: "Rejected",
      },
      pending: {
        icon: Clock,
        className: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Pending",
      },
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${config.className}`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const copyTransactionId = (transactionId) => {
    navigator.clipboard.writeText(transactionId);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-gradient-to-b from-amber-50/50 via-white to-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400 font-medium">
            Loading deposits...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-b from-amber-50/50 via-white to-white overflow-hidden">
      {/* Decorative background orbs */}
      <div className="pointer-events-none absolute -top-24 -right-20 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-24 w-64 h-64 bg-yellow-200/25 rounded-full blur-3xl" />

      <div className="relative px-4 sm:px-6 py-6">
        <div className="max-w-md w-full mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-200 flex-shrink-0">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  Deposit History
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Your recent deposit transactions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl shadow-sm border border-gray-100 flex-shrink-0">
              <span className="text-xs font-medium text-gray-400">Total</span>
              <span className="text-sm font-bold text-gray-900">
                {deposits.length}
              </span>
            </div>
          </div>

          {deposits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100 p-10 text-center">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity className="w-5 h-5 text-amber-400" />
              </div>
              <h5 className="text-sm font-semibold text-gray-700 mb-1">
                No Deposits Found
              </h5>
              <p className="text-xs text-gray-400">
                You haven't made any deposits yet. Start your first deposit
                today!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deposits.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100 hover:shadow-md hover:shadow-gray-100 transition-shadow duration-200 p-4"
                >
                  {/* Top row: Amount + Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-gray-900">
                      ₹{parseFloat(item.amount).toLocaleString("en-IN")}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <CreditCard className="w-3.5 h-3.5" />
                        Method
                      </span>
                      <span className="font-medium text-gray-700">
                        {item.methodTitle}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        Date
                      </span>
                      <span className="font-medium text-gray-700">
                        {new Date(item.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs pt-2 mt-2 border-t border-gray-100">
                      <span className="flex items-center gap-1.5 text-gray-400 flex-shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                        Txn ID
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-gray-700 truncate">
                          {item.transactionId}
                        </span>
                        <button
                          type="button"
                          className="flex-shrink-0 p-1 hover:bg-amber-50 rounded-md transition-colors"
                          onClick={() => copyTransactionId(item.transactionId)}
                          title="Copy Transaction ID"
                        >
                          <Copy className="w-3 h-3 text-gray-400 hover:text-amber-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositHistory;
