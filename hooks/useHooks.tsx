import { getCategory, getConversions, getNewListings, getPopularListings } from "api/api"
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
export const useCategoryListings = ( categoryId: string) => {
  const fetcher = async (url: string) => {
    const res = await axios.get(url);
    return res.data.data;
  };

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (!categoryId) return null; // pause if no category selected
    if (previousPageData && !previousPageData.nextCursor) return null; // reached end

    const cursor = pageIndex === 0 ? "" : previousPageData.nextCursor;
    return `https://proxy-backend-6of2.onrender.com/api/listings/search-category?categoryId=${categoryId}&limit=10${cursor ? `&cursor=${cursor}` : ""}`;
  };

  const { data, error, isLoading, size, setSize, mutate }:any = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
  });

  const listings = data ? data.flatMap((page:any) => page.listings) : [];
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
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateOnMount: true, // Ensure it fetches when the component 
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );
    return {
        messages: data?.data || [],
        isLoading,
        isError: error,
        mutate,
    };

}