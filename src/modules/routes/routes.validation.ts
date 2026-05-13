import { z } from "zod";

export const routeIdParamsSchema = {
  params: z.object({
    id: z.string().min(1),
  }),
};

export const createRouteSchema = {
  body: z.object({
    id: z.string().min(1),
    origin: z.string().min(1),
    destination: z.string().min(1),
    transitTime: z.string().min(1),
    pricing: z.object({
      economy: z.number().positive(),
      standard: z.number().positive(),
      premium: z.number().positive(),
    }),
  }),
};
