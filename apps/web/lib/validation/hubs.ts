import { z } from "zod"

export const hubSchema = z.object({
  name: z.string().trim().min(3, { error: "Use at least 3 characters." }).max(120),
  locationText: z.string().trim().min(3, { error: "Add a shared location." }).max(160),
})

export const inventorySchema = z.object({
  hubId: z.uuid({ error: "Hub not found." }),
  itemId: z.uuid({ error: "Item not found." }),
  quantity: z.coerce.number().int().min(1).max(100),
})

export const checkoutSchema = z.object({
  inventoryId: z.uuid({ error: "Inventory not found." }),
})
