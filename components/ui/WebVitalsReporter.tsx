"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric.rating);
    } else {
      fetch("/api/v1/metrics", {
        method: "POST",
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          id: metric.id,
          rating: metric.rating,
        }),
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    }
  });
  return null;
}
