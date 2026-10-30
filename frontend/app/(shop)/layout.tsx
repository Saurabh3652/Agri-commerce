import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { getNavigation, getSiteSettings } from "@/lib/api/content.client";

/** The customer-facing shop: header and footer come from the CMS. */
export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const [settings, headerMenu, footerMenu] = await Promise.all([
    getSiteSettings(),
    getNavigation("header"),
    getNavigation("footer"),
  ]);

  return (
    <>
      <Navbar settings={settings} menu={headerMenu} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} menu={footerMenu} />
    </>
  );
}
