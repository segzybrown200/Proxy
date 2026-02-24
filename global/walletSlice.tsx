import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";

interface WalletInfo {
  id?: string;
  balance: number;
  currency?: string;
  updatedAt?: string;
}

interface WalletState {
  wallet: WalletInfo | null;
  transactions: any[];
  loading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  wallet: null,
  transactions: [],
  loading: false,
  error: null,
};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    setWallet: (state, action: PayloadAction<WalletInfo>) => {
      state.wallet = action.payload;
      state.error = null;
    },
    clearWallet: (state) => {
      state.wallet = null;
      state.transactions = [];
    },
    setTransactions: (state, action: PayloadAction<any[]>) => {
      state.transactions = action.payload;
    },
    appendTransaction: (state, action: PayloadAction<any>) => {
      state.transactions = [action.payload, ...state.transactions];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateBalance: (state, action: PayloadAction<number>) => {
      if (state.wallet) {
        state.wallet = { ...state.wallet, balance: action.payload };
      }
    },
  },
});

export const { setWallet, clearWallet, setTransactions, appendTransaction, setLoading, setError, updateBalance } = walletSlice.actions;

export const selectWallet = (state: RootState) => state.wallet.wallet;
export const selectWalletTransactions = (state: RootState) => state.wallet.transactions;
export const selectWalletLoading = (state: RootState) => state.wallet.loading;
export const selectWalletError = (state: RootState) => state.wallet.error;

export default walletSlice.reducer;
