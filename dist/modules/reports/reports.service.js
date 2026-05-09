"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summary = summary;
exports.shipmentsByStatus = shipmentsByStatus;
exports.payments = payments;
exports.cod = cod;
exports.driverPerformance = driverPerformance;
const prisma_1 = require("../../config/prisma");
async function summary() {
    const [totalShipments, createdShipments, inTransitShipments, outForDeliveryShipments, deliveredShipments, cancelledShipments, paidAgg, pendingAgg, codCollectedAgg, codPendingAgg,] = await Promise.all([
        prisma_1.prisma.shipment.count(),
        prisma_1.prisma.shipment.count({ where: { status: "CREATED" } }),
        prisma_1.prisma.shipment.count({ where: { status: "IN_TRANSIT" } }),
        prisma_1.prisma.shipment.count({ where: { status: "OUT_FOR_DELIVERY" } }),
        prisma_1.prisma.shipment.count({ where: { status: "DELIVERED" } }),
        prisma_1.prisma.shipment.count({ where: { status: "CANCELLED" } }),
        prisma_1.prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
        prisma_1.prisma.payment.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
        prisma_1.prisma.codTransaction.aggregate({ where: { collected: true }, _sum: { amount: true } }),
        prisma_1.prisma.codTransaction.aggregate({ where: { collected: false }, _sum: { amount: true } }),
    ]);
    return {
        totalShipments,
        createdShipments,
        inTransitShipments,
        outForDeliveryShipments,
        deliveredShipments,
        cancelledShipments,
        totalRevenuePaid: paidAgg._sum.amount ?? 0,
        pendingPaymentAmount: pendingAgg._sum.amount ?? 0,
        codCollectedAmount: codCollectedAgg._sum.amount ?? 0,
        codPendingAmount: codPendingAgg._sum.amount ?? 0,
    };
}
async function shipmentsByStatus() {
    const grouped = await prisma_1.prisma.shipment.groupBy({ by: ["status"], _count: { _all: true } });
    return grouped.map((g) => ({ status: g.status, count: g._count._all }));
}
async function payments() {
    const grouped = await prisma_1.prisma.payment.groupBy({ by: ["status", "method"], _count: { _all: true }, _sum: { amount: true } });
    return grouped.map((g) => ({ status: g.status, method: g.method, count: g._count._all, amount: g._sum.amount ?? 0 }));
}
async function cod() {
    const grouped = await prisma_1.prisma.codTransaction.groupBy({ by: ["collected"], _count: { _all: true }, _sum: { amount: true } });
    return grouped.map((g) => ({ collected: g.collected, count: g._count._all, amount: g._sum.amount ?? 0 }));
}
async function driverPerformance() {
    const drivers = await prisma_1.prisma.driver.findMany({
        include: { user: { select: { name: true } }, assignedShipments: { select: { status: true } } },
    });
    return drivers.map((d) => {
        const assigned = d.assignedShipments.length;
        const delivered = d.assignedShipments.filter((s) => s.status === "DELIVERED").length;
        return { driverId: d.id, driverName: d.user.name, assignedShipments: assigned, deliveredShipments: delivered };
    });
}
