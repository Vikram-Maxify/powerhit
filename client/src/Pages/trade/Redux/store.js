// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './Reducer/authReducer';
import betReducer from './Reducer/betReducer';
import paymentReducer from './Reducer/paymentReducer';

export const store = configureStore({
  reducer: {
    bet : betReducer,
    payment : paymentReducer,
  },
});