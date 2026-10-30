import type { Metadata, Viewport } from "next";
import { Noto_Sans } from "next/font/google";
import { getSiteSettings } from "@/lib/api/content.client";
import { getStoreConfig } from "@/lib/api/store.client";
import { CartProvider } from "@/lib/cart/CartContext";
import { themeToCssVars } from "@/lib/theme";
import "./globals.css";

// Noto Sans has a matching Noto Sans Gujarati, so the look stays consistent once Gujarati is added.
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { seo, siteName } = await getSiteSettings();
  return {
    title: { default: seo.title, template: `%s | ${siteName}` },
    description: seo.description,
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { theme } = await getSiteSettings();
  return { themeColor: theme.primaryDarkColor };
}

/** Shared by the shop and the admin panel: theme colours and the cart. Each area adds its own chrome. */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [settings, store] = await Promise.all([getSiteSettings(), getStoreConfig()]);

  return (
    <html
      lang={settings.locale}
      className={`${notoSans.variable} h-full antialiased`}
      style={themeToCssVars(settings.theme)}
    >
      <body className="flex min-h-full flex-col font-sans">
        <CartProvider maxPerItem={store.maxQuantityPerItem}>{children}</CartProvider>
      </body>
    </html>
  );
}
