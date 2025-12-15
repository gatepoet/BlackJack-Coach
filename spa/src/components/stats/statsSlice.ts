// src/components/stats/statsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AppState } from '../../store';

export const fetchStats = createAsyncThunk('stats/fetch', async () => {
  // Replace this with real API / IndexedDB read
  return {
    totalCards: 1234,
    runningCount: 27,
    trueCountAvg: 1.34,
    betCorrelation: 56,
    winLossRatio: 1.12,
    profitLoss: 45.23,
    sessionsPlayed: 5,
    highCount: 342,
    lowCount: 892,
    trueCount: [1, 2, 1, 0, 3], // example array for chart
    cards: [],
    count: 0,
    sessions: [],
  };
});

export const statsSlice = createSlice({
  name: 'stats',
  initialState: {
    data: null as any,
    loading: false,
    error: null as string | null,
  },
  reducers: {
    clearStats: (state) => {
      state.data = null;
      state.error = null;
      state.loading = false;
    },
    setSessionCards: (state, action) => {
      if (!state.data) return;
      state.data.cards = action.payload.cards;
      state.data.count = action.payload.count;
    },
    endSession: (state, action) => {
      if (!state.data) return;
      const newSession = {
        id: action.payload.sessionId,
        startTime: new Date(),
        cards: state.data.cards,
        trueCount: state.data.count,
      };
      state.data.sessions = [...(state.data.sessions || []), newSession];
      state.data.cards = [];
      state.data.count = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      });
  },
});

export const { clearStats, setSessionCards, endSession } = statsSlice.actions;

export const selectStats = (state: AppState) => state.stats.data;
export const selectStatsLoading = (state: AppState) => state.stats.loading;
export const selectStatsError = (state: AppState) => state.stats.error;
export const selectAllSessions = (state: AppState) => state.stats.data?.sessions ?? [];

export default statsSlice.reducer;
