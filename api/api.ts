// api.ts
import axios from "axios";

const API_URL = "https://proxy-backend-1rfl.onrender.com/api";

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
export const searchListings = async(params: Record<string, any>) => {
  return api.get(`/listings/search`, {
    params,
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

export const getListingDetails = async(listingId: string) => {
  return api.get(`/listings/listing/${listingId}`).catch((error) => {
    throw error.response?.data || error;
  });
}

export const markMessagesAsRead = async(senderId: string, token: string) => {
  return api.post("/messages/read", { senderId }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  });
}
export const getAllMessages = async(token:string) => {
  return api.get(`/messages/messages/chats`,
        {
        headers: {
          Authorization: `Bearer ${token}`,
        }}
  ).catch((error) => {
    throw error.response?.data || error;
  })
}

export const orderPlaced = async(data:any,reference:string, token:string) => {
  return api.post(`/vendor/create-delivery?reference=${reference}`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  });
}
// Get order preview with calculated delivery fees and final total
export const getOrderPreview = async(data:any, token:string) => {
  return api.post(`/vendor/delivery/preview`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

export const placeWalletOrder = async(data:any, token:string) => {
  return api.post(`/vendor/create-delivery`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  });
}
export const getUserAuth = async(token:string) => {
  return api.get(`/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

export const reportContent = async(data: { targetType: string; targetId: string; reason: string }, token: string) => {
  return api.post('/reports', data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

// Create a Stripe PaymentIntent on the server.
// The backend should implement an endpoint that accepts { amount, currency }
// and returns { clientSecret } (the PaymentIntent client_secret).
export const createStripePaymentIntent = async(data:any, token?:string) => {
  return api.post(`/payments/create-payment-intent`, data, {
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : undefined,
  }).catch((error) => {
    throw error.response?.data || error;
  });
}
export const createStripeWalletIntent = async(data:any, token?:string) => {
  return api.post(`/payments/wallet/stripe-intent`, data, {
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : undefined,
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

export const updateUser = async(data: {name?: string, email?: string, phone?: string}, token: string) => {
  return api.put('/auth/user/update', data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

export const getOrders = async(token:string) => {
  return api.get("/listings/get-user-order", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

export const registerRider = async(data:any, token:string) => {
  return api.post("/rider/register", data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

export const riderKYCUpload = async(data:any, token:string, onUploadProgress?: (percent: number) => void) => {
  return api.post("/rider/kyc/upload", data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-type": 'multipart/form-data'
    },
    onUploadProgress: (progressEvent: any) => {
      try {
        const { loaded, total } = progressEvent;
        if (total) {
          const percent = Math.round((loaded * 100) / total);
          if (onUploadProgress) onUploadProgress(percent);
        }
      } catch (e) {
        // ignore
      }
    }
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

export const riderVechicleUpload = async(data:any, token:string, onUploadProgress?: (percent: number) => void) => {
  return api.post("/rider/vehicle", data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-type": 'multipart/form-data'
    },
    onUploadProgress: (progressEvent: any) => {
      try {
        const { loaded, total } = progressEvent;
        if (total) {
          const percent = Math.round((loaded * 100) / total);
          if (onUploadProgress) onUploadProgress(percent);
        }
      } catch (e) {
        // ignore progress errors
      }
    }
  }).catch((error) => {
    throw error.response?.data || error;
  });
}
export const getRiderStatus = async(token:string) => {
  return api.get("/rider/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

// Rider wallet endpoints
export const getRiderWalletBalance = async(token?: string) => {
  return api.get(`/payments/rider/wallet/balance`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

export const getRiderWalletHistory = async(token?: string, params?: { limit?: number; skip?: number }) => {
  return api.get(`/payments/rider/wallet/history`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    params,
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

export const getRiderWalletTransactionDetail = async(token?: string, transactionId?: string) => {
  return api.get(`/payments/rider/wallet/history/${transactionId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

// Held escrow transactions that are waiting release to rider (used by earnings UI)
export const getRiderHeldEscrowTransactions = async(token?: string, params?: { limit?: number; skip?: number }) => {
  return api.get(`/rider/held-escrow-transactions`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    params,
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

export const getRiderHistory = async(token:string) => {
  return api.get("/rider/history", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  })
}
export const getActiveDeliveries = async(token:string) => {
  return api.get("/rider/active-deliveries", {
    headers: {
       Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  })
}
export const markedPickup = async(token:string, deliveryId:string) => {
  return api.post(`/rider/pickup/${deliveryId}`, {}, {
    headers: {
       Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  })
}
export const startTransitDelivery = async(token:string, deliveryId:string) => {
  return api.post(`/rider/start-pickup/${deliveryId}`, {}, {
    headers: {
       Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  })
}
export const completeOrder = async(token:string, deliveryId:string, otp:string) => {
  return api.post(`/rider/complete-delivery/${deliveryId}`, {otp}, {
    headers: {
       Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  })
}
export const getSingleDeliveryOrder = async(token:string, deliveryId:string) => {
  return api.get(`/rider/delivery/${deliveryId}`, {
    headers: {
       Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  })
}

export const completeOrderWithOTP = async(token:string, deliveryId:string, otp:string) => {
  return api.post(`/rider/complete-delivery/${deliveryId}`, { otp }, {
    headers: {
       Authorization: `Bearer ${token}`
    }
  }).catch((error) => {
    throw error.response?.data || error;
  })
}

export const verifyNinNumber = async(nin: string) => {
  return api.post("/kyc/verify-nin", { nin }).catch((error) => {
    throw error.response?.data || error;
  });
}

// Wallet APIs
export const fundWalletPaystack = async(data: { amount: number; reference: string }, token?: string) => {

  return api.post(`/payments/wallet/fund-paystack`, data, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

export const fundWalletStripe = async(data: { amountNgn: number; paymentIntentId: string }, token?: string) => {
  return api.post(`/payments/wallet/fund-stripe`, data, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

export const getWalletBalance = async(token?: string) => {
  return api.get(`/payments/wallet/balance`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

export const getWalletTransactions = async(token?: string, params?: { limit?: number; skip?: number }) => {
  return api.get(`/payments/wallet/history`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    params,
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

// combined order + wallet transaction history for customer
export const getTransactionHistory = async(token?: string, params?: { limit?: number; skip?: number; type?: string; status?: string; startDate?: string; endDate?: string }) => {
  return api.get(`/payments/customer/transactions`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    params,
  }).catch((error) => {
    throw error.response?.data || error;
  });
}

export const chargeWallet = async(data: { amount: number; orderId?: string }, token?: string) => {
  return api.post(`/payments/wallet/charge`, data, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }).catch((error) => {
    throw error.response?.data || error;
  });
}
