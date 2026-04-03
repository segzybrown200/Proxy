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
        },
        updateUserState: (state, action: PayloadAction<{name?: string; email?: string; phone?: string}>) => {
            if (state.user) {
                state.user = {
                    ...state.user,
                    data: {
                        ...(state.user as any).data,
                        user: {
                            ...(state.user as any).data.user,
                            ...action.payload
                        }
                    }
                };
            }
        },
        addSellerRole: (state) => {
            if (state.user) {
                const currentRoles = (state.user as any).data?.user?.roles || (state.user as any).data?.user?.role || [];
                const roleArray = Array.isArray(currentRoles) ? currentRoles : [currentRoles];
                const normalized = new Set(roleArray.map((r: any) => String(r).toUpperCase()));
                normalized.add("SELLER");

                state.user = {
                    ...state.user,
                    data: {
                        ...(state.user as any).data,
                        user: {
                            ...(state.user as any).data.user,
                            roles: Array.from(normalized),
                        },
                    },
                };
            }
        }
    },
});

export const { loginState, logoutState, VisitorState, pendingUserState, pendingUserLogout, updateUserState, addSellerRole } = authState.actions;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsVisitor = (state: RootState) => state.auth.isVisitor;
export const selectPendingUser = (state: RootState) => state.auth.pendingUser;

export default authState.reducer;