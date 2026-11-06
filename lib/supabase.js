import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://plnowrqmlwroxonmstdm.supabase.co";
const key =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_phAM6bcfPSlHyc0n3KT76w_R36YEE2K";

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
