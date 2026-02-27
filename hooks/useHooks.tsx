import { getActiveDeliveries, getAllMessages, getCategory, getConversions, getNewListings, getOrders, getPopularListings, getRiderHistory, getRiderStatus, getSingleDeliveryOrder, getWalletBalance } from "api/api"
import { getWalletTransactions, getTransactionHistory } from "api/api"
import axios from "axios";
import useSWR  from "swr"
import { SWRConfiguration } from "swr"
import useSWRInfinite from "swr/infinite";


// Persistent cache provider using localStorage
const localStorageProvider = (): Map<string, any> => {
  // When initializing, we restore the data from localStorage into a map.
  const map = new Map<string, any>(JSON.parse(localStorage.getItem('app-cache') || '[]'));
  // Before unloading the app, we write back all the data into localStorage.
  window.addEventListener('beforeunload', () => {
    const appCache = JSON.stringify(Array.from(map.entries()));
    localStorage.setItem('app-cache', appCache);
  });
  return map;
};

export function useCategory() {
    const fetcher = getCategory;
    const swrConfig: SWRConfiguration = {
        revalidateOnFocus: false,
        provider: typeof window !== 'undefined' ? localStorageProvider : undefined,
    };
    const { data, error, isLoading, mutate } = useSWR("/admin/get-category", fetcher, swrConfig);
    return {
        categories: data?.data || [],
        isLoading,
        isError: error,
        mutate,
    };
}
export const useCategoryListings = (
  params: { categoryId?: string; subCategoryId?: string }
) => {

  const { categoryId, subCategoryId } = params;

  const fetcher = async (url: string) => {
    const res = await axios.get(url);
    return res.data.data;
  };

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (!categoryId && !subCategoryId) return null; 
    if (previousPageData && !previousPageData.nextCursor) return null; 

    const cursor = pageIndex === 0 ? "" : previousPageData.nextCursor;

    let url = `https://proxy-backend-6of2.onrender.com/api/listings/search-category?limit=10`;

    // Add filters
    if (categoryId) url += `&categoryId=${categoryId}`;
    // Send `subCategoryId` (camelCase) to match the Prisma field/back-end
    if (subCategoryId) url += `&subCategoryId=${subCategoryId}`;
    if (cursor) url += `&cursor=${cursor}`;

    return url;
  };

  const { data, error, isLoading, size, setSize, mutate }: any =
    useSWRInfinite(getKey, fetcher, {
      revalidateOnFocus: false,
      revalidateOnMount: false, // use cached/prefetched data on mount
      dedupingInterval: 60000, // 60s dedupe window
    });

  const listings = data ? data.flatMap((page: any) => page.listings) : [];
  const isReachingEnd = data && !data[data.length - 1]?.nextCursor;

  return {
    listings,
    isLoading,
    isError: !!error,
    loadMore: () => !isReachingEnd && setSize(size + 1),
    isReachingEnd,
    mutate,
  };
};


export const useSearchListings = (params: Record<string, any> | null) => {
  const fetcher = async (key: string) => {
    // key is the serialized params string, but we'll call API directly with params
    const searchParams = params || {};
    const res = await (await import("../api/api")).searchListings(searchParams);
    return res.data;
  };

  // Build SWR key based on serialized params so it revalidates when filters change
  const key = params ? `/listings/search?${Object.keys(params)
    .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&")}` : null;

  const { data, error, isLoading, mutate }: any = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    listings: data?.data || [],
    isLoading,
    isError: !!error,
    mutate,
  };
};

