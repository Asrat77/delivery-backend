import { prisma } from "../../config/prisma";

export async function summary() {
  const [
    totalShipments,
    createdShipments,
    inTransitShipments,
    outForDeliveryShipments,
    deliveredShipments,
    cancelledShipments,
    paidAgg,
    pendingAgg,
    codCollectedAgg,
    codPendingAgg,
  ] = await Promise.all([
    prisma.shipment.count(),
    prisma.shipment.count({ where: { status: "CREATED" } }),
    prisma.shipment.count({ where: { status: "IN_TRANSIT" } }),
    prisma.shipment.count({ where: { status: "OUT_FOR_DELIVERY" } }),
    prisma.shipment.count({ where: { status: "DELIVERED" } }),
    prisma.shipment.count({ where: { status: "CANCELLED" } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
    prisma.codTransaction.aggregate({ where: { collected: true }, _sum: { amount: true } }),
    prisma.codTransaction.aggregate({ where: { collected: false }, _sum: { amount: true } }),
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

export async function shipmentsByStatus() {
  const grouped = await prisma.shipment.groupBy({ by: ["status"], _count: { _all: true } });
  return grouped.map((g) => ({ status: g.status, count: g._count._all }));
}

export async function payments() {
  const grouped = await prisma.payment.groupBy({ by: ["status", "method"], _count: { _all: true }, _sum: { amount: true } });
  return grouped.map((g) => ({ status: g.status, method: g.method, count: g._count._all, amount: g._sum.amount ?? 0 }));
}

export async function cod() {
  const grouped = await prisma.codTransaction.groupBy({ by: ["collected"], _count: { _all: true }, _sum: { amount: true } });
  return grouped.map((g) => ({ collected: g.collected, count: g._count._all, amount: g._sum.amount ?? 0 }));
}

export async function driverPerformance() {
  const drivers = await prisma.driver.findMany({
    include: { user: { select: { name: true } }, assignedShipments: { select: { status: true } } },
  });
  return drivers.map((d) => {
    const assigned = d.assignedShipments.length;
    const delivered = d.assignedShipments.filter((s) => s.status === "DELIVERED").length;
    return { driverId: d.id, driverName: d.user.name, assignedShipments: assigned, deliveredShipments: delivered };
  });
}

