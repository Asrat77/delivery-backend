import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { toPagination } from "../../utils/pagination";

export async function createPricingRule(input: any) {
  if (input.type === "FIXED" && !input.fixedPrice) throw new ApiError(422, "fixedPrice is required for FIXED");
  if (input.type === "PER_KG" && !input.pricePerKg) throw new ApiError(422, "pricePerKg is required for PER_KG");

  return prisma.pricingRule.create({ data: input });
}

export async function listPricingRules(query: { page: number; limit: number; isActive?: boolean }) {
  const { skip, take, page, limit } = toPagination(query);
  const where: any = {};
  if (query.isActive !== undefined) where.isActive = query.isActive;
  const [items, total] = await Promise.all([
    prisma.pricingRule.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.pricingRule.count({ where }),
  ]);
  return { items, page, limit, total };
}

export async function getPricingRule(id: string) {
  const rule = await prisma.pricingRule.findUnique({ where: { id } });
  if (!rule) throw new ApiError(404, "Pricing rule not found");
  return rule;
}

export async function updatePricingRule(id: string, data: any) {
  return prisma.pricingRule.update({ where: { id }, data });
}

export async function updatePricingRuleStatus(id: string, isActive: boolean) {
  return prisma.pricingRule.update({ where: { id }, data: { isActive } });
}

export async function deletePricingRule(id: string) {
  await prisma.pricingRule.delete({ where: { id } });
}

