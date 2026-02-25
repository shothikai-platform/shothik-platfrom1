import { NextRequest, NextResponse } from "next/server";
import { getBuild } from "@/lib/writing-studio/buildStore";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  const { buildId } = await params;
  const build = getBuild(buildId);

  if (!build) {
    return NextResponse.json({ error: "Build not found" }, { status: 404 });
  }

  return NextResponse.json(build);
}
