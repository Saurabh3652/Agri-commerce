import { notFound, unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import SectionRenderer from "@/components/sections/SectionRenderer";
import { getPage } from "@/lib/api/content.client";
import { ApiRequestError } from "@/lib/api/http";

/**
 * /help          -> CMS page "help"
 * /help/delivery -> CMS page "help-delivery"
 * Adding a help page means adding a document in MongoDB; no code change.
 */
async function loadHelpPage(topic: string[] | undefined) {
  const slug = topic?.length ? `help-${topic.join("-")}` : "help";
  try {
    return await getPage(slug);
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof ApiRequestError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
}

async function HelpPage({ params }: { params: PageProps<"/help/[[...topic]]">["params"] }) {
  const page = await loadHelpPage((await params).topic);
  return <SectionRenderer sections={page.sections} />;
}

export default function Help({ params }: PageProps<"/help/[[...topic]]">) {
  return (
    <div className="py-8">
      <Suspense fallback={<div className="mx-auto h-64 max-w-3xl animate-pulse rounded-2xl bg-white" aria-busy="true" />}>
        <HelpPage params={params} />
      </Suspense>
    </div>
  );
}
