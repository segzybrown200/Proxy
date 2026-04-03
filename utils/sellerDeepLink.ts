import { Linking, Platform } from "react-native";

export const SELLER_URL_SCHEME = "proxy://(tabs)";
export const SELLER_PLAY_STORE_URL = "https://play.google.com/apps/internaltest/4701379656581750799";
export const SELLER_APP_STORE_URL = "https://apps.apple.com/app/id1234567890";

export const openSellerAppWithFallback = async (): Promise<{ opened: boolean; fallbackUrl?: string; error?: string }> => {
  try {
    const canOpen = await Linking.canOpenURL(SELLER_URL_SCHEME);
    if (canOpen) {
      await Linking.openURL(SELLER_URL_SCHEME);
      return { opened: true };
    }

    const fallbackUrl = Platform.OS === "ios" ? SELLER_APP_STORE_URL : SELLER_PLAY_STORE_URL;
    await Linking.openURL(fallbackUrl);
    return { opened: false, fallbackUrl };
  } catch (err: any) {
    const fallbackUrl = Platform.OS === "ios" ? SELLER_APP_STORE_URL : SELLER_PLAY_STORE_URL;
    try {
      await Linking.openURL(fallbackUrl);
      return { opened: false, fallbackUrl, error: err?.message || "Unable to open seller app." };
    } catch (fallbackErr: any) {
      return { opened: false, fallbackUrl, error: fallbackErr?.message || "Failed to open fallback store." };
    }
  }
};
