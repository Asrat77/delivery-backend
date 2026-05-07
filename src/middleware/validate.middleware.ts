import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodTypeAny } from "zod";

type ValidationSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

function replaceObjectContents(target: unknown, value: unknown) {
  if (!target || typeof target !== "object") return;
  if (!value || typeof value !== "object") return;

  // Express 5 exposes some request properties via getters (read-only setters).
  // To avoid `TypeError: ... has only a getter`, mutate the existing object in-place.
  for (const key of Object.keys(target as any)) {
    delete (target as any)[key];
  }
  Object.assign(target as any, value as any);
}

function defineRequestProperty(req: Request, key: "query" | "params", value: any) {
  // Express 5 may expose req.query/req.params via getters only.
  // Defining an own property on the request instance safely shadows the getter.
  try {
    Object.defineProperty(req, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    return true;
  } catch {
    return false;
  }
}

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.body) {
      // req.body is writable in typical Express setups
      req.body = schemas.body.parse(req.body);
    }

    if (schemas.params) {
      const parsedParams = schemas.params.parse(req.params) as any;
      if (!defineRequestProperty(req, "params", parsedParams)) {
        replaceObjectContents(req.params, parsedParams);
      }
    }

    if (schemas.query) {
      const parsedQuery = schemas.query.parse(req.query) as any;
      if (!defineRequestProperty(req, "query", parsedQuery)) {
        replaceObjectContents(req.query, parsedQuery);
      }
    }
    next();
  };
}

