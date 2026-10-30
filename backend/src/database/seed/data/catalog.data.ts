// Starter catalogue. Prices are in rupees here for readability and converted to paise when seeded.

export const categories = [
  { slug: "seeds", name: "Seeds", icon: "🌾", sortOrder: 1 },
  { slug: "fertilizers", name: "Fertilizers", icon: "🌱", sortOrder: 2 },
  { slug: "crop-protection", name: "Crop Protection", icon: "🐛", sortOrder: 3 },
  { slug: "soil-care", name: "Soil Care", icon: "🪴", sortOrder: 4 },
  { slug: "irrigation", name: "Irrigation", icon: "💧", sortOrder: 5 },
  { slug: "tools", name: "Tools & Equipment", icon: "🧰", sortOrder: 6 },
];

type SeedVariant = { sku: string; label: string; unit: string; price: number; mrp: number; stock: number };

export type SeedProduct = {
  slug: string;
  name: string;
  category: string; // category slug
  brand: string;
  icon: string;
  description: string;
  crops: string[];
  isFeatured?: boolean;
  variants: SeedVariant[];
};

export const products: SeedProduct[] = [
  {
    slug: "npk-19-19-19-fertilizer",
    name: "NPK 19:19:19 Fertilizer",
    category: "fertilizers",
    brand: "AgriGrow",
    icon: "🌱",
    description: "Water-soluble balanced fertilizer for healthy vegetative growth.",
    crops: ["cotton", "groundnut", "wheat", "vegetables"],
    isFeatured: true,
    variants: [
      { sku: "NPK-1KG", label: "1 kg pack", unit: "kg", price: 180, mrp: 210, stock: 120 },
      { sku: "NPK-25KG", label: "25 kg bag", unit: "kg", price: 850, mrp: 950, stock: 25 },
    ],
  },
  {
    slug: "urea-46-n",
    name: "Urea (46% N)",
    category: "fertilizers",
    brand: "Kisan Gold",
    icon: "⚪",
    description: "Nitrogen fertilizer for leafy growth in cereals and cash crops.",
    crops: ["wheat", "cotton", "bajra"],
    variants: [{ sku: "UREA-45KG", label: "45 kg bag", unit: "kg", price: 267, mrp: 267, stock: 200 }],
  },
  {
    slug: "wheat-seeds-gw-496",
    name: "Wheat Seeds GW-496",
    category: "seeds",
    brand: "FarmSelect",
    icon: "🌾",
    description: "High-yield wheat variety suited to Gujarat's rabi season.",
    crops: ["wheat"],
    isFeatured: true,
    variants: [{ sku: "WHT-GW496-20KG", label: "20 kg bag", unit: "kg", price: 1200, mrp: 1350, stock: 18 }],
  },
  {
    slug: "bt-cotton-seeds",
    name: "BT Cotton Seeds",
    category: "seeds",
    brand: "Rasi",
    icon: "☁️",
    description: "Bollworm-resistant hybrid cotton seeds with strong yield.",
    crops: ["cotton"],
    isFeatured: true,
    variants: [{ sku: "COT-BT-450G", label: "450 g packet", unit: "g", price: 864, mrp: 864, stock: 60 }],
  },
  {
    slug: "groundnut-seeds-gg-20",
    name: "Groundnut Seeds GG-20",
    category: "seeds",
    brand: "Gujarat Agro",
    icon: "🥜",
    description: "Bold-seeded groundnut variety for kharif sowing.",
    crops: ["groundnut"],
    variants: [{ sku: "GNUT-GG20-30KG", label: "30 kg bag", unit: "kg", price: 3600, mrp: 3900, stock: 0 }],
  },
  {
    slug: "drip-irrigation-kit",
    name: "Drip Irrigation Kit",
    category: "irrigation",
    brand: "AquaFarm",
    icon: "💧",
    description: "Water-saving drip kit for up to 0.25 acre, easy to install.",
    crops: ["vegetables", "fruits"],
    isFeatured: true,
    variants: [{ sku: "DRIP-KIT-025", label: "1 kit (0.25 acre)", unit: "kit", price: 650, mrp: 799, stock: 12 }],
  },
  {
    slug: "battery-sprayer-16l",
    name: "Battery Sprayer 16 L",
    category: "tools",
    brand: "FieldPro",
    icon: "🚿",
    description: "Rechargeable knapsack sprayer that runs up to 6 hours on a full charge.",
    crops: [],
    variants: [
      { sku: "SPRAY-HAND-1L", label: "Hand sprayer 1 L", unit: "piece", price: 450, mrp: 520, stock: 30 },
      { sku: "SPRAY-BAT-16L", label: "Battery 16 L", unit: "piece", price: 2499, mrp: 3200, stock: 8 },
    ],
  },
  {
    slug: "organic-compost",
    name: "Organic Compost",
    category: "soil-care",
    brand: "GreenEarth",
    icon: "🌿",
    description: "Well-decomposed organic manure that improves soil structure and moisture.",
    crops: ["vegetables", "fruits", "cotton"],
    variants: [{ sku: "COMP-25KG", label: "25 kg bag", unit: "kg", price: 300, mrp: 350, stock: 40 }],
  },
  {
    slug: "neem-oil-1500-ppm",
    name: "Neem Oil 1500 PPM",
    category: "crop-protection",
    brand: "BioShield",
    icon: "🍃",
    description: "Organic neem-based repellent for sucking pests and caterpillars.",
    crops: ["cotton", "vegetables"],
    isFeatured: true,
    variants: [
      { sku: "NEEM-500ML", label: "500 ml bottle", unit: "ml", price: 320, mrp: 380, stock: 6 },
      { sku: "NEEM-1L", label: "1 L bottle", unit: "L", price: 590, mrp: 700, stock: 5 },
    ],
  },
  {
    slug: "pruning-shears",
    name: "Pruning Shears",
    category: "tools",
    brand: "FarmTools",
    icon: "✂️",
    description: "Sharp, rust-resistant hand tool for trimming plants and branches.",
    crops: [],
    variants: [{ sku: "PRUNE-STD", label: "1 piece", unit: "piece", price: 250, mrp: 299, stock: 15 }],
  },
];
