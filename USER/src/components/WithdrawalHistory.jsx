import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; // Add this import
import { ArrowUpRight, ChevronRight } from "lucide-react";
import {
  fetchWithdrawalHistory,
  selectWithdrawalHistory,
  selectHistoryLoading,
  selectHistoryError,
  selectPagination,
  clearWithdrawalError,
} from "../redux/slices/withdrawalSlice";

const statusColor = {
  Success: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Failed: "bg-red-100 text-red-700",
};

export default function WithdrawalHistory() {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Add navigate hook
  const [currentPage, setCurrentPage] = useState(1);

  // Redux selectors
  const withdrawals = useSelector(selectWithdrawalHistory);
  const loading = useSelector(selectHistoryLoading);
  const error = useSelector(selectHistoryError);
  const pagination = useSelector(selectPagination);

  // Fetch withdrawal history on component mount
  useEffect(() => {
    dispatch(
      fetchWithdrawalHistory({
        page: currentPage,
        limit: 10,
      })
    );

    // Clear any errors when component unmounts
    return () => {
      dispatch(clearWithdrawalError());
    };
  }, [dispatch, currentPage]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle view all navigation
  const handleViewAll = () => {
    navigate("/withdrawal-history");
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format amount
  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm p-8">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 overflow-hidden shadow-sm p-8">
        <div className="text-red-600 text-center">
          <p className="font-medium">Error loading withdrawals</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() =>
              dispatch(
                fetchWithdrawalHistory({ page: currentPage, limit: 10 })
              )
            }
            className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <ArrowUpRight className="h-5 w-5 text-blue-500" />
          </div>

          <div>
            <h2 className="text-gray-900 font-semibold text-lg">
              Last {pagination?.total || 10} Withdrawals
            </h2>
            <p className="text-xs text-gray-500">
              Recent withdrawal transactions
            </p>
          </div>
        </div>

        <div>
          <button 
            onClick={handleViewAll}
            className="flex items-center gap-1 text-sm text-yellow-500 hover:text-yellow-600 transition"
          >
            View All
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      {withdrawals.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-gray-500">No withdrawal transactions found</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {withdrawals.map((item) => (
            <div
              key={item._id || item.id}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
            >
              <div>
                <h3 className="font-medium text-gray-900">
                  {item.userName || item.name || item.user?.name || "User"}
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(item.createdAt || item.date)}
                </p>

                {item.method && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    via {item.method}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {formatAmount(item.amount)}
                </p>

                <span
                  className={`inline-flex mt-2 rounded-full px-3 py-1 text-xs font-medium ${
                    statusColor[item.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
          <div className="text-xs text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} entries
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {[...Array(pagination.totalPages).keys()].map((page) => {
              const pageNum = page + 1;
              // Show first 3, last 3, and current page with ellipsis
              if (
                pageNum === 1 ||
                pageNum === pagination.totalPages ||
                Math.abs(pageNum - pagination.page) <= 1
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm border rounded-lg transition ${
                      pageNum === pagination.page
                        ? "bg-yellow-500 text-white border-yellow-500"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }

              // Show ellipsis
              if (
                (pageNum === 2 && pagination.page > 3) ||
                (pageNum === pagination.totalPages - 1 &&
                  pagination.page < pagination.totalPages - 2)
              ) {
                return (
                  <span key={pageNum} className="px-2 py-1 text-sm text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}