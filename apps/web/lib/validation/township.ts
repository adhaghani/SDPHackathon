import { z } from "zod"

export type Boundary = { type: "Polygon"; coordinates: number[][][] }

export const boundarySchema = z
  .object({
    type: z.literal("Polygon"),
    coordinates: z
      .array(
        z
          .array(
            z.tuple([
              z.number().finite().min(-180).max(180),
              z.number().finite().gt(-90).lt(90),
            ])
          )
          .min(4)
          .max(501)
      )
      .length(1),
  })
  .refine(({ coordinates }) => {
    const ring = coordinates[0]!
    return ring[0]![0] === ring.at(-1)![0] && ring[0]![1] === ring.at(-1)![1]
  }, "Close the boundary by connecting its last point to its first point.")

export const townshipSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  join_code: z
    .string()
    .min(6)
    .max(40)
    .regex(/^[A-Z0-9-]+$/),
  state: z.string().trim().min(1).max(100),
  district: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2000),
  boundary: boundarySchema,
  neighbourhoods: z.array(z.string().trim().min(1).max(100)).min(1).max(100),
  auto_approve_members: z.boolean(),
  require_event_approval: z.boolean(),
  acknowledge_overlaps: z.boolean(),
  lifecycle: z.enum(["draft", "active", "archived"]),
})

export const managerSchema = z.object({
  townshipId: z.string().uuid(),
  displayName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
})

export function townshipError(message: string): string {
  if (message.includes("platform_admin_required"))
    return "Superadmin access is required."
  if (message.includes("invalid_boundary"))
    return "Draw a valid boundary. Edges must not cross each other."
  if (message.includes("boundary_overlap_confirmation_required"))
    return "This boundary overlaps another township. Review and acknowledge the overlap."
  if (message.includes("manager_required_before_activation"))
    return "Appoint a manager before activating this township."
  if (message.includes("last_active_manager"))
    return "Appoint another active manager before removing the last manager."
  if (message.includes("invitation_rate_limited"))
    return "Wait a minute before sending another invitation."
  if (message.includes("duplicate key"))
    return "That township slug or join code is already in use. Choose another."
  if (message.includes("township_not_available"))
    return "This township is unavailable. Restore it before assigning a manager."
  return "We could not save this change. Check your details and try again."
}
