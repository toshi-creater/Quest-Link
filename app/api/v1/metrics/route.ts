import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const metricSchema = z.object({
  name: z.string(),
  value: z.number(),
  id: z.string(),
  rating: z.enum(["good", "needs-improvement", "poor"]),
});

export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  const parsed = metricSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid metric payload" } },
      { status: 400 }
    );
  }
  console.log("[Metrics]", parsed.data);
  return NextResponse.json({ ok: true });
}
