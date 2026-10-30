import type { DeliveryArea, StoreConfig } from "@agri/shared";
import type { Metadata } from "next";
import DeliveryAreasEditor from "@/components/admin/DeliveryAreasEditor";
import StoreConfigForm from "@/components/admin/StoreConfigForm";
import { serverGet } from "@/lib/api/server";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Store settings" };

export default async function StoreSettingsPage() {
  // Read fresh (not the cached shop copy), so the admin always edits the current values.
  const [config, areas] = await Promise.all([
    serverGet<StoreConfig>("/admin/store/config"),
    serverGet<DeliveryArea[]>("/admin/store/delivery-areas"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t.admin.nav.settings}</h1>
      <StoreConfigForm config={config} />
      <DeliveryAreasEditor areas={areas} />
    </div>
  );
}
