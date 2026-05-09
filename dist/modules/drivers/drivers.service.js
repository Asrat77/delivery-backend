"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDrivers = listDrivers;
exports.getDriver = getDriver;
const prisma_1 = require("../../config/prisma");
const ApiError_1 = require("../../utils/ApiError");
const pagination_1 = require("../../utils/pagination");
const driverSelect = {
    id: true,
    isAvailable: true,
    currentLat: true,
    currentLng: true,
    createdAt: true,
    updatedAt: true,
    user: {
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
        },
    },
};
async function listDrivers(query) {
    const { skip, take, page, limit } = (0, pagination_1.toPagination)(query);
    const where = {};
    if (query.isAvailable !== undefined)
        where.isAvailable = query.isAvailable;
    const [items, total] = await Promise.all([
        prisma_1.prisma.driver.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, select: driverSelect }),
        prisma_1.prisma.driver.count({ where }),
    ]);
    return { items, page, limit, total };
}
async function getDriver(id) {
    const driver = await prisma_1.prisma.driver.findUnique({ where: { id }, select: driverSelect });
    if (!driver)
        throw new ApiError_1.ApiError(404, "Driver not found");
    return driver;
}
