import type { Metadata } from "next";
import SectionRenderer from "@/components/sections/SectionRenderer";
import { getPage } from "@/lib/api/content.client";

// The homepage has no fixed layout: it renders whatever sections the CMS "home" page lists.

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getPage("home");
  return {
    ...(seo.title && { title: { absolute: seo.title } }),
    ...(seo.description && { description: seo.description }),
  };
}

export default async function HomePage() {
  const page = await getPage("home");
  return <SectionRenderer sections={page.sections} />;
}
