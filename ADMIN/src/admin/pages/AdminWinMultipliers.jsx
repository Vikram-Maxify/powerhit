import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getWinMultipliers,
  updateWinMultipliers,
  clearWinMultiplierMessage,
} from "../redux/winMultiplierSlice";

const AdminWinMultipliers = () => {
  const dispatch = useDispatch();

  const {
    multipliers,
    loading,
    updateLoading,
    error,
    success,
  } = useSelector((state) => state.winMultiplier);

  const [formData, setFormData] = useState({});

  // ======================================================
  // FETCH DATA
  // ======================================================
  useEffect(() => {
    dispatch(getWinMultipliers());
  }, [dispatch]);

  // ======================================================
  // SET FORM DATA
  // ======================================================
  useEffect(() => {
    if (multipliers && Object.keys(multipliers).length > 0) {
      setFormData(multipliers);
    }
  }, [multipliers]);

  // ======================================================
  // CLEAR MESSAGE
  // ======================================================
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(clearWinMultiplierMessage());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  // ======================================================
  // INPUT CHANGE
  // ======================================================
  const handleChange = (gameType, field, value) => {
    setFormData((prev) => ({
      ...prev,

      [gameType]: {
        ...prev[gameType],
        [field]: field === "value" ? Number(value) : value,
      },
    }));
  };

  // ======================================================
  // SUBMIT
  // ======================================================
  const handleSubmit = (e) => {
    e.preventDefault();

    dispatch(updateWinMultipliers(formData));
  };

  // ======================================================
  // LOADING
  // ======================================================
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-lg font-semibold">
          Loading multipliers...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">

      {/* ==================================================
          HEADER
      ================================================== */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Win Multipliers
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Configure winning multipliers for each game type.
        </p>
      </div>

      {/* ==================================================
          SUCCESS
      ================================================== */}
      {success && (
        <div className="mb-4 rounded-lg bg-green-100 border border-green-300 text-green-700 px-4 py-3">
          Win multipliers updated successfully.
        </div>
      )}

      {/* ==================================================
          ERROR
      ================================================== */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-100 border border-red-300 text-red-700 px-4 py-3">
          {error}
        </div>
      )}

      {/* ==================================================
          FORM
      ================================================== */}
      <form onSubmit={handleSubmit}>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

          {/* TABLE HEADER */}
          <div className="grid grid-cols-12 gap-4 px-5 py-4 bg-gray-50 border-b font-semibold text-gray-700">
            <div className="col-span-1">
              #
            </div>

            <div className="col-span-4">
              Game Type
            </div>

            <div className="col-span-4">
              Display Name
            </div>

            <div className="col-span-3">
              Multiplier
            </div>
          </div>

          {/* ==================================================
              ROWS
          ================================================== */}
          {Object.entries(formData).map(
            ([gameType, item], index) => (
              <div
                key={gameType}
                className="grid grid-cols-12 gap-4 px-5 py-4 border-b last:border-b-0 items-center"
              >

                {/* NUMBER */}
                <div className="col-span-1 text-gray-500">
                  {index + 1}
                </div>

                {/* GAME TYPE */}
                <div className="col-span-4">
                  <span className="font-medium text-gray-800 capitalize">
                    {gameType.replaceAll("-", " ")}
                  </span>
                </div>

                {/* NAME */}
                <div className="col-span-4">
                  <input
                    type="text"
                    value={item?.name || ""}
                    onChange={(e) =>
                      handleChange(
                        gameType,
                        "name",
                        e.target.value
                      )
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Display name"
                  />
                </div>

                {/* VALUE */}
                <div className="col-span-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item?.value ?? ""}
                    onChange={(e) =>
                      handleChange(
                        gameType,
                        "value",
                        e.target.value
                      )
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Multiplier"
                  />
                </div>

              </div>
            )
          )}

          {/* ==================================================
              FOOTER
          ================================================== */}
          <div className="flex justify-end px-5 py-5 bg-gray-50">

            <button
              type="submit"
              disabled={updateLoading}
              className={`px-6 py-2.5 rounded-lg text-white font-semibold transition ${
                updateLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {updateLoading
                ? "Updating..."
                : "Save Multipliers"}
            </button>

          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminWinMultipliers;