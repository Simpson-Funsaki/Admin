import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const backendRes = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_API_URL}/auth/me`,
      {
        method: "GET",
        headers: {
          cookie: req.headers.get("cookie") ?? "",
        },
      },
    );

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
