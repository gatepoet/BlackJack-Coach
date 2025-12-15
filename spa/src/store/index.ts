// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import statsReducer from '../components/stats/statsSlice';

export const store = configureStore({
  reducer: {
    stats: statsReducer,
  },
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
