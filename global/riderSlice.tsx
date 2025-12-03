import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface RiderRegistrationState {
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    phone: string;
    vehicleType: string;
  } | null;
  kycDocuments: {
    licensePhoto: string;
    profilePhoto: string;
    identityDocument: string;
    addressProof: string;
  } | null;
  vehicleDetails: {
    make: string;
    model: string;
    year: string;
    plateNumber: string;
    registrationDoc: string;
    insurance: string;
    photos: string[];
  } | null;
  registrationStatus: "not-started" | "in-progress" | "pending-review" | "approved" | "rejected";
  currentStep: number;
  isRider: boolean;
}

const initialState: RiderRegistrationState = {
  personalInfo: null,
  kycDocuments: null,
  vehicleDetails: null,
  registrationStatus: "not-started",
  currentStep: 1,
  isRider: false,
};

const riderSlice = createSlice({
  name: "rider",
  initialState,
  reducers: {
    setPersonalInfo: (state, action: PayloadAction<RiderRegistrationState["personalInfo"]>) => {
      state.personalInfo = action.payload;
      state.currentStep = 2;
    },
    setKycDocuments: (state, action: PayloadAction<RiderRegistrationState["kycDocuments"]>) => {
      state.kycDocuments = action.payload;
      state.currentStep = 3;
    },
    setVehicleDetails: (state, action: PayloadAction<RiderRegistrationState["vehicleDetails"]>) => {
      state.vehicleDetails = action.payload;
      state.registrationStatus = "pending-review";
    },
    setRegistrationStatus: (state, action: PayloadAction<RiderRegistrationState["registrationStatus"]>) => {
      state.registrationStatus = action.payload;
    },
    setIsRider: (state, action: PayloadAction<boolean>) => {
      state.isRider = action.payload;
    },
    resetRiderRegistration: (state) => {
      return initialState;
    },
  },
});

export const {
  setPersonalInfo,
  setKycDocuments,
  setVehicleDetails,
  setRegistrationStatus,
  setIsRider,
  resetRiderRegistration,
} = riderSlice.actions;

export default riderSlice.reducer;