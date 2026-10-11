"use server"

import { revalidatePath } from "next/cache"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { checkoutSchema, hubSchema, inventorySchema } from "@/lib/validation/hubs"

export type HubActionState = {
  status: "idle" | "error" | "success"
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export async function createHub(
  _state: HubActionState,
  formData: FormData
): Promise<HubActionState> {
  const parsed = hubSchema.safeParse({ name: formData.get("name"), locationText: formData.get("locationText") })
  if (!parsed.success) return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors, message: "Check the hub fields." }
  const active = await requireActiveMember()
  const supabase = await createClient()
  const { error } = await supabase.rpc("create_equipment_hub", {
    p_payload: { township_id: active.townshipId, name: parsed.data.name, location_text: parsed.data.locationText },
  })
  if (error) return { status: "error", message: "Only organisers and township admins can create hubs." }
  revalidatePath("/admin/hubs")
  return { status: "success", message: "Equipment hub created." }
}

export async function addInventory(
  _state: HubActionState,
  formData: FormData
): Promise<HubActionState> {
  const parsed = inventorySchema.safeParse({ hubId: formData.get("hubId"), itemId: formData.get("itemId"), quantity: formData.get("quantity") })
  if (!parsed.success) return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors, message: "Check the inventory fields." }
  const supabase = await createClient()
  const { error } = await supabase.rpc("add_hub_inventory", {
    p_payload: { hub_id: parsed.data.hubId, item_id: parsed.data.itemId, quantity: parsed.data.quantity },
  })
  if (error) return { status: "error", message: "Only hub staff can add their own items." }
  revalidatePath("/admin/hubs")
  return { status: "success", message: "Inventory added." }
}

export async function checkoutInventory(
  _state: HubActionState,
  formData: FormData
): Promise<HubActionState> {
  const parsed = checkoutSchema.safeParse({ inventoryId: formData.get("inventoryId") })
  if (!parsed.success) return { status: "error", message: "Inventory not found." }
  const supabase = await createClient()
  const { error } = await supabase.rpc("checkout_hub_inventory", { p_inventory_id: parsed.data.inventoryId })
  if (error) return { status: "error", message: "That item is not available for checkout." }
  revalidatePath("/admin/hubs")
  return { status: "success", message: "Item checked out." }
}
