"use client";

import { useEffect } from "react";
import { setOrgFormatting } from "@/lib/formatting";

export function FormattingInitializer() {
  useEffect(() => {
    fetch("/api/org/current", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.numberFormat || data?.dateFormat) {
          setOrgFormatting(
            data.numberFormat ?? "1,234.56",
            data.dateFormat ?? "DD/MM/YYYY"
          );
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
