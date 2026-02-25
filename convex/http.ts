import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// JWKS should be loaded from environment variable
// Set JWKS in Convex dashboard: convex dashboard -> Settings -> Environment Variables
// Format: {"keys":[{"kty":"RSA","n":"...","e":"AQAB","kid":"...","use":"sig","alg":"RS256"}]}
const getJWKS = () => {
  const jwks = process.env.JWKS;
  if (!jwks) {
    throw new Error("JWKS environment variable is required");
  }
  return jwks;
};

http.route({
  path: "/.well-known/jwks.json",
  method: "GET",
  handler: httpAction(async () => {
    try {
      const jwks = getJWKS();
      return new Response(jwks, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "JWKS not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

http.route({
  path: "/.well-known/openid-configuration",
  method: "GET",
  handler: httpAction(async () => {
    const siteUrl = process.env.CONVEX_SITE_URL;
    if (!siteUrl) {
      return new Response(
        JSON.stringify({ error: "CONVEX_SITE_URL not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        issuer: siteUrl,
        jwks_uri: `${siteUrl}/.well-known/jwks.json`,
        id_token_signing_alg_values_supported: ["RS256"],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }),
});

export default http;
