import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { toPagination } from "../../utils/pagination";

function safeIssueSelect() {
  return {
    id: true,
    trackingNumber: true,
    issueType: true,
    email: true,
    phone: true,
    description: true,
    userId: true,
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    },
    createdAt: true,
    updatedAt: true,
  } as const;
}

export async function createIssue(input: {
  trackingNumber: string;
  issueType: "DAMAGED_ITEM" | "MISSING_ITEM" | "LATE_DELIVERY" | "WRONG_ADDRESS" | "PACKAGE_NOT_RECEIVED" | "OTHER";
  email: string;
  phone: string;
  description: string;
  userId?: string;
}) {
  const issue = await prisma.issue.create({
    data: {
      trackingNumber: input.trackingNumber,
      issueType: input.issueType,
      email: input.email,
      phone: input.phone,
      description: input.description,
      userId: input.userId ?? null,
    },
    select: safeIssueSelect(),
  });

  return issue;
}

export async function listIssues(query: {
  page: number;
  limit: number;
  issueType?: string;
  trackingNumber?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const { skip, take, page, limit } = toPagination(query);

  const where: Prisma.IssueWhereInput = {};

  if (query.issueType) {
    where.issueType = query.issueType as any;
  }

  if (query.trackingNumber) {
    where.trackingNumber = { contains: query.trackingNumber, mode: "insensitive" };
  }

  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) {
      (where.createdAt as any).gte = new Date(query.dateFrom);
    }
    if (query.dateTo) {
      (where.createdAt as any).lte = new Date(query.dateTo);
    }
  }

  const [items, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      select: safeIssueSelect(),
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.issue.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getIssueById(id: string) {
  const issue = await prisma.issue.findUnique({
    where: { id },
    select: safeIssueSelect(),
  });

  if (!issue) {
    throw new ApiError(404, "Issue not found");
  }

  return issue;
}
