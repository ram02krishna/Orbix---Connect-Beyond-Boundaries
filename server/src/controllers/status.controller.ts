import type { Request, Response } from "express";
import * as statusService from "../services/status.service.js";
import { sendSuccess } from "../utils/ApiResponse.js";

export async function createStatus(req: Request, res: Response) {
  const status = await statusService.createStatus(req.user!.id, req.body);
  sendSuccess(res, "Status created", { status }, 201);
}

export async function getStatuses(req: Request, res: Response) {
  const feed = await statusService.getStatuses(req.user!.id);
  sendSuccess(res, "Statuses fetched", feed);
}

export async function viewStatus(req: Request, res: Response) {
  const result = await statusService.viewStatus(req.user!.id, req.params.id as string);
  sendSuccess(res, "Status viewed", result);
}

export async function getStatusViewers(req: Request, res: Response) {
  const viewers = await statusService.getStatusViewers(req.user!.id, req.params.id as string);
  sendSuccess(res, "Status viewers fetched", { viewers });
}
