import Link from "next/link";
import type { ReactNode } from "react";

type Props = { href: string; className?: string; children: ReactNode };

export default function CmsLink({ href, className, children }: Props) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className={className}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {children}
    </a>
  );
}
