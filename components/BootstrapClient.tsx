"use client";

import { useEffect } from "react";

export default function BootstrapClient() {
  useEffect(() => {
    // Dynamic import to prevent SSR errors
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return null;
}
