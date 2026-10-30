import type { RichTextSection as RichTextSectionData } from "@agri/shared";

/** Plain text from the CMS, used for help and policy pages. */
export default function RichTextSection({ data }: { data: RichTextSectionData["data"] }) {
  return (
    <section className="mx-auto max-w-3xl px-4">
      <h1 className="text-3xl font-bold text-balance">{data.title}</h1>
      <div className="mt-4 flex flex-col gap-4 text-lg leading-relaxed">
        {data.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
