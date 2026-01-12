import { Errors, createClient } from "@farcaster/quick-auth";
import { NextRequest, NextResponse } from "next/server";

const client = createClient();

// Helper function to determine the correct domain for JWT verification
function getUrlHost(request: NextRequest): string {
  // First try to get the origin from the Origin header (most reliable for CORS requests)
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const url = new URL(origin);
      return url.host;
    } catch (error) {
      console.warn("Invalid origin header:", origin, error);
    }
  }

  // Fallback to Host header
  const host = request.headers.get("host");
  if (host) {
    return host;
  }

  // Final fallback to environment variables (your original logic)
  let urlValue: string;
  if (process.env.VERCEL_ENV === "production") {
    urlValue = process.env.NEXT_PUBLIC_URL!;
  } else if (process.env.VERCEL_URL) {
    urlValue = `https://${process.env.VERCEL_URL}`;
  } else {
    urlValue = "http://localhost:3000";
  }

  const url = new URL(urlValue);
  return url.host;
}

export async function GET(request: NextRequest) {
  // Because we're fetching this endpoint via `sdk.quickAuth.fetch`,
  // if we're in a mini app, the request will include the necessary `Authorization` header.
  const authorization = request.headers.get("Authorization");

  // Here we ensure that we have a valid token.
  // Return success: false instead of 401 to prevent page errors when not in Farcaster
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return NextResponse.json({ 
      success: false,
      message: "Not authenticated - please open this in Farcaster" 
    }, { status: 200 });
  }

  try {
    // Now we verify the token. `domain` must match the domain of the request.
    // In our case, we're using the `getUrlHost` function to get the domain of the request
    // based on the Vercel environment. This will vary depending on your hosting provider.
    const payload = await client.verifyJwt({
      token: authorization.split(" ")[1] as string,
      domain: getUrlHost(request),
    });

    console.log("payload", payload);

    // If the token was valid, `payload.sub` will be the user's Farcaster ID.
    const userFid = payload.sub;

    // Return user information for your waitlist application
    return NextResponse.json({
      success: true,
      user: {
        fid: userFid,
        issuedAt: payload.iat,
        expiresAt: payload.exp,
      },
    });

  } catch (e) {
    // Return success: false instead of throwing errors or returning 500
    if (e instanceof Errors.InvalidTokenError) {
      return NextResponse.json({ 
        success: false,
        message: "Invalid authentication token" 
      }, { status: 200 });
    }
    if (e instanceof Error) {
      console.error("Auth error:", e.message);
      return NextResponse.json({ 
        success: false,
        message: "Authentication failed" 
      }, { status: 200 });
    }
    return NextResponse.json({ 
      success: false,
      message: "Authentication failed" 
    }, { status: 200 });
  }
}