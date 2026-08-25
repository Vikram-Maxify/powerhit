// src/App.jsx

import { useDispatch, useSelector } from "react-redux";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { useEffect, useLayoutEffect } from "react";

// ========================================
// Common Components
// ========================================
import Activity from "./components/Activity.jsx";
import AppInitializer from "./components/AppInitializer.jsx";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import WithdrawalHistory from "./components/WithdrawalHistory.jsx";

// ========================================
// Common Pages
// ========================================
import Deposit from "./Pages/Deposit.jsx";
import DepositHistory from "./pages/DepositHistory.jsx";
import GameCounts from "./Pages/GameCounts.jsx";
import Homme from "./pages/Homme.jsx";
import Login from "./Pages/Login.jsx";
import ProfilePage from "./Pages/ProfilePage.jsx";
import PromoPage from "./pages/Promo/PromoPage.jsx";
import Register from "./Pages/Register.jsx";
import WalletDashboard from "./Pages/WalletDashboard.jsx";
import Withdrawal from "./Pages/Withdrawal.jsx";

// ========================================
// Powerhit Pages
// ========================================
import Account from "./Pages/Account.jsx";
import DepositPayment from "./Pages/DepositPayment.jsx";
import GameEntryResultPage from "./Pages/GameEntryResultPage .jsx";

// ========================================
// Other Pages
// ========================================
import Maintenance from "./Pages/Maintenance.jsx";

// ========================================
// Matka Pages
// ========================================
import PowerballResults from "./components/PowerballResults.jsx";
import AllResultsPage from "./Pages/Allresultspage.jsx";
import MatkaChartAnalysis from "./Pages/Matkachartanalysis.jsx";
import BidsHistory from "./Pages/user/BidsHistory.jsx";
import MatkaDashboard from "./Pages/user/Dashboard.jsx";
import MatkaMarkets from "./Pages/user/Markets.jsx";
import PlaceBid from "./Pages/user/PlaceBid.jsx";
import MatkaResults from "./Pages/user/Results.jsx";
import { getProfile } from "./redux/slices/authSlice.js";

// ========================================
// Scroll To Top
// ========================================
function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [pathname]);

  return null;
}

// ========================================
// Country Redirect Component
// ========================================
function CountryPowerhitRedirect() {
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);

  const countryRoutes = {
    IN: "india",
    AU: "australia",
    PK: "pakistan",
    CA: "canada",
    NP: "nepal",
    UAE: "uae",
  };

  useEffect(() => {
    const userCountry = user?.country?.toUpperCase();

    const countryPath = countryRoutes[userCountry];

    if (countryPath) {
      navigate(`/${countryPath}/powerhit`, {
        replace: true,
      });
    } else {
      // Fallback
      navigate("/india/powerhit", {
        replace: true,
      });
    }
  }, [user, navigate]);

  return null;
}

// ========================================
// App
// ========================================
function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, profileLoaded, isProfileLoading } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (isAuthenticated && !profileLoaded && !isProfileLoading) {
      dispatch(getProfile());
    }
  }, [isAuthenticated, profileLoaded, isProfileLoading, dispatch]);

  return (
    <>
      <ScrollToTop />

      <AppInitializer>
        <Navbar>
          <Routes>
            {/* ========================================
                PUBLIC ROUTES
            ======================================== */}

            <Route path="/" element={<Homme />} />

            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Register />} />

            {/* ========================================
                POWERHIT DEFAULT REDIRECT
                /powerhit → user's country
            ======================================== */}

            <Route
              path="/powerhit"
              element={
                <ProtectedRoute>
                  <CountryPowerhitRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/powerball/result"
              element={
                <ProtectedRoute>
                  <PowerballResults />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                COUNTRY-WISE POWERHIT
            ======================================== */}

            <Route
              path="/india/powerhit"
              element={
                <ProtectedRoute>
                  <GameCounts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/australia/powerhit"
              element={
                <ProtectedRoute>
                  <GameCounts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pakistan/powerhit"
              element={
                <ProtectedRoute>
                  <GameCounts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/canada/powerhit"
              element={
                <ProtectedRoute>
                  <GameCounts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/nepal/powerhit"
              element={
                <ProtectedRoute>
                  <GameCounts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/uae/powerhit"
              element={
                <ProtectedRoute>
                  <GameCounts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/publicresult"
              element={
                <ProtectedRoute>
                  <AllResultsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chartanalysis"
              element={
                <ProtectedRoute>
                  <MatkaChartAnalysis />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                PROMO
            ======================================== */}

            <Route
              path="/promo"
              element={
                <ProtectedRoute>
                  <PromoPage />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                PROFILE
            ======================================== */}

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                WALLET
            ======================================== */}

            <Route
              path="/wallet"
              element={
                <ProtectedRoute>
                  <WalletDashboard />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                ACTIVITY
            ======================================== */}

            <Route
              path="/activity"
              element={
                <ProtectedRoute>
                  <Activity />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                WITHDRAWAL
            ======================================== */}

            <Route
              path="/withdrawal"
              element={
                <ProtectedRoute>
                  <Withdrawal />
                </ProtectedRoute>
              }
            />

            <Route
              path="/withdrawal-history/:page?"
              element={
                <ProtectedRoute>
                  <WithdrawalHistory />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                DEPOSIT
            ======================================== */}

            <Route
              path="/deposit"
              element={
                <ProtectedRoute>
                  <Deposit />
                </ProtectedRoute>
              }
            />

            <Route
              path="/deposit/payment"
              element={
                <ProtectedRoute>
                  <DepositPayment />
                </ProtectedRoute>
              }
            />

            <Route
              path="/deposit-history"
              element={
                <ProtectedRoute>
                  <DepositHistory />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                ACCOUNT
            ======================================== */}

            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                POWERHIT HISTORY
            ======================================== */}

            <Route
              path="/india/powerhit/history"
              element={
                <ProtectedRoute>
                  <GameEntryResultPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/australia/powerhit/history"
              element={
                <ProtectedRoute>
                  <GameEntryResultPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pakistan/powerhit/history"
              element={
                <ProtectedRoute>
                  <GameEntryResultPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/canada/powerhit/history"
              element={
                <ProtectedRoute>
                  <GameEntryResultPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/nepal/powerhit/history"
              element={
                <ProtectedRoute>
                  <GameEntryResultPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/uae/powerhit/history"
              element={
                <ProtectedRoute>
                  <GameEntryResultPage />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                MATKA DASHBOARD
            ======================================== */}

            <Route
              path="/matka"
              element={
                <ProtectedRoute>
                  <MatkaDashboard />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                MATKA MARKETS
            ======================================== */}

            <Route
              path="/matka/markets"
              element={
                <ProtectedRoute>
                  <MatkaMarkets />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                MATKA PLACE BID
            ======================================== */}

            <Route
              path="/matka/place-bid/:marketId"
              element={
                <ProtectedRoute>
                  <PlaceBid />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                MATKA BIDS HISTORY
            ======================================== */}

            <Route
              path="/matka/bids-history"
              element={
                <ProtectedRoute>
                  <BidsHistory />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                MATKA RESULTS
            ======================================== */}

            <Route
              path="/matka/results"
              element={
                <ProtectedRoute>
                  <MatkaResults />
                </ProtectedRoute>
              }
            />

            {/* ========================================
                404 / MAINTENANCE
            ======================================== */}

            <Route path="*" element={<Maintenance />} />
          </Routes>
        </Navbar>
      </AppInitializer>
    </>
  );
}

export default App;
