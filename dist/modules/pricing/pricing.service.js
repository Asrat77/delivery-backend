"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPricingRule = createPricingRule;
exports.listPricingRules = listPricingRules;
exports.getPricingRule = getPricingRule;
exports.updatePricingRule = updatePricingRule;
exports.updatePricingRuleStatus = updatePricingRuleStatus;
exports.deletePricingRule = deletePricingRule;
exports.calculatePrice = calculatePrice;
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
async function calculatePrice(input) {
    const rules = await prisma_1.prisma.pricingRule.findMany({ where: { isActive: true } });
    const matching = rules.filter((r) => {
        if (!r.packageType || r.packageType === input.packageType)
            return true;
        if (!r.deliveryType || r.deliveryType === input.deliveryType)
            return true;
        return false;
    });
    let basePrice = 0;
    for (const rule of matching) {
        const minOk = rule.minWeight === null || input.weight >= Number(rule.minWeight);
        const maxOk = rule.maxWeight === null || input.weight <= Number(rule.maxWeight);
        if (!minOk || !maxOk)
            continue;
        if (rule.type === "FIXED" && rule.fixedPrice !== null) {
            basePrice = Number(rule.fixedPrice);
            break;
        }
        if (rule.type === "PER_KG" && rule.pricePerKg !== null) {
            basePrice = Number(rule.pricePerKg) * input.weight;
        }
    }
    if (basePrice === 0) {
        throw new ApiError_1.ApiError(422, "No active pricing rule matched and no explicit price provided");
    }
    if (input.serviceType === "INTERNATIONAL") {
        return Math.round(basePrice * 1.5 * 100) / 100;
    }
    return basePrice;
}
