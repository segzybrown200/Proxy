import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import { RootState } from "./store";

interface AuthState {
    user: object | null;
    isVisitor: boolean;
    pendingUser: object | null;
}

const initialState: AuthState = {
    user: null,
    isVisitor: false,
    pendingUser: null,
};

const authState = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginState: (state, action: PayloadAction<object>) => {
            state.user = action.payload;
        },
        logoutState: (state) => {
            state.user = null;
        },
        VisitorState: (state, action: PayloadAction<boolean>) => {
            state.isVisitor = action.payload;
        },
        pendingUserState: (state, action: PayloadAction<object | null>) => {
            state.pendingUser = action.payload;
        },
        pendingUserLogout: (state) => {
            state.pendingUser = null;
        }
    },
});

export const { loginState, logoutState, VisitorState, pendingUserState,pendingUserLogout } = authState.actions;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsVisitor = (state: RootState) => state.auth.isVisitor;
export const selectPendingUser = (state: RootState) => state.auth.pendingUser;

export default authState.reducer;