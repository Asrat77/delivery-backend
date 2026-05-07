export function successResponse<T>(message: string, data: T) {
  return { success: true as const, message, data };
}

export function errorResponse(message: string, statusCode: number, details: unknown = null) {
  return { success: false as const, message, statusCode, details };
}