export const usePopularListings = ()=>{
    const fetcher = getPopularListings;

    const { data, error, isLoading ,mutate}:any = useSWR(
     `/listings/popular`, fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateOnMount: true, // Ensure it fetches when the component 
    }
  );
    return {
        popular: data?.data || [],
        isLoading,
        isError: error,
        mutate,
    };

}
export const useNewListings = ()=>{
    const fetcher = getNewListings;

    const { data, error, isLoading ,mutate}:any = useSWR(
     `/listings/new` , fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateOnMount: true, // Ensure it fetches when the component 
    }
  );

  // console.log(data)

    return {
        listings: data?.data || [],
        isLoading,
        isError: error,
        mutate,
    };

}
export const useGetConversions = (id:string, token:string)=>{
    const fetcher = (id:string, token:string) => getConversions(id,token);
    
    const { data, error, isLoading ,mutate} = useSWR(
    token ? `/messages/${id}` : null,
    ()=>fetcher(id,token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateOnMount: true, // Ensure it fetches when the component 
      refreshInterval: 10000, // Refresh every 30 seconds
    }
  );
    return {
        messages: data?.data || [],
        isLoading,
        isError: error,
        mutate,
    };

}
export const useMessages = (token:string)=>{
    const fetcher = (token:string) => getAllMessages(token);

    const { data, error, isLoading ,mutate} = useSWR(
    token ? `/messages/messages/chats` : null,
    ()=>fetcher(token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateOnMount: true, // Ensure it fetches when the component 
    }
  );
    return {
        messages: data?.data || [],
        isLoading,
        isError: error,
        mutate,
    };

}
export const useRider = (token:string)=>{
    const fetcher = (token:string) => getRiderStatus(token);

    const { data, error, isLoading ,mutate} = useSWR(
    token ? `/rider/me` : null,
    ()=>fetcher(token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateOnMount: true, // Ensure it fetches when the component 
    }
  );
    return {
        rider: data?.data || [],
        isLoading,
        isError: error,
        mutate,
    };

}
export const useUserOrder = (token:string)=>{
    const fetcher = (token:string) => getOrders(token);

    const { data, error, isLoading ,mutate} = useSWR(
    token ? `/listings/get-user-order` : null,
    ()=>fetcher(token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateOnMount: true, // Ensure it fetches when the component 
    }
  );
    return {
        order: data?.data || [],
        isLoading,
        isError: error,
        mutate,
    };

}
export const useRiderHistory = (token:string)=>{
    const fetcher = (token:string) => getRiderHistory(token);

    const { data, error, isLoading ,mutate} = useSWR(
    token ? `/rider/history` : null,
    ()=>fetcher(token,),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateOnMount: true, // Ensure it fetches when the component 
    }
  );
    return {
        history: data?.data || [],
        isLoading,
        isError: error,
        mutate,
    };

}
export const useRiderActiveOrder = (token:string)=>{
    const fetcher = (token:string) => getActiveDeliveries(token);

    const { data, error, isLoading ,mutate} = useSWR(
    token ? `/rider/active-deliveries` : null,
    ()=>fetcher(token,),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateOnMount: true, // Ensure it fetches when the component 
      refreshInterval: 30000
    }
  );
    return {
        active: data?.data || [],
        isLoading,
        isError: error,
        mutate,
    };

}
export const useSingleOrder = (token:string, id:string)=>{
    const fetcher = (token:string, id:string) => getSingleDeliveryOrder(token, id);

    const { data, error, isLoading ,mutate} = useSWR(
    token ? `rider/delivery/${id}` : null,
    ()=>fetcher(token, id),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateOnMount: true, // Ensure it fetches when the component 
      refreshInterval: 10000
    }
  );
    return {
        delivery: data?.data || [],
        isLoading,
        isError: error,
        mutate,
    };

}

export const useWalletBalance = (token?: string) => {
  const fetcher = (token?: string) => getWalletBalance(token);
  console.log(token)


  const { data, error, isLoading, mutate }: any = useSWR(
    token ? `/wallet/balance` : null,
    () => fetcher(token),

    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateOnMount: true,
    }
  );
  
  // console.log("data", data.data)
  const wallet = data?.data?.data || {};

  return {
    balance: Number(wallet.balance) || 0,
    currency: wallet.currency || '₦',
    updatedAt: wallet.updatedAt,
    walletId: wallet.walletId,
    isLoading,
    isError: !!error,
    mutate,
  };
};

export const useWalletTransactions = (token?: string, params?: { limit?: number; skip?: number }) => {
  const fetcher = (token?: string, params?: { limit?: number; skip?: number }) => getWalletTransactions(token, params);

  const key = token ? `/wallet/transactions?limit=${params?.limit || 50}&skip=${params?.skip || 0}` : null;

  const { data, error, isLoading, mutate }:any = useSWR(
    key,
    () => fetcher(token, params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateOnMount: true,
    }
  );


  // Support different response shapes like { data: { transactions: [...] } } or { transactions: [...] }
  const txs = data?.data?.data?.transactions || data?.transactions || data?.data || [];

  return {
    transactions: Array.isArray(txs) ? txs : [],
    isLoading,
    isError: !!error,
    mutate,
    refetch: () => mutate(), // Expose refetch function
  };
};

// hook for combined transaction history (orders + wallet)
export const useTransactionHistory = (token?: string, params?: { limit?: number; skip?: number; type?: string; status?: string; startDate?: string; endDate?: string }) => {
  const fetcher = (token?: string, params?: any) => getTransactionHistory(token, params);
  const key = token ? `/payments/transactions?limit=${params?.limit || 50}&skip=${params?.skip || 0}` : null;

  const { data, error, isLoading, mutate }: any = useSWR(
    key,
    () => fetcher(token, params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateOnMount: true,
    }
  );

  const txs = data?.data?.data?.transactions || data?.transactions || data?.data || [];

  return {
    transactions: Array.isArray(txs) ? txs : [],
    isLoading,
    isError: !!error,
    mutate,
    refetch: () => mutate(),
  };
};
