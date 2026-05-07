import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const createUserSchema = {
  body: z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().min(6),
    password: z.string().min(8),
    role: z.enum(["ADMIN", "STAFF", "DRIVER", "CUSTOMER"]),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  }),
};

export const listUsersSchema = {
  query: paginationQuerySchema.extend({
    role: z.enum(["ADMIN", "STAFF", "DRIVER", "CUSTOMER"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  }),
};

export const userIdParamsSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
};

export const updateUserStatusSchema = {
  params: userIdParamsSchema.params,
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE"]),
  }),
};

export const updateUserRoleSchema = {
  params: userIdParamsSchema.params,
  body: z.object({
    role: z.enum(["ADMIN", "STAFF", "DRIVER", "CUSTOMER"]),
  }),
};

