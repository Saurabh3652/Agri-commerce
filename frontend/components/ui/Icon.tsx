import type { IconName } from "@agri/shared";
import {
  BadgeCheck,
  Droplets,
  Leaf,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sprout,
  Truck,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

// The CMS stores icons by name; this maps each allowed name to an icon component.
// To allow a new icon: add its name to ICON_NAMES in @agri/shared and map it here.
const ICONS: Record<IconName, LucideIcon> = {
  "badge-check": BadgeCheck,
  truck: Truck,
  wallet: Wallet,
  phone: Phone,
  "message-circle": MessageCircle,
  leaf: Leaf,
  sprout: Sprout,
  "shield-check": ShieldCheck,
  droplets: Droplets,
  wrench: Wrench,
};

export default function Icon({ name, className }: { name: IconName; className?: string }) {
  const Component = ICONS[name];
  return <Component className={className} aria-hidden />;
}
