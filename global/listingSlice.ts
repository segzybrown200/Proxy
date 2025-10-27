import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  media: any[];
  seller: any;
  // Add other fields as needed
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

const listingSlice = createSlice({
  name: 'listing',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(item => item.id === action.payload.id);
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push({ ...action.payload });
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    increaseQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) item.quantity += 1;
    },
    decreaseQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item && item.quantity > 1) item.quantity -= 1;
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const selectCartItems = (state: any) => state.listing.items;
export const selectCartTotal = (state: any) =>
  state.listing.items.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);

export const {
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
} = listingSlice.actions;

export default listingSlice.reducer;
