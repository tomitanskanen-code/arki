import { isSupabaseConfigured } from "@/lib/supabase/config"

import { localShoppingListRepository } from "./mock/shopping"
import type { ShoppingListRepository } from "./repositories"
import { supabaseShoppingListRepository } from "./supabase/shopping"

/** Selainpuolen tietolähteet: Supabase + Realtime, tai esittelytilassa localStorage. */
export const shoppingListRepository: ShoppingListRepository =
  isSupabaseConfigured
    ? supabaseShoppingListRepository
    : localShoppingListRepository
