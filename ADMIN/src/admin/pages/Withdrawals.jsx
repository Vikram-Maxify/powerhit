// src/pages/admin/AdminWithdrawals.jsx

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllWithdrawals,
  fetchWithdrawalStats,
  updateWithdrawalStatus,
  setFilterParams,
  resetFilterParams,
  clearWithdrawalError,
} from '../redux/withdrawalSlice';
import { format } from 'date-fns';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Search,
  X,
  Eye,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock as ClockIcon,
  Wallet,
  Ban,
  Check,
  Loader,
  Sparkles,
  Download,
  Printer,
  Calendar,
  MessageSquare,
  Globe,
  User,
  Mail,
  Phone,
  CreditCard,
  Activity,
  BarChart3,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

// ============================
// Custom Hooks
// ============================

const useWithdrawalManagement = () => {
  const dispatch = useDispatch();
  const {
    withdrawals,
    stats,
    currentPage,
    totalPages,
    totalRecords,
    isLoading,
    isProcessing,
    error,
    filterParams,
  } = useSelector((state) => state.withdrawals);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusAction, setStatusAction] = useState('');
  const [formData, setFormData] = useState({
    status: '',
    rejectionReason: '',
    adminNotes: '',
    transactionId: '',
  });
  const [localFilters, setLocalFilters] = useState(filterParams);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState('30d');

  useEffect(() => {
    fetchData();
    window.scrollTo(0, 0);
  }, [dispatch, page, rowsPerPage, filterParams, statsPeriod]);

  const fetchData = useCallback(() => {
    dispatch(fetchWithdrawalStats({ period: statsPeriod }));
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      ...filterParams,
    };
    dispatch(fetchAllWithdrawals(params));
  }, [dispatch, statsPeriod, page, rowsPerPage, filterParams]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearWithdrawalError());
    }
  }, [error, dispatch]);

  return {
    withdrawals,
    stats,
    currentPage,
    totalPages,
    totalRecords,
    isLoading,
    isProcessing,
    error,
    filterParams,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    selectedWithdrawal,
    setSelectedWithdrawal,
    showStatusModal,
    setShowStatusModal,
    showDetailModal,
    setShowDetailModal,
    statusAction,
    setStatusAction,
    formData,
    setFormData,
    localFilters,
    setLocalFilters,
    isFilterOpen,
    setIsFilterOpen,
    statsPeriod,
    setStatsPeriod,
    fetchData,
    dispatch,
  };
};

// ============================
// Components
// ============================

