import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const incomingCookie = req.headers.get("cookie");

    const backendRes = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_API_URL}/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: incomingCookie ?? "",
        },
        credentials: "include",
      }
    );


    const setCookie = backendRes.headers.get("set-cookie");


    const data = await backendRes.json();

    const response = NextResponse.json(data, {
      status: backendRes.status,
    });

    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch (err) {
    console.error("❌ Refresh Error:", err);

    return NextResponse.json(
      { success: false, message: "Auth refresh failed" },
      { status: 500 }
    );
  }
}