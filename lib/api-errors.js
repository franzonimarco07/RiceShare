export class ApiError extends Error {
  constructor(code, message, statusCode = 500, details) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

export function errorResponse(error) {
  if (error instanceof ApiError) {
    return new Response(
      JSON.stringify({
        error: error.code,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { details: error.details }),
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  console.error('[API Error]', error);
  return new Response(
    JSON.stringify({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}