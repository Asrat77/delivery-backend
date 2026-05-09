"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.listUsers = listUsers;
exports.getUser = getUser;
exports.updateUserStatus = updateUserStatus;
exports.updateUserRole = updateUserRole;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../../config/prisma");
const env_1 = require("../../config/env");
const ApiError_1 = require("../../utils/ApiError");
const pagination_1 = require("../../utils/pagination");
const safeUserSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
};
async function createUser(input) {
    const env = (0, env_1.getEnv)();
    const passwordHash = await bcrypt_1.default.hash(input.password, env.BCRYPT_SALT_ROUNDS);
    try {
        const user = await prisma_1.prisma.user.create({
            data: {
                name: input.name,
                email: input.email,
                phone: input.phone,
                passwordHash,
                role: input.role,
                status: input.status ?? "ACTIVE",
                driverProfile: input.role === "DRIVER"
                    ? {
                        create: {},
                    }
                    : undefined,
            },
            select: safeUserSelect,
        });
        return user;
    }
    catch (e) {
        if (e?.code === "P2002")
            throw new ApiError_1.ApiError(409, "User already exists", e?.meta ?? null);
        throw e;
    }
}
async function listUsers(query) {
    const { skip, take, page, limit } = (0, pagination_1.toPagination)(query);
    const where = {
        deletedAt: null,
        ...(query.role ? { role: query.role } : {}),
        ...(query.status ? { status: query.status } : {}),
    };
    const [items, total] = await Promise.all([
        prisma_1.prisma.user.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, select: safeUserSelect }),
        prisma_1.prisma.user.count({ where }),
    ]);
    return { items, page, limit, total };
}
async function getUser(id) {
    const user = await prisma_1.prisma.user.findFirst({ where: { id, deletedAt: null }, select: safeUserSelect });
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    return user;
}
async function updateUserStatus(id, status) {
    const user = await prisma_1.prisma.user.update({ where: { id }, data: { status }, select: safeUserSelect });
    return user;
}
async function updateUserRole(id, role) {
    const user = await prisma_1.prisma.user.update({
        where: { id },
        data: {
            role,
            driverProfile: role === "DRIVER"
                ? {
                    upsert: { create: {}, update: {} },
                }
                : undefined,
        },
        select: safeUserSelect,
    });
    if (role !== "DRIVER") {
        await prisma_1.prisma.driver.deleteMany({ where: { userId: id } });
    }
    return user;
}
