// Starter CMS content (English). Edit these documents in MongoDB to change the site
// without touching code. Gujarati = copy each document with locale: "gu" and translate.

export const siteSettings = {
  locale: "en",
  siteName: "AgroCommerce",
  tagline: "Genuine farm inputs, delivered to your village",
  logoUrl: null,
  theme: {
    primaryColor: "#1f7a3a",
    primaryDarkColor: "#17652f",
    accentColor: "#fbbf24",
  },
  contact: {
    phone: "+91 99999 99999",
    whatsapp: "919999999999",
    email: "support@agrocommerce.in",
    hours: "Mon–Sat, 9 AM – 7 PM",
  },
  header: {
    showSearch: true,
    searchPlaceholder: "Search seeds, fertilizer, tools…",
  },
  footer: {
    about:
      "AgroCommerce helps farmers and retailers buy genuine agricultural products at fair prices with doorstep delivery.",
    copyright: "© 2026 AgroCommerce. All rights reserved.",
  },
  seo: {
    title: "AgroCommerce – Genuine farm inputs, delivered",
    description: "Seeds, fertilizers, crop protection and tools from trusted brands, delivered across Gujarat.",
  },
};

export const navigations = [
  {
    key: "header",
    locale: "en",
    items: [
      { label: "Seeds", href: "/products?category=seeds", icon: "sprout" },
      { label: "Fertilizers", href: "/products?category=fertilizers", icon: "leaf" },
      { label: "Crop Protection", href: "/products?category=crop-protection", icon: "shield-check" },
      { label: "Irrigation", href: "/products?category=irrigation", icon: "droplets" },
      { label: "Tools", href: "/products?category=tools", icon: "wrench" },
      { label: "Offers", href: "/products?featured=true", icon: "badge-check" },
    ],
  },
  {
    key: "footer",
    locale: "en",
    // Each top-level item is a footer column; its children are the links in that column.
    items: [
      {
        label: "Shop",
        href: "/products",
        children: [
          { label: "Seeds", href: "/products?category=seeds" },
          { label: "Fertilizers", href: "/products?category=fertilizers" },
          { label: "Crop Protection", href: "/products?category=crop-protection" },
          { label: "Irrigation", href: "/products?category=irrigation" },
          { label: "Tools & Equipment", href: "/products?category=tools" },
        ],
      },
      {
        label: "Help & support",
        href: "/help",
        children: [
          { label: "My orders", href: "/orders" },
          { label: "Delivery information", href: "/help/delivery" },
          { label: "Returns & refunds", href: "/help/returns" },
          { label: "Payment options", href: "/help/payments" },
        ],
      },
    ],
  },
];

/** Help pages are plain CMS pages built from "richText" sections, served at /help/<topic>. */
const helpPage = (slug: string, title: string, paragraphs: string[]) => ({
  slug,
  locale: "en",
  title,
  isPublished: true,
  seo: { title, description: paragraphs[0] },
  sections: [{ type: "richText", isActive: true, data: { title, paragraphs } }],
});

const helpPages = [
  helpPage("help", "Help & support", [
    "We are here to help you get the right products for your farm, on time.",
    "Call or WhatsApp us using the numbers at the bottom of every page, Monday to Saturday, 9 AM to 7 PM.",
  ]),
  helpPage("help-delivery", "Delivery information", [
    "We deliver across Gujarat. Enter your pincode at checkout to see the delivery fee and how many days it will take.",
    "Orders above the free-delivery amount shown at checkout are delivered free.",
    "Our delivery partner will call you before arriving. Please keep your phone switched on.",
  ]),
  helpPage("help-returns", "Returns & refunds", [
    "If a product arrives damaged or is not what you ordered, tell us within 48 hours of delivery.",
    "Seeds, fertilizers and crop protection products cannot be returned once the pack is opened, for safety reasons.",
    "Approved refunds for cash-on-delivery orders are paid to your bank account or UPI within 7 working days.",
  ]),
  helpPage("help-payments", "Payment options", [
    "You can pay in cash when your order is delivered. Please keep the exact amount ready if possible.",
    "Online payment with UPI and cards is coming soon.",
  ]),
];

export const pages = [
  ...helpPages,
  {
    slug: "home",
    locale: "en",
    title: "Home",
    isPublished: true,
    seo: { title: null, description: null }, // falls back to site settings
    // Sections render top to bottom in this order. Set isActive: false to hide one.
    sections: [
      {
        type: "hero",
        isActive: true,
        data: {
          eyebrow: "Rabi sowing season is here",
          title: "Everything your farm needs, at fair prices",
          subtitle:
            "Seeds, fertilizers, crop protection and tools from trusted brands, delivered to your door.",
          primaryCta: { label: "Shop now", href: "#featured" },
          secondaryCta: { label: "Call to order", href: "tel:+919999999999" },
          backgroundImageUrl: null,
          highlights: [
            { icon: "badge-check", label: "100% genuine products" },
            { icon: "wallet", label: "Cash on delivery" },
            { icon: "truck", label: "Delivery across Gujarat" },
          ],
        },
      },
      {
        type: "categoryGrid",
        isActive: true,
        data: { title: "Shop by category", categorySlugs: [] },
      },
      {
        type: "productGrid",
        isActive: true,
        data: {
          title: "Best sellers this season",
          anchor: "featured",
          viewAllLink: { label: "View all offers", href: "/products?featured=true" },
          query: { featured: true, sort: "newest", limit: 8 },
        },
      },
      {
        type: "productGrid",
        isActive: true,
        data: {
          title: "All products",
          anchor: "products",
          viewAllLink: { label: "Browse all", href: "/products" },
          query: { sort: "name", limit: 12 },
        },
      },
    ],
  },
];
