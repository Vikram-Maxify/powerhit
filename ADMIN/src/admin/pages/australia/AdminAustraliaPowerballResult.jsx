import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    createPowerballResult,
    getAllPowerballResults,
    clearPowerballResultState,
    deletePowerballResult,
    getAllPendingGames,
    clearPendingGames,
} from "../../redux/australia/powerballResultSlice";
import { toast } from "react-toastify";

const AustraliaPowerballResult = () => {
    const dispatch = useDispatch();

    const { 
        createLoading, 
        loading, 
        success, 
        error, 
        message,
        results,
        deleteLoading,
        pendingGames,
        pendingGamesLoading,
    } = useSelector(
        (state) => state.australiaPowerballResult
    );

    const [formData, setFormData] = useState({
        drawNo: "",
        powerball: "",
        numbers: ["", "", "", "", "", "", ""],
        poolId: "", // Added poolId
    });

    const [showGameDetails, setShowGameDetails] = useState(false);
    const [showPendingGames, setShowPendingGames] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);
    const [groupedGames, setGroupedGames] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notificationShown, setNotificationShown] = useState(false);
    const [selectedDrawNo, setSelectedDrawNo] = useState("all");

    // Load initial data
    useEffect(() => {
        dispatch(getAllPowerballResults());
        dispatch(getAllPendingGames());
    }, [dispatch]);

    // Group pending games by pool
    useEffect(() => {
        if (pendingGames && pendingGames.length > 0) {
            const grouped = pendingGames.reduce((acc, game) => {
                if (!acc[game.poolId]) {
                    acc[game.poolId] = {
                        poolId: game.poolId,
                        poolTotalPlayers: game.poolTotalPlayers || 0,
                        poolTotalAmount: game.poolTotalAmount || 0,
                        poolStatus: game.poolStatus || "Open",
                        drawNo: game.drawNo,
                        games: []
                    };
                }
                acc[game.poolId].games.push(game);
                return acc;
            }, {});
            setGroupedGames(grouped);
        } else {
            setGroupedGames({});
        }
    }, [pendingGames]);

    // Get unique draw numbers from pending games
    const getUniqueDrawNumbers = () => {
        if (!pendingGames || pendingGames.length === 0) return [];
        const drawNumbers = new Set();
        pendingGames.forEach(game => {
            if (game.drawNo) {
                drawNumbers.add(game.drawNo);
            }
        });
        return Array.from(drawNumbers).sort((a, b) => a - b);
    };

    // Filter pending games by draw number
    const getFilteredPendingGames = () => {
        if (selectedDrawNo === "all") {
            return pendingGames;
        }
        return pendingGames.filter(game => game.drawNo === parseInt(selectedDrawNo));
    };

    // Handle success and error states
    useEffect(() => {
        if (success && !notificationShown) {
            setNotificationShown(true);
            toast.success(message || "Result Declared Successfully");
            
            // Reset form
            setFormData({
                drawNo: "",
                powerball: "",
                numbers: ["", "", "", "", "", "", ""],
                poolId: "",
            });
            
            // Refresh data
            dispatch(getAllPowerballResults());
            dispatch(getAllPendingGames());
            
            // Clear state after delay
            setTimeout(() => {
                dispatch(clearPowerballResultState());
                setIsSubmitting(false);
                setNotificationShown(false);
            }, 1000);
        }

        if (error && !notificationShown) {
            setNotificationShown(true);
            toast.error(typeof error === 'string' ? error : error.message || "Failed to declare result");
            
            setTimeout(() => {
                dispatch(clearPowerballResultState());
                setIsSubmitting(false);
                setNotificationShown(false);
            }, 1000);
        }
    }, [success, error, dispatch, message, notificationShown]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleNumberChange = (index, value) => {
        const updated = [...formData.numbers];
        updated[index] = value;

        setFormData({
            ...formData,
            numbers: updated,
        });
    };

    const handlePoolSelect = (poolId) => {
        setFormData({
            ...formData,
            poolId: poolId,
        });
        toast.info(`Selected Pool: ${poolId}`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isSubmitting || createLoading) {
            return;
        }

        const numbers = formData.numbers.map(Number);

        // Validate all fields are filled
        if (!formData.drawNo || !formData.powerball || numbers.some((n) => Number.isNaN(n))) {
            toast.error("Please fill all fields.");
            return;
        }

        // Validate unique numbers
        if (new Set(numbers).size !== 7) {
            toast.error("Winning numbers must be unique.");
            return;
        }

        // Validate poolId is selected
        if (!formData.poolId) {
            toast.error("Please select a Pool ID from pending games.");
            return;
        }

        // Check for duplicate draw number
        if (results && results.some(r => r.drawNo === Number(formData.drawNo))) {
            toast.error(`Draw #${formData.drawNo} already exists!`);
            return;
        }

        setIsSubmitting(true);
        setNotificationShown(false);

        console.log('Submitting Powerball Result:', {
            drawNo: Number(formData.drawNo),
            numbers: numbers,
            powerball: Number(formData.powerball),
            poolId: formData.poolId,
        });

        try {
            const result = await dispatch(
                createPowerballResult({
                    drawNo: Number(formData.drawNo),
                    numbers: numbers,
                    powerball: Number(formData.powerball),
                    poolId: formData.poolId, // Include poolId
                })
            ).unwrap();

            console.log('Result created successfully:', result);
            
            toast.success(result.message || "Result Declared Successfully!");
            
            // Reset form immediately
            setFormData({
                drawNo: "",
                powerball: "",
                numbers: ["", "", "", "", "", "", ""],
                poolId: "",
            });

            // Refresh data
            await dispatch(getAllPowerballResults());
            await dispatch(getAllPendingGames());
            
            // Clear Redux state
            dispatch(clearPowerballResultState());
            
        } catch (error) {
            console.error('Submission error:', error);
            toast.error(typeof error === 'string' ? error : error.message || "Failed to declare result");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewPendingGames = () => {
        setShowPendingGames(!showPendingGames);
        if (!showPendingGames) {
            dispatch(getAllPendingGames());
            setSelectedDrawNo("all");
        }
    };

    const handleGameClick = (game) => {
        if (game && game.playerId) {
            const transformedGame = {
                ...game,
                userId: {
                    username: game.userId?.name || game.userId?.username || "Unknown",
                    email: game.userId?.email || "",
                    _id: game.userId?._id
                },
                ticketType: {
                    title: game.ticketType?.title || game.ticketType?.name || "N/A",
                    name: game.ticketType?.title || game.ticketType?.name || "N/A",
                    _id: game.ticketType?._id
                },
                games: [{
                    gameNo: game.gameNo || 0,
                    numbers: game.numbers || [],
                    powerball: game.powerball || 0
                }],
                numbers: game.numbers || [],
                powerball: game.powerball || 0,
                drawNo: game.drawNo || 0,
                gameNo: game.gameNo || 0,
                playerStatus: game.playerStatus || "Pending",
                bidAmount: game.bidAmount || 0,
                poolId: game.poolId || "",
                poolTotalPlayers: game.poolTotalPlayers || 0,
                poolTotalAmount: game.poolTotalAmount || 0,
                poolStatus: game.poolStatus || "Open",
                createdAt: game.createdAt || new Date().toISOString()
            };
            
            setSelectedGame(transformedGame);
            setShowGameDetails(true);
        } else {
            toast.error("Game details not available");
        }
    };

    const handleCloseDetails = () => {
        setShowGameDetails(false);
        setSelectedGame(null);
        dispatch(clearPendingGames());
    };

    const handleClosePendingGames = () => {
        setShowPendingGames(false);
        dispatch(clearPendingGames());
        setSelectedDrawNo("all");
    };

    const getUniqueUsers = (games) => {
        if (!games || !Array.isArray(games)) return [];
        const uniqueUsers = {};
        games.forEach(game => {
            if (game.userId && game.userId._id) {
                uniqueUsers[game.userId._id] = game.userId;
            }
        });
        return Object.values(uniqueUsers);
    };

    const handleDeleteResult = async (id) => {
        if (!window.confirm("Are you sure you want to delete this result?")) {
            return;
        }

        try {
            await dispatch(deletePowerballResult(id)).unwrap();
            toast.success("Result Deleted Successfully");
            await dispatch(getAllPowerballResults());
            await dispatch(getAllPendingGames());
        } catch (err) {
            toast.error(typeof err === 'string' ? err : err.message || "Failed to delete result");
        }
    };

    // Get filtered games for display
    const filteredPendingGames = getFilteredPendingGames();
    
    // Regroup filtered games
    const getFilteredGroupedGames = () => {
        if (selectedDrawNo === "all") {
            return groupedGames;
        }
        
        const filtered = filteredPendingGames.reduce((acc, game) => {
            if (!acc[game.poolId]) {
                acc[game.poolId] = {
                    poolId: game.poolId,
                    poolTotalPlayers: game.poolTotalPlayers || 0,
                    poolTotalAmount: game.poolTotalAmount || 0,
                    poolStatus: game.poolStatus || "Open",
                    drawNo: game.drawNo,
                    games: []
                };
            }
            acc[game.poolId].games.push(game);
            return acc;
        }, {});
        return filtered;
    };

    const filteredGroupedGames = getFilteredGroupedGames();
    const uniqueDrawNumbers = getUniqueDrawNumbers();

    // Get existing draw numbers for display
    const existingDrawNumbers = results && results.length > 0 
        ? results.map(r => r.drawNo).sort((a, b) => a - b) 
        : [];

    // Get draw numbers from pending games for dropdown
    const pendingDrawNumbers = getUniqueDrawNumbers();

    // Combined draw numbers (from results + pending)
    const allDrawNumbers = [...new Set([...existingDrawNumbers, ...pendingDrawNumbers])].sort((a, b) => a - b);

    // Get next draw number
    const getNextDrawNumber = () => {
        if (allDrawNumbers.length === 0) return 1;
        return allDrawNumbers[allDrawNumbers.length - 1] + 1;
    };

    const nextDrawNumber = getNextDrawNumber();

    // Get unique pool IDs from pending games for the selected draw number
    const getPoolOptions = () => {
        const filtered = getFilteredPendingGames();
        const pools = {};
        filtered.forEach(game => {
            if (game.poolId && !pools[game.poolId]) {
                pools[game.poolId] = {
                    poolId: game.poolId,
                    poolTotalPlayers: game.poolTotalPlayers || 0,
                    poolTotalAmount: game.poolTotalAmount || 0,
                    drawNo: game.drawNo,
                    games: filtered.filter(g => g.poolId === game.poolId)
                };
            }
        });
        return Object.values(pools);
    };

    const poolOptions = getPoolOptions();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                        🎰 Australia Powerball
                    </h1>
                    <p className="text-gray-600 mt-2">Declare and manage Powerball results</p>
                </div>

                {/* Declare Result Form */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5 flex justify-between items-center">
                        <h4 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-2xl">📝</span> Declare Result
                        </h4>
                        {results && results.length > 0 && (
                            <div className="text-white text-sm bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                                Latest Draw: <span className="font-bold">#{existingDrawNumbers[existingDrawNumbers.length - 1]}</span>
                            </div>
                        )}
                    </div>

                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Draw Number */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Draw Number
                                </label>
                                <div className="flex gap-3">
                                    <select
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200"
                                        name="drawNo"
                                        value={formData.drawNo}
                                        onChange={handleChange}
                                        disabled={isSubmitting || createLoading}
                                        required
                                    >
                                        <option value="">Select Draw Number</option>
                                        {allDrawNumbers.length > 0 ? (
                                            <>
                                                <optgroup label="📋 Existing Draws">
                                                    {existingDrawNumbers.map((num) => (
                                                        <option key={`existing-${num}`} value={num}>
                                                            Draw #{num} {results?.some(r => r.drawNo === num) ? '✅' : ''}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                                {pendingDrawNumbers.length > 0 && (
                                                    <optgroup label="⏳ Pending Draws">
                                                        {pendingDrawNumbers.map((num) => (
                                                            <option key={`pending-${num}`} value={num}>
                                                                Draw #{num} {pendingGames?.some(g => g.drawNo === num) ? '⏳' : ''}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                )}
                                                <optgroup label="✨ Next Draw">
                                                    <option value={nextDrawNumber} className="text-blue-600 font-bold">
                                                        Draw #{nextDrawNumber} (New) 🚀
                                                    </option>
                                                </optgroup>
                                            </>
                                        ) : (
                                            <option value="1">Draw #1 (New) 🚀</option>
                                        )}
                                    </select>
                                    {formData.drawNo && (
                                        <div className="flex items-center px-4 bg-blue-50 border-2 border-blue-200 rounded-xl text-blue-700 font-bold whitespace-nowrap">
                                            #{formData.drawNo}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Draw hints */}
                                {allDrawNumbers.length > 0 && (
                                    <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-1 items-center">
                                        <span className="font-medium">📊 Existing:</span>
                                        {existingDrawNumbers.map((num, idx) => (
                                            <span key={num} className="text-blue-600 font-medium">
                                                #{num}{idx < existingDrawNumbers.length - 1 ? ',' : ''}
                                            </span>
                                        ))}
                                        {pendingDrawNumbers.length > 0 && (
                                            <>
                                                <span className="ml-2 font-medium text-purple-600">⏳ Pending:</span>
                                                {pendingDrawNumbers.map((num, idx) => (
                                                    <span key={num} className="text-purple-600 font-medium">
                                                        #{num}{idx < pendingDrawNumbers.length - 1 ? ',' : ''}
                                                    </span>
                                                ))}
                                            </>
                                        )}
                                        <span className="ml-2 text-green-600 font-bold">✨ Next: #{nextDrawNumber}</span>
                                    </div>
                                )}
                                
                                {/* Draw status */}
                                {formData.drawNo && (
                                    <div className="mt-2">
                                        {results && results.some(r => r.drawNo === Number(formData.drawNo)) ? (
                                            <span className="text-xs text-red-600 font-semibold bg-red-50 px-3 py-1 rounded-full">
                                                ⚠️ Draw #{formData.drawNo} already has a result!
                                            </span>
                                        ) : pendingGames && pendingGames.some(g => g.drawNo === Number(formData.drawNo)) ? (
                                            <span className="text-xs text-orange-600 font-semibold bg-orange-50 px-3 py-1 rounded-full">
                                                ⏳ Draw #{formData.drawNo} has pending games
                                            </span>
                                        ) : (
                                            <span className="text-xs text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">
                                                ✅ Draw #{formData.drawNo} is ready to declare
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Pool ID Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Pool ID <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-3">
                                    <select
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200"
                                        name="poolId"
                                        value={formData.poolId}
                                        onChange={handleChange}
                                        disabled={isSubmitting || createLoading}
                                        required
                                    >
                                        <option value="">Select Pool ID</option>
                                        {poolOptions.length > 0 ? (
                                            poolOptions.map((pool) => (
                                                <option key={pool.poolId} value={pool.poolId}>
                                                    Pool #{pool.poolId.slice(-6)} - Draw #{pool.drawNo} ({pool.games?.length || 0} games) - 💰 ${pool.poolTotalAmount || 0}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>No pending pools available</option>
                                        )}
                                    </select>
                                    {formData.poolId && (
                                        <div className="flex items-center px-4 bg-purple-50 border-2 border-purple-200 rounded-xl text-purple-700 font-mono text-sm whitespace-nowrap">
                                            {formData.poolId.slice(-8)}
                                        </div>
                                    )}
                                </div>
                                {poolOptions.length === 0 && formData.drawNo && (
                                    <p className="mt-1 text-xs text-orange-600">
                                        ⚠️ No pending pools found for Draw #{formData.drawNo}. Select a different draw or create pending games first.
                                    </p>
                                )}
                                {formData.poolId && (
                                    <p className="mt-1 text-xs text-green-600 font-medium">
                                        ✅ Pool selected: {formData.poolId}
                                    </p>
                                )}
                            </div>

                            {/* Winning Numbers */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Winning Numbers
                                </label>
                                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                                    {formData.numbers.map((num, index) => (
                                        <input
                                            key={index}
                                            type="number"
                                            min="1"
                                            max="35"
                                            className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200 hover:border-blue-300"
                                            placeholder={index + 1}
                                            value={num}
                                            onChange={(e) =>
                                                handleNumberChange(
                                                    index,
                                                    e.target.value
                                                )
                                            }
                                            disabled={isSubmitting || createLoading}
                                            required
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Powerball */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Winning Powerball
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    className="w-full max-w-xs px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white transition-all duration-200 hover:border-red-300"
                                    placeholder="Enter Powerball"
                                    name="powerball"
                                    value={formData.powerball}
                                    onChange={handleChange}
                                    disabled={isSubmitting || createLoading}
                                    required
                                />
                            </div>

                            {/* Declaration info */}
                            {formData.drawNo && formData.poolId && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                                    <p className="text-sm text-green-800 flex items-center gap-2">
                                        <span className="text-xl">✅</span>
                                        <span className="font-semibold">Ready to declare:</span>
                                        <span>Draw #{formData.drawNo} for Pool {formData.poolId.slice(-8)}</span>
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                disabled={isSubmitting || createLoading || !formData.drawNo || !formData.poolId}
                            >
                                {isSubmitting || createLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Declaring...
                                    </span>
                                ) : (
                                    "🎯 Declare Result"
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Results Table */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden mt-8 border border-white/20">
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-5 flex justify-between items-center">
                        <h5 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="text-2xl">🏆</span> Results
                        </h5>
                        <div className="flex items-center gap-4">
                            <button
                                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.02] ${
                                    showPendingGames 
                                        ? 'bg-purple-700 hover:bg-purple-800' 
                                        : 'bg-purple-600 hover:bg-purple-700'
                                } text-white shadow-lg hover:shadow-xl`}
                                onClick={handleViewPendingGames}
                            >
                                {showPendingGames ? '🔒 Hide Pending' : '📋 View Pending Games'}
                                {Object.keys(groupedGames).length > 0 && !showPendingGames && (
                                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                        {Object.keys(groupedGames).length}
                                    </span>
                                )}
                            </button>
                            {loading && (
                                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Draw No</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winning Numbers</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Powerball</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {results && results.length > 0 ? (
                                    results.map((item, index) => (
                                        <tr key={item._id} className="hover:bg-blue-50/50 transition-colors duration-150">
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                #{item.drawNo}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.numbers && item.numbers.map((num, i) => (
                                                        <span
                                                            key={i}
                                                            className="inline-flex items-center justify-center w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold rounded-full text-sm shadow-md"
                                                        >
                                                            {num}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                <span className="inline-flex items-center justify-center w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 text-white font-bold rounded-full text-sm shadow-md">
                                                    {item.powerball}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.05] disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                                    disabled={deleteLoading}
                                                    onClick={() => handleDeleteResult(item._id)}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-4 py-12 text-center text-gray-500"
                                        >
                                            <div className="text-4xl mb-2">📭</div>
                                            No Result Found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pending Games Section */}
                {showPendingGames && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden mt-8 border border-white/20 animate-fadeIn">
                        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-6 py-5">
                            <div className="flex justify-between items-center flex-wrap gap-4">
                                <div>
                                    <h5 className="text-lg font-bold text-white flex items-center gap-2">
                                        <span className="text-2xl">⏳</span> Pending Games by Pool
                                        <span className="ml-2 text-sm font-normal text-purple-200">
                                            ({Object.keys(filteredGroupedGames).length} pools)
                                        </span>
                                    </h5>
                                </div>
                                <div className="flex items-center gap-4 flex-wrap">
                                    {uniqueDrawNumbers.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <label className="text-white text-sm font-medium">Filter by Draw:</label>
                                            <select
                                                value={selectedDrawNo}
                                                onChange={(e) => setSelectedDrawNo(e.target.value)}
                                                className="px-3 py-2 bg-white/20 text-white border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium"
                                            >
                                                <option value="all" className="text-gray-900">All Draws</option>
                                                {uniqueDrawNumbers.map((drawNo) => (
                                                    <option key={drawNo} value={drawNo} className="text-gray-900">
                                                        Draw #{drawNo}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <button
                                        className="px-4 py-2 bg-white text-purple-700 font-bold rounded-xl hover:bg-gray-100 transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                                        onClick={handleClosePendingGames}
                                    >
                                        ✕ Close
                                    </button>
                                </div>
                            </div>
                            
                            {selectedDrawNo !== "all" && (
                                <div className="mt-2 text-purple-200 text-sm">
                                    Showing games for Draw #{selectedDrawNo}
                                    <button
                                        onClick={() => setSelectedDrawNo("all")}
                                        className="ml-2 text-white underline hover:no-underline font-medium"
                                    >
                                        Clear filter
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-6">
                            {pendingGamesLoading ? (
                                <div className="text-center py-12">
                                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
                                    <p className="mt-3 text-gray-500 font-medium">Loading pending games...</p>
                                </div>
                            ) : Object.keys(filteredGroupedGames).length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {Object.values(filteredGroupedGames).map((pool) => (
                                        <div key={pool.poolId} className="border-2 border-purple-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 bg-white">
                                            <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 px-6 py-4">
                                                <div className="flex justify-between items-center flex-wrap gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <h6 className="text-white font-bold text-lg flex items-center gap-2">
                                                                🎯 Pool #{pool.poolId ? pool.poolId.slice(-6) : "N/A"}
                                                            </h6>
                                                            <span className="bg-yellow-400 text-purple-900 font-bold px-3 py-1.5 rounded-full text-sm shadow-lg">
                                                                Draw #{pool.drawNo || "N/A"}
                                                            </span>
                                                            <span className="bg-white/20 text-white px-3 py-1.5 rounded-full text-sm">
                                                                🎫 {pool.games ? pool.games.length : 0} tickets
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 text-white text-sm flex-wrap">
                                                        <span className="bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                                            👥 {pool.poolTotalPlayers || 0} players
                                                        </span>
                                                        <span className="bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm font-bold">
                                                            💰 ${pool.poolTotalAmount || 0}
                                                        </span>
                                                        <span className={`px-3 py-1.5 rounded-full font-bold ${
                                                            pool.poolStatus === 'Open' 
                                                                ? 'bg-green-500/40 text-green-100' 
                                                                : 'bg-gray-500/40 text-gray-100'
                                                        }`}>
                                                            {pool.poolStatus || "N/A"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-5">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {pool.games && pool.games.map((game, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-purple-400 bg-white hover:bg-purple-50/30 transform hover:-translate-y-1"
                                                            onClick={() => handleGameClick(game)}
                                                        >
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <span className="text-sm font-medium text-gray-500">
                                                                        Game #{game.gameNo || idx + 1}
                                                                    </span>
                                                                    <span className="ml-2 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                                                        Draw #{game.drawNo}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold">
                                                                    ⏳ Pending
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                                {game.numbers && game.numbers.length > 0 ? (
                                                                    game.numbers.map((num, i) => (
                                                                        <span
                                                                            key={i}
                                                                            className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 text-white font-bold rounded-full text-xs shadow-md"
                                                                        >
                                                                            {num}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">No numbers</span>
                                                                )}
                                                                {game.powerball && (
                                                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-red-400 to-red-500 text-white font-bold rounded-full text-xs shadow-md">
                                                                        {game.powerball}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="text-xs text-gray-500 space-y-1.5 bg-gray-50 p-3 rounded-lg">
                                                                <div className="flex justify-between">
                                                                    <span className="font-medium text-gray-400">User:</span>
                                                                    <span className="font-medium text-gray-700">
                                                                        {game.userId?.name || game.userId?.username || "Unknown"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="font-medium text-gray-400">Bid:</span>
                                                                    <span className="font-bold text-green-600">
                                                                        ${game.bidAmount || 0}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="font-medium text-gray-400">Ticket:</span>
                                                                    <span className="font-medium text-gray-700">
                                                                        {game.ticketType?.title || game.ticketType?.name || "N/A"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {pool.games && pool.games.length > 0 && (
                                                    <div className="mt-4 pt-3 border-t-2 border-gray-100">
                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                            <span className="font-medium">👥 Players:</span>
                                                            {getUniqueUsers(pool.games).map((u, i, arr) => (
                                                                <span key={u._id || i} className="font-medium text-gray-700">
                                                                    {u.name || u.username || "Unknown"}{i < arr.length - 1 ? ',' : ''}
                                                                </span>
                                                            ))}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <div className="text-4xl mb-3">📭</div>
                                    {selectedDrawNo === "all" 
                                        ? "No pending games found." 
                                        : `No pending games found for Draw #${selectedDrawNo}.`}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Game Details Modal */}
                {showGameDetails && selectedGame && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                                <h5 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="text-2xl">🎯</span> Game Details - Draw #{selectedGame.drawNo || "N/A"}
                                </h5>
                                <button
                                    className="text-white hover:text-gray-200 text-3xl font-bold transition-transform hover:rotate-90 duration-200"
                                    onClick={handleCloseDetails}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* User Information */}
                                <div>
                                    <h6 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                                        <span className="text-lg">👤</span> User Information
                                    </h6>
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400">Username</label>
                                                <p className="text-base font-bold text-gray-900">
                                                    {selectedGame.userId?.username || "Unknown"}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400">Email</label>
                                                <p className="text-base font-bold text-gray-900">
                                                    {selectedGame.userId?.email || "N/A"}
                                                </p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-gray-400">User ID</label>
                                                <p className="text-base font-mono text-gray-900 text-sm bg-white px-3 py-2 rounded-lg border border-gray-200">
                                                    {selectedGame.userId?._id || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Game Information */}
                                <div>
                                    <h6 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                                        <span className="text-lg">🎮</span> Game Information
                                    </h6>
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400">Draw Number</label>
                                                <p className="text-base font-bold text-gray-900">#{selectedGame.drawNo || "N/A"}</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400">Game Number</label>
                                                <p className="text-base font-bold text-gray-900">#{selectedGame.gameNo || "N/A"}</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400">Status</label>
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800">
                                                    ⏳ {selectedGame.playerStatus || "Pending"}
                                                </span>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400">Pool ID</label>
                                                <p className="text-base font-mono text-gray-900 text-sm">
                                                    {selectedGame.poolId || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Ticket Information */}
                                <div>
                                    <h6 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                                        <span className="text-lg">🎫</span> Ticket Information
                                    </h6>
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400">Ticket Type</label>
                                                <p className="text-base font-bold text-gray-900">
                                                    {selectedGame.ticketType?.title || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400">Bid Amount</label>
                                                <p className="text-base font-bold text-green-600">
                                                    ${selectedGame.bidAmount || 0}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400">Ticket ID</label>
                                                <p className="text-base font-mono text-gray-900 text-sm">
                                                    {selectedGame.ticketType?._id || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Currency Details */}
                                {selectedGame.currencyDetails && (
                                    <div>
                                        <h6 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                                            <span className="text-lg">💱</span> Currency Details
                                        </h6>
                                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-400">USD Amount</label>
                                                    <p className="text-base font-bold text-gray-900">
                                                        ${selectedGame.currencyDetails.usdAmount || 0}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-400">Local Amount</label>
                                                    <p className="text-base font-bold text-gray-900">
                                                        {selectedGame.currencyDetails.localCurrency || ""} {selectedGame.currencyDetails.localAmount || 0}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-400">Exchange Rate</label>
                                                    <p className="text-base font-bold text-gray-900">
                                                        {selectedGame.currencyDetails.exchangeRate || 0}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-400">Country</label>
                                                    <p className="text-base font-bold text-gray-900">
                                                        {selectedGame.currencyDetails.userCountry || "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Game Numbers */}
                                <div>
                                    <h6 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                                        <span className="text-lg">🔢</span> Game Numbers
                                    </h6>
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5">
                                        <div className="flex flex-wrap gap-3">
                                            {selectedGame.numbers && selectedGame.numbers.length > 0 ? (
                                                selectedGame.numbers.map((num, i) => (
                                                    <span
                                                        key={i}
                                                        className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold rounded-full text-lg border-2 border-white shadow-lg"
                                                    >
                                                        {num}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-500">No numbers available</span>
                                            )}
                                            {selectedGame.powerball && (
                                                <span className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 text-white font-bold rounded-full text-lg border-2 border-white shadow-lg">
                                                    {selectedGame.powerball}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-3 text-center text-xs text-gray-500">
                                            <span className="font-bold text-red-500">●</span> Powerball highlighted in red
                                        </div>
                                    </div>
                                </div>

                                {/* Pool Information */}
                                {(selectedGame.poolTotalPlayers || selectedGame.poolTotalAmount) && (
                                    <div>
                                        <h6 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                                            <span className="text-lg">🏊</span> Pool Information
                                        </h6>
                                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-400">Pool ID</label>
                                                    <p className="text-base font-mono text-gray-900 text-sm">
                                                        {selectedGame.poolId || "N/A"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-400">Total Players</label>
                                                    <p className="text-base font-bold text-gray-900">
                                                        {selectedGame.poolTotalPlayers || 0}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-400">Total Amount</label>
                                                    <p className="text-base font-bold text-green-600">
                                                        ${selectedGame.poolTotalAmount || 0}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-400">Pool Status</label>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                                                        selectedGame.poolStatus === 'Open' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {selectedGame.poolStatus || "N/A"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Created At */}
                                <div>
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5">
                                        <div className="grid grid-cols-1">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400">Created At</label>
                                                <p className="text-base font-bold text-gray-900">
                                                    {selectedGame.createdAt ? new Date(selectedGame.createdAt).toLocaleString() : "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end space-x-3 border-t-2 border-gray-100 pt-4">
                                    <button
                                        className="px-6 py-2 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-md"
                                        onClick={handleCloseDetails}
                                    >
                                        ✕ Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>
        </div>
    );
};

export default AustraliaPowerballResult;