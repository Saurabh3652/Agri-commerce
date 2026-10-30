/** Money is always an integer number of paise (₹1 = 100 paise). Never use floats for money. */
export type Paise = number;

/** Dates travel over the API as ISO-8601 strings. */
export type ISODateString = string;

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ApiSuccess<T> = { success: true; data: T };

export type ApiError = {
  success: false;
  error: {
    code: string; // e.g. "NOT_FOUND", "VALIDATION_ERROR"
    message: string;
    details?: unknown;
  };
};

/** Every API response has this envelope. */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
