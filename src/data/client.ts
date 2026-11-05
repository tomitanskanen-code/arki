import { isSupabaseConfigured } from "@/lib/supabase/config"

import { localShoppingListRepository } from "./mock/shopping"
import { localTaskRepository } from "./mock/tasks"
import type { ShoppingListRepository, TaskRepository } from "./repositories"
import { supabaseShoppingListRepository } from "./supabase/shopping"
import { supabaseTaskRepository } from "./supabase/tasks"

/** Selainpuolen tietolähteet: Supabase + Realtime, tai esittelytilassa localStorage. */
export const shoppingListRepository: ShoppingListRepository =
  isSupabaseConfigured
    ? supabaseShoppingListRepository
    : localShoppingListRepository

export const taskRepository: TaskRepository = isSupabaseConfigured
  ? supabaseTaskRepository
  : localTaskRepository
