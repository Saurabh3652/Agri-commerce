import type { PageSection } from "@agri/shared";
import CategoryGridSection from "./CategoryGridSection";
import HeroSection from "./HeroSection";
import ProductGridSection from "./ProductGridSection";
import RichTextSection from "./RichTextSection";

/**
 * Renders the sections a CMS page lists, in order. The page layout is decided by data in
 * MongoDB: reorder, hide or add sections there and the page changes without a deploy.
 * To support a new section type, add its schema in @agri/shared and a case here.
 */
function renderSection(section: PageSection) {
  switch (section.type) {
    case "hero":
      return <HeroSection data={section.data} />;
    case "categoryGrid":
      return <CategoryGridSection data={section.data} />;
    case "productGrid":
      return <ProductGridSection data={section.data} />;
    case "richText":
      return <RichTextSection data={section.data} />;
  }
}

export default function SectionRenderer({ sections }: { sections: PageSection[] }) {
  // A hero runs edge to edge under the header; any other first section needs breathing room.
  const startsWithHero = sections[0]?.type === "hero";
  return (
    <div className={`flex flex-col gap-10 pb-4 ${startsWithHero ? "" : "pt-8"}`}>
      {sections.map((section) => (
        <div key={section.id} data-section={section.type}>
          {renderSection(section)}
        </div>
      ))}
    </div>
  );
}
