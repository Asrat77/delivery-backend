import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const issueIdParamsSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
};

export const createIssueSchema = {
  body: z.object({
    trackingNumber: z.string().min(3),
    issueType: z.enum([
      "DAMAGED_ITEM",
      "MISSING_ITEM",
      "LATE_DELIVERY",
      "WRONG_ADDRESS",
      "PACKAGE_NOT_RECEIVED",
      "OTHER",
    ]),
    email: z.string().email(),
    phone: z.string().min(6),
    description: z.string().min(1),
  }),
};

export const listIssuesSchema = {
  query: paginationQuerySchema.extend({
    issueType: z
      .enum([
        "DAMAGED_ITEM",
        "MISSING_ITEM",
        "LATE_DELIVERY",
        "WRONG_ADDRESS",
        "PACKAGE_NOT_RECEIVED",
        "OTHER",
      ])
      .optional(),
    trackingNumber: z.string().min(3).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
};
