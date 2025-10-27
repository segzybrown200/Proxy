// api.ts
import axios from "axios";

const API_URL = "https://proxy-backend-6of2.onrender.com/api";

export const api = axios.create({
  baseURL: API_URL,
});

export const setAuthToken = (token: string | null) => {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
};

export const createUser = async(data: { email: string; password: string, name: string, phone:string }) => {
  return api.post("/auth/register", data).catch((error) => {
    throw error.response?.data || error;
  });

}
export const loginUser = async(data: { email: string; password: string }) => {
  return api.post("/auth/login", data).catch((error) => {
    throw error.response?.data || error;
  });
}
export const forgotPassword = async(data:{email:string}) => {
  return api.post("/auth/forgot-password", data ).catch((error) => {
    throw error.response?.data || error;
  });
}

export const resetPassword = async(data:{email:string, otp:string, newPassword:string}) => {
  return api.post("/auth/reset-password", data ).catch((error) => {
    throw error.response?.data || error;
  });
}
export const resendOTPEmail = async(data:{email:string}) => {
  return api.post("/auth/resend-reset-otp",  data ).catch((error) => {
    throw error.response?.data || error;
  });
}

export const sendOTPEmail = async(data:{email:string, phone: string, verifyOption: string}) => {
  return api.post("/auth/send-otp",  data ).catch((error) => {
    throw error.response?.data || error;
  });
}

export const verifyOTP = async(data:{email:string, phone:string, otp:string}) => {
  return api.post("/auth/verify-otp", data).catch((error) => {
    throw error.response?.data || error;
  });
}
export const getCategory = async() => {
  return api.get("/admin/get-category").catch((error) => {
    throw error.response?.data || error;
  });
}
export const getPopularListings = async() => {
  return api.get("/listings/popular").catch((error) => {
    throw error.response?.data || error;
  });
}
export const getNewListings = async() => {
  return api.get("/listings/new").catch((error) => {
    throw error.response?.data || error;
  });
}
export const getConversions = async(otherUserId:string, token:string) => {
  return api.get(`/messages/${otherUserId}`,{
     headers: {
          Authorization: `Bearer ${token}`,
        }
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

export const SearchListings = async(categoryId:string, cursor:string ) => {
  return api.get(`/listings/search-category`, {
    params:{
      categoryId,
      limit: 10,
      cursor
    }
  }).catch((error) => {
    throw error.response?.data || error;
  })
}