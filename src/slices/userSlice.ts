
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
    uid: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: string;
    photoURL: string;
    denomination: string;
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
    provider: string;
    createdAt: string;
    isLoggedIn: boolean;
    authLoading: boolean;
}


interface UserUpdate {
    uid: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: string;
    photoURL?: string;
    denomination?: string;
    isPhoneVerified?: boolean;
    isEmailVerified?: boolean;
    provider: string;
    createdAt?: string;
}

const initialState: UserState = {
    uid: "",
    name: "",
    email: "",
    phoneNumber: "",
    role: "",
    photoURL: "",
    denomination: "",
    isPhoneVerified: false,
    isEmailVerified: false,
    provider: "",
    createdAt: "",
    isLoggedIn: false,
    authLoading: true,
}

export const userSlice = createSlice({
    name: "user",
    initialState: initialState,
    reducers: {
        setUser: (state, action:PayloadAction<UserUpdate>) => {
            state.uid = action.payload.uid;
            state.name = action.payload.name;
            state.email = action.payload.email;
            state.phoneNumber = action.payload.phoneNumber || "";
            state.role = action.payload.role;
            state.photoURL = action.payload.photoURL || "";
            state.denomination = action.payload.denomination || "";
            state.isPhoneVerified = action.payload.isPhoneVerified ?? false;
            state.isEmailVerified = action.payload.isEmailVerified ?? false;
            state.provider = action.payload.provider;
            state.createdAt = action.payload.createdAt || "";
            state.isLoggedIn = true;
            state.authLoading = false;
        },
        clearUser: (state) => {
            state.uid = "";
            state.name = "";
            state.email = "";
            state.phoneNumber = "";
            state.role = "";
            state.photoURL = "";
            state.denomination = "";
            state.isPhoneVerified = false;
            state.isEmailVerified = false;
            state.provider = "";
            state.createdAt = "";
            state.isLoggedIn = false;
            state.authLoading = false;
        },

    }
})

export const { setUser, clearUser } = userSlice.actions;

export default userSlice.reducer;