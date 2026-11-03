import { localShoppingListRepository } from "./mock/shopping"
import type { ShoppingListRepository } from "./repositories"

/** Selainpuolen tietolähteet. Vaiheessa 2: Supabase + Realtime. */
export const shoppingListRepository: ShoppingListRepository =
  localShoppingListRepository
