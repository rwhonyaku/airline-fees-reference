"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackAnalyticsEvent, type AnalyticsParameters } from "@/lib/client-analytics";

export function TrackedLink({
  href,
  eventName,
  eventParameters,
  className,
  children,
  external = false,
}: {
  href: string;
  eventName: string;
  eventParameters: AnalyticsParameters;
  className?: string;
  children: ReactNode;
  external?: boolean;
}) {
  const onClick = () => trackAnalyticsEvent(eventName, eventParameters);

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return <Link href={href} className={className} onClick={onClick}>{children}</Link>;
}
