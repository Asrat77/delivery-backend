"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPricingRule = createPricingRule;
exports.listPricingRules = listPricingRules;
exports.getPricingRule = getPricingRule;
exports.updatePricingRule = updatePricingRule;
exports.updatePricingRuleStatus = updatePricingRuleStatus;
exports.deletePricingRule = deletePricingRule;
const prisma_1 = require("../../config/prisma");
const ApiError_1 = require("../../utils/ApiError");
const pagination_1 = require("../../utils/pagination");
async function createPricingRule(input) {
    if (input.type === "FIXED" && !input.fixedPrice)
        throw new ApiError_1.ApiError(422, "fixedPrice is required for FIXED");
    if (input.type === "PER_KG" && !input.pricePerKg)
        throw new ApiError_1.ApiError(422, "pricePerKg is required for PER_KG");
    return prisma_1.prisma.pricingRule.create({ data: input });
}
async function listPricingRules(query) {
    const { skip, take, page, limit } = (0, pagination_1.toPagination)(query);
    const where = {};
    if (query.isActive !== undefined)
        where.isActive = query.isActive;
    const [items, total] = await Promise.all([
        prisma_1.prisma.pricingRule.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
        prisma_1.prisma.pricingRule.count({ where }),
    ]);
    return { items, page, limit, total };
}
async function getPricingRule(id) {
    const rule = await prisma_1.prisma.pricingRule.findUnique({ where: { id } });
    if (!rule)
        throw new ApiError_1.ApiError(404, "Pricing rule not found");
    return rule;
}
async function updatePricingRule(id, data) {
    return prisma_1.prisma.pricingRule.update({ where: { id }, data });
}
async function updatePricingRuleStatus(id, isActive) {
    return prisma_1.prisma.pricingRule.update({ where: { id }, data: { isActive } });
}
async function deletePricingRule(id) {
    await prisma_1.prisma.pricingRule.delete({ where: { id } });
}
