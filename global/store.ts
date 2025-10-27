import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  persistReducer,
  REHYDRATE,
} from 'redux-persist'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; // or any other storage mechanism
import authReducer from './authSlice';
import listingReducer from './listingSlice';
// Create persist config for each reducer that needs persistence
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  version: 1,
  whitelist: ['user'],
};

const listingPersistConfig = {
  key: 'listing',
  storage: AsyncStorage,
  version: 1,
  whitelist: ['items'],
};



// Create persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedListingReducer = persistReducer(listingPersistConfig, listingReducer);

// Create the Redux store with persisted reducers
export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    listing: persistedListingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, REGISTER, PURGE],
      },
    }),
});

// Create the persistor
export const persistor = persistStore(store);

// Export types for usage in the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;