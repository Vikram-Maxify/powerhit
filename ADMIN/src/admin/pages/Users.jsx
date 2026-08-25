// src/pages/admin/Users.jsx

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllUsers,
  updateUserStatus,
} from "../redux/adminAuthSlice";
import {
  Users as UsersIcon,
  Search,
  Shield,
  User,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  X,
  Clock,
  DollarSign,
  Gift,
  AlertCircle,
  RefreshCw,
  Filter,
  Grid,
  List,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserX,
  Award,
  Calendar,
  MapPin,
  Smartphone,
  Hash,
  Link,
  Wallet,
  Activity,
  BarChart3,
} from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

// ============================
// Custom Hooks
// ============================

const useUserManagement = () => {
  const dispatch = useDispatch();
  const {
    users,
    userCount,
    loading,
    error,
    message,
    statusUpdateLoading,
    statusUpdateError,
    admin,
  } = useSelector((state) => state.adminAuth);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);

  const usersPerPage = 10;

  useEffect(() => {
    dispatch(getAllUsers());
    window.scrollTo(0, 0);
  }, [dispatch]);

  useEffect(() => {
    if (message) {
      dispatch(getAllUsers());
      toast.success(message);
    }
  }, [message, dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (statusUpdateError) toast.error(statusUpdateError);
  }, [statusUpdateError]);

  const filteredAndSortedUsers = useMemo(() => {
    if (!users) return [];

    let filtered = users.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile?.includes(searchTerm);
      const matchesRole = filterRole === "all" || user.role === filterRole;
      const matchesStatus = filterStatus === "all" || user.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "name":
          return a.name?.localeCompare(b.name);
        case "balance":
          return (b.balance || 0) - (a.balance || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [users, searchTerm, filterRole, filterStatus, sortBy]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredAndSortedUsers.slice(startIndex, endIndex);
  }, [filteredAndSortedUsers, currentPage, usersPerPage]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage);

  const stats = useMemo(() => ({
    total: userCount || 0,
    active: users?.filter(u => u.status === "active").length || 0,
    blocked: users?.filter(u => u.status === "blocked").length || 0,
    admins: users?.filter(u => u.role === "admin").length || 0,
  }), [users, userCount]);

  return {
    users: paginatedUsers,
    allUsers: filteredAndSortedUsers,
    stats,
    loading,
    statusUpdateLoading,
    statusChangeLoading,
    setStatusChangeLoading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    filterRole,
    setFilterRole,
    filterStatus,
    setFilterStatus,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    selectedUser,
    setSelectedUser,
    showModal,
    setShowModal,
    admin,
    totalPages,
    usersPerPage,
    dispatch,
  };
};

// ============================
// Components
// ============================

