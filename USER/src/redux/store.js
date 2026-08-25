// store.js
import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";
import dailyClaimReducer from "./slices/dailyClaimSlice";
import withdrawalReducer from "./slices/withdrawalSlice";
import depositReducer from "./slices/depositSlice";
import bannerReducer from "./slices/bannerSlice";
import ticketTypeReducer from "./slices/ticketTypeSlice";

// ========================================
// AUSTRALIA
// ========================================
import australiaGameCountReducer from "./slices/australia/gameCountSlice";
import australiaGameEntryReducer from "./slices/australia/gameEntrySlice";

// ========================================
// PAKISTAN
// ========================================
import pakistanGameCountReducer from "./slices/pakistan/gameCountSlice";
import pakistanGameEntryReducer from "./slices/pakistan/gameEntrySlice";

// ========================================
// CANADA
// ========================================
import canadaGameCountReducer from "./slices/canada/gameCountSlice";
import canadaGameEntryReducer from "./slices/canada/gameEntrySlice";

// ========================================
// INDIA
// ========================================
import indiaGameCountReducer from "./slices/india/gameCountSlice";
import indiaGameEntryReducer from "./slices/india/gameEntrySlice";

// ========================================
// NEPAL
// ========================================
import nepalGameCountReducer from "./slices/nepal/gameCountSlice";
import nepalGameEntryReducer from "./slices/nepal/gameEntrySlice";

// ========================================
// UAE
// ========================================
import uaeGameCountReducer from "./slices/uae/gameCountSlice";
import uaeGameEntryReducer from "./slices/uae/gameEntrySlice";


// 👇 Matka Slices
import marketReducer from "./slices/marketSlice";
import bidReducer from "./slices/bidSlice";
import resultReducer from "./slices/resultSlice";
import publicBidReducer from "./slices/publicBidSlice";


export const store = configureStore({
  reducer: {

    // ========================================
    // COMMON USER
    // ========================================
    auth: authReducer,
    dailyClaim: dailyClaimReducer,
    withdrawal: withdrawalReducer,
    deposit: depositReducer,
    banner: bannerReducer,
    ticketType: ticketTypeReducer,


    // ========================================
    // AUSTRALIA
    // ========================================
    australiaGameCount: australiaGameCountReducer,
    australiaGameEntry: australiaGameEntryReducer,


    // ========================================
    // PAKISTAN
    // ========================================
    pakistanGameCount: pakistanGameCountReducer,
    pakistanGameEntry: pakistanGameEntryReducer,


    // ========================================
    // CANADA
    // ========================================
    canadaGameCount: canadaGameCountReducer,
    canadaGameEntry: canadaGameEntryReducer,


    // ========================================
    // INDIA
    // ========================================
    indiaGameCount: indiaGameCountReducer,
    indiaGameEntry: indiaGameEntryReducer,


    // ========================================
    // NEPAL
    // ========================================
    nepalGameCount: nepalGameCountReducer,
    nepalGameEntry: nepalGameEntryReducer,


    // ========================================
    // UAE
    // ========================================
    uaeGameCount: uaeGameCountReducer,
    uaeGameEntry: uaeGameEntryReducer,


    // ========================================
    // MATKA
    // ========================================
    market: marketReducer,
    bid: bidReducer,
    result: resultReducer,
    publicBid: publicBidReducer,
  },
});


export default store;