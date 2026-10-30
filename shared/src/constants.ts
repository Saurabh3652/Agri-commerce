// Values used by both the backend (Mongoose enums, validation) and the frontend.

export const SUPPORTED_LOCALES = ["en", "gu"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/**
 * A single role decides both pricing and access.
 * CUSTOMER and RETAILER can be created by signing up; ADMIN is only created by the seed script.
 */
export const ROLES = ["CUSTOMER", "RETAILER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

/** Roles a person is allowed to pick when registering. ADMIN is deliberately excluded. */
export const SIGNUP_ROLES = ["CUSTOMER", "RETAILER"] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

export const ORDER_STATUSES = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The order state machine: which status each status may move to. The API enforces this. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

/** A customer may cancel their own order only before it is packed. */
export const CUSTOMER_CANCELLABLE_STATUSES: readonly OrderStatus[] = ["PLACED", "CONFIRMED"];

/** Add "RAZORPAY" here when online payment is integrated. */
export const PAYMENT_METHODS = ["COD"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["PENDING", "PAID", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 5 * 60; // code is valid for 5 minutes
export const OTP_MAX_ATTEMPTS = 5; // wrong guesses before the code is burned
export const OTP_RESEND_COOLDOWN_SECONDS = 30; // UI countdown before "resend" is offered

export const PRODUCT_SORTS = ["newest", "price_asc", "price_desc", "name"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

/** Menus that the CMS can define. Add a key here to create a new menu. */
export const NAVIGATION_KEYS = ["header", "footer"] as const;
export type NavigationKey = (typeof NAVIGATION_KEYS)[number];

/** Icons the CMS may reference by name. The frontend maps each name to an icon component. */
export const ICON_NAMES = [
  "badge-check",
  "truck",
  "wallet",
  "phone",
  "message-circle",
  "leaf",
  "sprout",
  "shield-check",
  "droplets",
  "wrench",
] as const;
export type IconName = (typeof ICON_NAMES)[number];