// Stats Cards
const StatsCards = ({ stats }) => {
  const cards = [
    {
      title: "Total Users",
      value: stats.total,
      icon: UsersIcon,
      color: "indigo",
      gradient: "from-indigo-500 to-blue-600",
    },
    {
      title: "Active Users",
      value: stats.active,
      icon: UserCheck,
      color: "green",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      title: "Blocked Users",
      value: stats.blocked,
      icon: UserX,
      color: "red",
      gradient: "from-red-500 to-rose-600",
    },
    {
      title: "Admins",
      value: stats.admins,
      icon: Crown,
      color: "purple",
      gradient: "from-purple-500 to-violet-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">{card.title}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{card.value}</p>
            </div>
            <div className={`bg-gradient-to-br ${card.gradient} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-3 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${card.gradient} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min((card.value / stats.total) * 100, 100)}%` }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Loading Skeleton
const UserSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(count)].map((_, index) => (
      <div
        key={index}
        className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse"
      >
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
            <div className="flex-1">
              <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-2/3"></div>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-xl flex-1"></div>
            <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-xl flex-1"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Empty State
const EmptyState = ({ hasFilters }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-3xl p-16 text-center shadow-xl border-2 border-dashed border-gray-200"
  >
    <div className="flex flex-col items-center gap-4">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full p-6">
        <UsersIcon size={56} className="text-indigo-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-700">
        {hasFilters ? "No matching users" : "No users found"}
      </h3>
      <p className="text-gray-400 max-w-md">
        {hasFilters
          ? "Try adjusting your search or filter criteria"
          : "Users will appear here once they register"}
      </p>
    </div>
  </motion.div>
);

// User Card (Grid View)
const UserCard = ({
  user,
  onViewDetails,
  isCurrentAdmin,
  getRoleBadge,
  getStatusColor,
  getStatusIcon,
}) => {
  const isAdmin = user.role === "admin";
  const isCurrentAdminUser = isCurrentAdmin(user._id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border ${
        isAdmin ? "border-purple-200" : "border-gray-100"
      } hover:border-indigo-300`}
    >
      <div className={`p-6 ${
        isAdmin ? "bg-gradient-to-br from-purple-50/50 to-indigo-50/50" : ""
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`relative w-14 h-14 rounded-full flex items-center justify-center ${
              isAdmin ? "bg-gradient-to-br from-purple-500 to-violet-600" : "bg-gradient-to-br from-indigo-500 to-blue-600"
            } ${isCurrentAdminUser ? "ring-4 ring-indigo-300" : ""}`}>
              <span className="text-xl font-bold text-white">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </span>
              {isCurrentAdminUser && (
                <div className="absolute -top-1 -right-1 bg-indigo-500 rounded-full p-1">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                {user.name}
                {isAdmin && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    <Crown className="w-3 h-3 mr-1" />
                    Admin
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Mail size={14} />
                {user.email}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(user.status)}`}>
            {getStatusIcon(user.status)}
            {user.status}
          </span>
        </div>

        {/* Details */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone size={14} className="text-gray-400" />
            <span>{user.mobile}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign size={14} className="text-gray-400" />
            <span className="font-semibold text-emerald-600">₹{user.balance || 0}</span>
          </div>
          {user.city && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={14} className="text-gray-400" />
              <span>{user.city}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Gift size={14} className="text-gray-400" />
            <span className="text-amber-600 font-medium">{user.totalReferrals || 0} referrals</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onViewDetails(user)}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Eye size={16} />
            View Details
          </button>
          {isCurrentAdminUser && (
            <div className="px-3 py-2.5 bg-indigo-100 text-indigo-700 rounded-xl text-xs font-medium flex items-center gap-1">
              <Activity size={14} />
              You
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// User Row (List View)
const UserRow = ({
  user,
  onViewDetails,
  isCurrentAdmin,
  getRoleBadge,
  getStatusColor,
  getStatusIcon,
  index,
}) => {
  const isAdmin = user.role === "admin";
  const isCurrentAdminUser = isCurrentAdmin(user._id);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`hover:bg-gray-50 transition-colors duration-150 ${
        isAdmin ? "bg-purple-50/30" : ""
      } ${isCurrentAdminUser ? "bg-indigo-50/30" : ""}`}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
            isAdmin ? "bg-gradient-to-br from-purple-500 to-violet-600" : "bg-gradient-to-br from-indigo-500 to-blue-600"
          } ${isCurrentAdminUser ? "ring-2 ring-indigo-400" : ""}`}>
            <span className="text-sm font-medium text-white">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
              {user.name}
              {isAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                  <Crown className="w-3 h-3 mr-1" />
                  Admin
                </span>
              )}
              {isCurrentAdminUser && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                  You
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Mail size={14} className="text-gray-400" />
          {user.email}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Phone size={14} className="text-gray-400" />
          {user.mobile}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getRoleBadge(user.role)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(user.status)}`}>
          {getStatusIcon(user.status)}
          {user.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(user)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 shadow-md hover:shadow-lg"
          >
            <Eye size={15} />
            View
          </button>
          {isCurrentAdminUser && (
            <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded">
              Current
            </span>
          )}
        </div>
      </td>
    </motion.tr>
  );
};

// User Details Modal
const UserDetailsModal = ({
  user,
  onClose,
  onStatusChange,
  isCurrentAdmin,
  statusChangeLoading,
  statusUpdateLoading,
  statusUpdateError,
  getStatusBadge,
  getRoleBadge,
  formatDate,
}) => {
  const [localStatusChangeLoading, setLocalStatusChangeLoading] = useState(false);

  const handleStatusChange = async (status) => {
    setLocalStatusChangeLoading(true);
    await onStatusChange(user._id, status);
    setLocalStatusChangeLoading(false);
  };

  const isLoading = statusChangeLoading || localStatusChangeLoading || statusUpdateLoading;

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
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 rounded-t-3xl flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {user.name}
                {getRoleBadge(user.role)}
              </h2>
              <p className="text-indigo-100 text-sm flex items-center gap-2">
                <Mail size={14} />
                {user.email}
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
          {/* Status Management */}
          <div className="mb-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-indigo-200 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-100 p-2 rounded-xl">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Account Status</h3>
                <p className="text-sm text-gray-600">Manage user account access</p>
              </div>
            </div>

            {isCurrentAdmin(user._id) ? (
              <div className="bg-indigo-100 border border-indigo-300 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-indigo-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">You cannot modify your own account status</span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">Current Status:</span>
                    {getStatusBadge(user.status)}
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleStatusChange("active")}
                      disabled={user.status === "active" || isLoading}
                      className={`px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                        user.status === "active"
                          ? "bg-green-100 text-green-600 cursor-not-allowed border border-green-300"
                          : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <CheckCircle size={16} />
                      Activate
                      {user.status === "active" && (
                        <span className="ml-1 text-xs bg-green-200 px-2 py-0.5 rounded">Current</span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleStatusChange("blocked")}
                      disabled={user.status === "blocked" || isLoading}
                      className={`px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                        user.status === "blocked"
                          ? "bg-red-100 text-red-600 cursor-not-allowed border border-red-300"
                          : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-md hover:shadow-lg"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <XCircle size={16} />
                      Block
                      {user.status === "blocked" && (
                        <span className="ml-1 text-xs bg-red-200 px-2 py-0.5 rounded">Current</span>
                      )}
                    </button>
                  </div>
                </div>
                
                {isLoading && (
                  <div className="mt-4 flex items-center gap-2 text-indigo-600 bg-indigo-50 p-3 rounded-xl">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                    <span className="text-sm font-medium">Updating status...</span>
                  </div>
                )}
                {statusUpdateError && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    {statusUpdateError}
                  </div>
                )}
              </>
            )}
          </div>

          {/* User Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Personal Info */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-indigo-600 mb-3">
                <User className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Personal Information</span>
              </div>
              <div className="space-y-3">
                <InfoRow label="Full Name" value={user.name} />
                <InfoRow label="Email" value={user.email} icon={<Mail size={14} />} />
                <InfoRow label="Mobile" value={user.mobile} icon={<Phone size={14} />} />
                <InfoRow label="Country" value={user.country || "N/A"} icon={<MapPin size={14} />} />
                <InfoRow label="City" value={user.city || "N/A"} icon={<MapPin size={14} />} />
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-600 mb-3">
                <Wallet className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Account Information</span>
              </div>
              <div className="space-y-3">
                <InfoRow label="Balance" value={`₹${user.balance || 0}`} icon={<DollarSign size={14} />} highlight />
                <InfoRow label="Role" value={getRoleBadge(user.role)} />
                <InfoRow label="Demo Account" value={user.isDemo ? "Yes" : "No"} />
                <InfoRow label="User ID" value={user._id} monospace />
              </div>
            </div>
          </div>

          {/* Referral & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-amber-600 mb-3">
                <Gift className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Referral Details</span>
              </div>
              <div className="space-y-3">
                <InfoRow label="Referral Code" value={user.referralCode || "N/A"} monospace />
                <InfoRow label="Referred By" value={user.referredBy || "None"} />
                <InfoRow label="Total Referrals" value={user.totalReferrals || 0} />
                <InfoRow label="Referral Earnings" value={`₹${user.referralEarning || 0}`} highlight />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-blue-600 mb-3">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Dates & Activity</span>
              </div>
              <div className="space-y-3">
                <InfoRow label="Joined" value={formatDate(user.createdAt)} />
                <InfoRow label="Last Updated" value={formatDate(user.updatedAt)} />
                <InfoRow label="Last Withdrawal" value={user.lastWithdrawalDate ? formatDate(user.lastWithdrawalDate) : "None"} />
                <InfoRow label="Status" value={getStatusBadge(user.status)} />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
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

// Info Row Component
const InfoRow = ({ label, value, icon, highlight, monospace }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-600 text-sm flex items-center gap-1">
      {icon}
      {label}
    </span>
    <span className={`${highlight ? "font-bold text-emerald-600" : "font-medium text-gray-900"} ${monospace ? "font-mono text-xs" : ""}`}>
      {value}
    </span>
  </div>
);

// Helper Functions
const getStatusColor = (status) => {
  if (status === "active") return "bg-green-100 text-green-800 border-green-200";
  if (status === "blocked") return "bg-red-100 text-red-800 border-red-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};

const getStatusIcon = (status) => {
  if (status === "active") return <CheckCircle className="w-3 h-3" />;
  if (status === "blocked") return <XCircle className="w-3 h-3" />;
  return <AlertCircle className="w-3 h-3" />;
};

const getRoleBadge = (role) => {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
        <Crown className="w-3 h-3" />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
      <User className="w-3 h-3" />
      User
    </span>
  );
};

const getStatusBadge = (status) => {
  const colors = {
    active: "bg-green-100 text-green-800 border-green-200",
    blocked: "bg-red-100 text-red-800 border-red-200",
  };
  const icons = {
    active: <CheckCircle className="w-4 h-4" />,
    blocked: <XCircle className="w-4 h-4" />,
  };
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${colors[status] || colors.active}`}>
      {icons[status] || icons.active}
      {status?.charAt(0).toUpperCase() + status?.slice(1) || "Active"}
    </span>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "Invalid Date";
  }
};

// ============================
// Main Component
// ============================

const Users = () => {
  const {
    users,
    allUsers,
    stats,
    loading,
    statusUpdateLoading,
    statusChangeLoading,
    setStatusChangeLoading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    filterRole,
    setFilterRole,
    filterStatus,
    setFilterStatus,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    selectedUser,
    setSelectedUser,
    showModal,
    setShowModal,
    admin,
    totalPages,
    usersPerPage,
    dispatch,
  } = useUserManagement();

  // Handlers
  const handleStatusChange = useCallback(async (userId, status) => {
    setStatusChangeLoading(true);
    try {
      await dispatch(
        updateUserStatus({
          userId,
          status,
        })
      ).unwrap();
      
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({
          ...selectedUser,
          status: status
        });
      }
      
      await dispatch(getAllUsers());
      toast.success(`User ${status === 'active' ? 'activated' : 'blocked'} successfully!`);
    } catch (error) {
      toast.error("Failed to update user status");
    } finally {
      setStatusChangeLoading(false);
    }
  }, [dispatch, selectedUser, setStatusChangeLoading]);

  const handleViewDetails = useCallback((user) => {
    setSelectedUser(user);
    setShowModal(true);
  }, [setSelectedUser, setShowModal]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedUser(null);
  }, [setShowModal, setSelectedUser]);

  const isCurrentAdmin = useCallback((userId) => {
    return admin && admin._id === userId;
  }, [admin]);

  const handleRefresh = useCallback(() => {
    dispatch(getAllUsers());
    toast.info("🔄 Refreshing users...");
  }, [dispatch]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilterRole("all");
    setFilterStatus("all");
    setSortBy("newest");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
              <Sparkles className="text-indigo-600" size={32} />
              User Management
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {allUsers.length} users found
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:rotate-180"
            >
              <RefreshCw size={20} className="text-gray-600" />
            </button>

            <div className="bg-white rounded-xl shadow-md px-3 py-2 flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  viewMode === "grid"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:bg-gray-100"
                }`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:bg-gray-100"
                }`}
              >
                <List size={18} />
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md px-3 py-2 flex items-center gap-2">
              <label className="text-xs text-gray-500">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">A-Z</option>
                <option value="balance">Balance</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search users by name, email or mobile..."
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none bg-white/80 backdrop-blur-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none bg-white/80 backdrop-blur-sm text-sm font-medium"
            >
              <option value="all">👥 All Roles</option>
              <option value="admin">👑 Admin</option>
              <option value="user">👤 User</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none bg-white/80 backdrop-blur-sm text-sm font-medium"
            >
              <option value="all">📊 All Status</option>
              <option value="active">✅ Active</option>
              <option value="blocked">❌ Blocked</option>
            </select>

            {(searchTerm || filterRole !== "all" || filterStatus !== "all") && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 bg-red-100 text-red-600 rounded-2xl text-sm font-medium hover:bg-red-200 transition-all duration-200 flex items-center gap-2"
              >
                <X size={16} />
                Clear
              </button>
            )}
          </div>
        </motion.div>

        {/* Users Display */}
        {loading ? (
          <UserSkeleton count={viewMode === "grid" ? 6 : 4} />
        ) : (
          <AnimatePresence mode="popLayout">
            {allUsers.length > 0 ? (
              <>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map((user) => (
                      <UserCard
                        key={user._id}
                        user={user}
                        onViewDetails={handleViewDetails}
                        isCurrentAdmin={isCurrentAdmin}
                        getRoleBadge={getRoleBadge}
                        getStatusColor={getStatusColor}
                        getStatusIcon={getStatusIcon}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.map((user, index) => (
                            <UserRow
                              key={user._id}
                              user={user}
                              onViewDetails={handleViewDetails}
                              isCurrentAdmin={isCurrentAdmin}
                              getRoleBadge={getRoleBadge}
                              getStatusColor={getStatusColor}
                              getStatusIcon={getStatusIcon}
                              index={index}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, allUsers.length)} of {allUsers.length} users
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200 flex items-center gap-1"
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200 ${
                                currentPage === pageNum
                                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                                  : "hover:bg-gray-100 text-gray-600"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200 flex items-center gap-1"
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState hasFilters={searchTerm !== "" || filterRole !== "all" || filterStatus !== "all"} />
            )}
          </AnimatePresence>
        )}
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {showModal && selectedUser && (
          <UserDetailsModal
            user={selectedUser}
            onClose={closeModal}
            onStatusChange={handleStatusChange}
            isCurrentAdmin={isCurrentAdmin}
            statusChangeLoading={statusChangeLoading || statusUpdateLoading}
            statusUpdateError={null}
            getStatusBadge={getStatusBadge}
            getRoleBadge={getRoleBadge}
            formatDate={formatDate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;