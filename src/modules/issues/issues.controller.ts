import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import * as issuesService from "./issues.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await issuesService.createIssue({
    trackingNumber: req.body.trackingNumber,
    issueType: req.body.issueType,
    email: req.body.email,
    phone: req.body.phone,
    description: req.body.description,
    userId: req.user?.id,
  });
  return res.status(201).json(successResponse("Issue created", data));
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await issuesService.listIssues(req.query as any);
  return res.status(200).json(successResponse("Issues", data));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const issue = await issuesService.getIssueById(String(req.params.id));
  return res.status(200).json(successResponse("Issue", issue));
});