// Stats Cards
const StatsCards = ({ stats, formatCurrency }) => {
  const statData = stats.stats || [];
  const totalAmount = statData.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCount = statData.reduce((sum, s) => sum + s.count, 0);
  const pendingCount = statData.find(s => s._id?.status === 'pending')?.count || 0;
  const processingCount = statData.find(s => s._id?.status === 'processing')?.count || 0;
  const completedCount = statData.find(s => s._id?.status === 'completed')?.count || 0;
  const rejectedCount = statData.find(s => s._id?.status === 'rejected')?.count || 0;

  const cards = [
    {
      title: 'Total Withdrawals',
      value: totalCount,
      icon: Wallet,
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-600',
      subtitle: 'All requests',
    },
    {
      title: 'Total Amount',
      value: formatCurrency(totalAmount),
      icon: DollarSign,
      color: 'purple',
      gradient: 'from-purple-500 to-violet-600',
      subtitle: 'Requested total',
    },
    {
      title: 'Pending',
      value: pendingCount,
      icon: ClockIcon,
      color: 'yellow',
      gradient: 'from-yellow-500 to-orange-600',
      subtitle: 'Awaiting action',
    },
    {
      title: 'Processing',
      value: processingCount,
      icon: Loader,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600',
      subtitle: 'In progress',
    },
    {
      title: 'Completed',
      value: completedCount,
      icon: CheckCircle,
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
      subtitle: 'Successfully done',
    },
    {
      title: 'Rejected',
      value: rejectedCount,
      icon: XCircle,
      color: 'red',
      gradient: 'from-red-500 to-rose-600',
      subtitle: 'Declined requests',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.07 }}
          className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-all duration-300 group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {card.title}
              </p>
              <p className="text-xl font-bold text-gray-800 mt-1 truncate">
                {card.value}
              </p>
              <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
            </div>
            <div className={`bg-gradient-to-br ${card.gradient} p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-2`}>
              <card.icon className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${card.gradient} rounded-full transition-all duration-500`}
              style={{ 
                width: `${Math.min((typeof card.value === 'number' ? card.value : 0) / (totalCount || 1) * 100, 100)}%` 
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Loading Skeleton
const WithdrawalSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
          <div className="h-8 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  </div>
);

// Empty State
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-3xl p-16 text-center shadow-xl border-2 border-dashed border-gray-200"
  >
    <div className="flex flex-col items-center gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-full p-6">
        <Wallet size={56} className="text-blue-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-700">No withdrawals found</h3>
      <p className="text-gray-400 max-w-md">
        No withdrawals match your current filters. Try adjusting your search criteria.
      </p>
    </div>
  </motion.div>
);

// Withdrawal Row
const WithdrawalRow = ({
  withdrawal,
  onViewDetails,
  onStatusUpdate,
  getStatusColors,
  getStatusIcon,
  formatCurrency,
  formatDate,
  isProcessing,
}) => {
  const isPending = withdrawal.status === 'pending';
  const isProcessingStatus = withdrawal.status === 'processing';

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="hover:bg-gray-50 transition-colors duration-150"
    >
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {withdrawal.user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">
              {withdrawal.user?.name || 'N/A'}
            </div>
            <div className="text-xs text-gray-500 truncate max-w-[120px]">
              {withdrawal.user?.email || 'No email'}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-1 md:hidden">
          {formatDate(withdrawal.requestedAt)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-bold text-gray-900">
          {formatCurrency(withdrawal.amount)}
        </div>
        <div className="text-xs text-gray-400">
          {withdrawal.country || 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
          <CreditCard className="w-3 h-3" />
          {withdrawal.paymentMethod?.toUpperCase() || 'N/A'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColors(withdrawal.status)}`}>
          {getStatusIcon(withdrawal.status)}
          <span className="capitalize">{withdrawal.status}</span>
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell text-sm text-gray-500">
        {formatDate(withdrawal.requestedAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <button
            onClick={() => onViewDetails(withdrawal)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {isPending && (
            <>
              <button
                onClick={() => onStatusUpdate(withdrawal, 'processing')}
                disabled={isProcessing}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Process"
              >
                <Loader className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStatusUpdate(withdrawal, 'completed')}
                disabled={isProcessing}
                className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Complete"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStatusUpdate(withdrawal, 'rejected')}
                disabled={isProcessing}
                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {isProcessingStatus && (
            <>
              <button
                onClick={() => onStatusUpdate(withdrawal, 'completed')}
                disabled={isProcessing}
                className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Complete"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStatusUpdate(withdrawal, 'rejected')}
                disabled={isProcessing}
                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </motion.tr>
  );
};

// Filter Section
const FilterSection = ({
  localFilters,
  handleFilterChange,
  applyFilters,
  resetFilters,
  fetchData,
  isLoading,
  statsPeriod,
  setStatsPeriod,
  isFilterOpen,
  setIsFilterOpen,
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 mb-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl">
            <Filter className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700">Filters & Views</h3>
        </div>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="md:hidden inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          {isFilterOpen ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      <div className={`${isFilterOpen ? 'block' : 'hidden md:block'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Status
            </label>
            <select
              name="status"
              value={localFilters.status || ''}
              onChange={handleFilterChange}
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none text-sm bg-white"
            >
              <option value="">📊 All Status</option>
              <option value="pending">⏳ Pending</option>
              <option value="processing">🔄 Processing</option>
              <option value="completed">✅ Completed</option>
              <option value="rejected">❌ Rejected</option>
              <option value="cancelled">🚫 Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={localFilters.country || ''}
              onChange={handleFilterChange}
              placeholder="Enter country"
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              From Date
            </label>
            <input
              type="date"
              name="fromDate"
              value={localFilters.fromDate || ''}
              onChange={handleFilterChange}
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              To Date
            </label>
            <input
              type="date"
              name="toDate"
              value={localFilters.toDate || ''}
              onChange={handleFilterChange}
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none text-sm bg-white"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-4">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Search
            </label>
            <input
              type="text"
              name="search"
              value={localFilters.search || ''}
              onChange={handleFilterChange}
              placeholder="Search by user name, email, mobile, or transaction ID..."
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none text-sm bg-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <Search className="w-4 h-4 mr-2" />
              Apply Filters
            </button>
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-5 py-2.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-300 transition-all duration-200"
            >
              <X className="w-4 h-4 mr-2" />
              Reset
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={statsPeriod}
                onChange={(e) => setStatsPeriod(e.target.value)}
                className="bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
            </div>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Status Update Modal
const StatusModal = ({
  isOpen,
  onClose,
  onConfirm,
  withdrawal,
  statusAction,
  formData,
  handleFormChange,
  isProcessing,
  formatCurrency,
}) => {
  if (!isOpen || !withdrawal) return null;

  const isReject = statusAction === 'rejected';
  const isComplete = statusAction === 'completed';
  const isProcess = statusAction === 'processing';

  const getModalConfig = () => {
    if (isReject) return {
      title: 'Reject Withdrawal',
      icon: XCircle,
      color: 'red',
      gradient: 'from-red-500 to-rose-600',
      message: 'Are you sure you want to reject this withdrawal? This action cannot be undone.',
    };
    if (isComplete) return {
      title: 'Complete Withdrawal',
      icon: CheckCircle,
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
      message: 'Are you sure you want to mark this withdrawal as completed?',
    };
    return {
      title: 'Process Withdrawal',
      icon: Loader,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600',
      message: 'Are you sure you want to process this withdrawal?',
    };
  };

  const config = getModalConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`bg-${config.color}-100 p-3 rounded-2xl`}>
              <Icon className={`w-6 h-6 text-${config.color}-600`} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{config.title}</h3>
          </div>

          <p className="text-gray-600 mb-4">{config.message}</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">User:</span>
              <span className="font-medium">{withdrawal.user?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount:</span>
              <span className="font-bold text-gray-900">{formatCurrency(withdrawal.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Method:</span>
              <span className="font-medium">{withdrawal.paymentMethod?.toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Country:</span>
              <span className="font-medium">{withdrawal.country || 'N/A'}</span>
            </div>
          </div>

          {isComplete && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Transaction ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="transactionId"
                value={formData.transactionId}
                onChange={handleFormChange}
                placeholder="Enter transaction ID"
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none text-sm"
                required
              />
            </div>
          )}

          {isReject && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                name="rejectionReason"
                value={formData.rejectionReason}
                onChange={handleFormChange}
                placeholder="Provide a reason for rejection..."
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none text-sm"
                required
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Admin Notes (Optional)
            </label>
            <textarea
              rows="2"
              name="adminNotes"
              value={formData.adminNotes}
              onChange={handleFormChange}
              placeholder="Add internal notes..."
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none text-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing || (isReject && !formData.rejectionReason) || (isComplete && !formData.transactionId)}
              className={`px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r ${config.gradient} rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isProcessing && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              )}
              {config.title}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Detail Modal
const DetailModal = ({
  isOpen,
  onClose,
  withdrawal,
  getStatusColors,
  getStatusIcon,
  formatCurrency,
  formatDate,
}) => {
  if (!isOpen || !withdrawal) return null;

  const details = [
    { label: 'User', value: withdrawal.user?.name || 'N/A', icon: User },
    { label: 'Email', value: withdrawal.user?.email || 'N/A', icon: Mail },
    { label: 'Mobile', value: withdrawal.user?.mobile || 'N/A', icon: Phone },
    { label: 'Country', value: withdrawal.country || 'N/A', icon: Globe },
    { label: 'Amount', value: formatCurrency(withdrawal.amount), icon: DollarSign, highlight: true },
    { label: 'Payment Method', value: withdrawal.paymentMethod?.toUpperCase() || 'N/A', icon: CreditCard },
    { label: 'Status', value: withdrawal.status, icon: Activity, isBadge: true },
    { label: 'Requested', value: formatDate(withdrawal.requestedAt), icon: Calendar },
    { label: 'Processed', value: withdrawal.processedAt ? formatDate(withdrawal.processedAt) : 'N/A', icon: Loader },
    { label: 'Completed', value: withdrawal.completedAt ? formatDate(withdrawal.completedAt) : 'N/A', icon: CheckCircle },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 p-6 rounded-t-3xl flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Withdrawal Details</h2>
              <p className="text-purple-100 text-sm">
                Request #{withdrawal._id?.slice(-8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Amount Highlight */}
          <div className="mb-6 bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 p-6 rounded-2xl border-2 border-purple-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">Withdrawal Amount</p>
              <p className="text-4xl font-bold text-gray-800 mt-1">
                {formatCurrency(withdrawal.amount)}
              </p>
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border mt-2 ${getStatusColors(withdrawal.status)}`}>
                {getStatusIcon(withdrawal.status)}
                <span className="capitalize">{withdrawal.status}</span>
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {details.map((item, index) => {
              if (item.isBadge) {
                return (
                  <div key={index} className="bg-gray-50 rounded-xl p-4">
                    <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                      <item.icon className="w-3 h-3" />
                      {item.label}
                    </label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColors(item.value)}`}>
                        {getStatusIcon(item.value)}
                        <span className="capitalize">{item.value}</span>
                      </span>
                    </div>
                  </div>
                );
              }
              return (
                <div key={index} className={`${item.highlight ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200' : 'bg-gray-50'} rounded-xl p-4`}>
                  <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                    <item.icon className="w-3 h-3" />
                    {item.label}
                  </label>
                  <p className={`mt-1 ${item.highlight ? 'text-xl font-bold text-emerald-600' : 'text-sm font-medium text-gray-900'} break-all`}>
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Additional Info */}
          {(withdrawal.transactionId || withdrawal.rejectionReason || withdrawal.adminNotes || withdrawal.processedBy) && (
            <div className="mt-4 space-y-3">
              {withdrawal.transactionId && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <label className="text-xs font-medium text-blue-700 uppercase flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    Transaction ID
                  </label>
                  <p className="text-sm font-mono text-gray-700 mt-1">{withdrawal.transactionId}</p>
                </div>
              )}

              {withdrawal.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <label className="text-xs font-medium text-red-700 uppercase flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Rejection Reason
                  </label>
                  <p className="text-sm text-red-700 mt-1">{withdrawal.rejectionReason}</p>
                </div>
              )}

              {withdrawal.adminNotes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <label className="text-xs font-medium text-amber-700 uppercase flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Admin Notes
                  </label>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{withdrawal.adminNotes}</p>
                </div>
              )}

              {withdrawal.processedBy && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Processed By
                  </label>
                  <p className="text-sm font-medium text-gray-700 mt-1">{withdrawal.processedBy?.name || 'N/A'}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================
// Main Component
// ============================

const AdminWithdrawals = () => {
  const {
    withdrawals,
    stats,
    totalPages,
    totalRecords,
    isLoading,
    isProcessing,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    selectedWithdrawal,
    setSelectedWithdrawal,
    showStatusModal,
    setShowStatusModal,
    showDetailModal,
    setShowDetailModal,
    statusAction,
    setStatusAction,
    formData,
    setFormData,
    localFilters,
    setLocalFilters,
    isFilterOpen,
    setIsFilterOpen,
    statsPeriod,
    setStatsPeriod,
    fetchData,
    dispatch,
  } = useWithdrawalManagement();

  // ============================
  // Handlers
  // ============================

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
  }, [setLocalFilters]);

  const applyFilters = useCallback(() => {
    dispatch(setFilterParams(localFilters));
    setPage(0);
    setIsFilterOpen(false);
    toast.info('🔍 Filters applied');
  }, [dispatch, localFilters, setPage, setIsFilterOpen]);

  const resetFilters = useCallback(() => {
    dispatch(resetFilterParams());
    setLocalFilters({});
    setPage(0);
    toast.info('🔄 Filters reset');
  }, [dispatch, setLocalFilters, setPage]);

  const handleStatusUpdate = useCallback((withdrawal, action) => {
    setSelectedWithdrawal(withdrawal);
    setStatusAction(action);
    setFormData({
      status: action,
      rejectionReason: '',
      adminNotes: '',
      transactionId: '',
    });
    setShowStatusModal(true);
  }, [setSelectedWithdrawal, setStatusAction, setFormData, setShowStatusModal]);

  const confirmStatusUpdate = useCallback(async () => {
    try {
      await dispatch(updateWithdrawalStatus({
        id: selectedWithdrawal._id,
        ...formData,
      }));
      toast.success(`✅ Withdrawal ${formData.status === 'completed' ? 'completed' : formData.status === 'rejected' ? 'rejected' : 'processed'} successfully!`);
      setShowStatusModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update withdrawal status');
    }
  }, [dispatch, selectedWithdrawal, formData, setShowStatusModal, fetchData]);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, [setFormData]);

  const handleViewDetails = useCallback((withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailModal(true);
  }, [setSelectedWithdrawal, setShowDetailModal]);

  // ============================
  // Helper Functions
  // ============================

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid Date';
    }
  }, []);

  const getStatusColors = useCallback((status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      processing: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  }, []);

  const getStatusIcon = useCallback((status) => {
    const icons = {
      pending: <Clock className="w-3 h-3" />,
      processing: <Loader className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />,
      rejected: <XCircle className="w-3 h-3" />,
      cancelled: <Ban className="w-3 h-3" />,
    };
    return icons[status] || null;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
              <Sparkles className="text-purple-600" size={32} />
              Withdrawal Management
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {totalRecords} withdrawals • {statsPeriod === '7d' ? 'Last 7 days' : statsPeriod === '30d' ? 'Last 30 days' : statsPeriod === '90d' ? 'Last 90 days' : 'Last year'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.info('📥 Export feature coming soon')}
              className="p-2.5 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Download size={20} className="text-gray-600" />
            </button>
            <button
              onClick={() => window.print()}
              className="p-2.5 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Printer size={20} className="text-gray-600" />
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <StatsCards stats={stats} formatCurrency={formatCurrency} />

        {/* Filters */}
        <FilterSection
          localFilters={localFilters}
          handleFilterChange={handleFilterChange}
          applyFilters={applyFilters}
          resetFilters={resetFilters}
          fetchData={fetchData}
          isLoading={isLoading}
          statsPeriod={statsPeriod}
          setStatsPeriod={setStatsPeriod}
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
        />

        {/* Withdrawals Table */}
        {isLoading ? (
          <WithdrawalSkeleton />
        ) : (
          <AnimatePresence mode="popLayout">
            {withdrawals.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Requested
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {withdrawals.map((withdrawal) => (
                        <WithdrawalRow
                          key={withdrawal._id}
                          withdrawal={withdrawal}
                          onViewDetails={handleViewDetails}
                          onStatusUpdate={handleStatusUpdate}
                          getStatusColors={getStatusColors}
                          getStatusIcon={getStatusIcon}
                          formatCurrency={formatCurrency}
                          formatDate={formatDate}
                          isProcessing={isProcessing}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-4">
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <span>Rows per page:</span>
                      <select
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(parseInt(e.target.value, 10));
                          setPage(0);
                        }}
                        className="rounded-xl border-2 border-gray-200 px-2 py-1.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none text-sm bg-white"
                      >
                        {[10, 20, 50, 100].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                      <span className="hidden sm:inline">
                        {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, totalRecords)} of {totalRecords}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="inline-flex items-center px-4 py-2 text-sm border-2 border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </button>
                      <span className="text-sm font-medium text-gray-700 px-3 py-1 bg-white rounded-lg border border-gray-200">
                        {page + 1} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        className="inline-flex items-center px-4 py-2 text-sm border-2 border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState />
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showDetailModal && selectedWithdrawal && (
          <DetailModal
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            withdrawal={selectedWithdrawal}
            getStatusColors={getStatusColors}
            getStatusIcon={getStatusIcon}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        )}

        {showStatusModal && selectedWithdrawal && (
          <StatusModal
            isOpen={showStatusModal}
            onClose={() => setShowStatusModal(false)}
            onConfirm={confirmStatusUpdate}
            withdrawal={selectedWithdrawal}
            statusAction={statusAction}
            formData={formData}
            handleFormChange={handleFormChange}
            isProcessing={isProcessing}
            formatCurrency={formatCurrency}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminWithdrawals;