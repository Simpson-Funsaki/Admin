export async function GET(req, { params }) {
  return handler(req, params, "GET");
}

export async function POST(req, { params }) {
  return handler(req, params, "POST");
}

export async function PATCH(req, { params }) {
  return handler(req, params, "PATCH");
}

export async function DELETE(req, { params }) {
  return handler(req, params, "DELETE");
}

async function handler(req, params, method) {
  const base = process.env.NEXT_PUBLIC_SERVER_API_URL;
  const path = params.path.join("/");
  const query = req.nextUrl.search;

  const url = `${base}/${path}${query}`;

  const body =
    method !== "GET" && method !== "HEAD"
      ? await req.text()
      : undefined;

  const res = await fetch(url, {
    method,
    headers: {
      cookie: req.headers.get("cookie") || "",
      "content-type": req.headers.get("content-type") || "application/json",
    },
    body,
  });

  const data = await res.text();

  const headers = new Headers(res.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");

  return new Response(data, {
    status: res.status,
    headers,
  });
}