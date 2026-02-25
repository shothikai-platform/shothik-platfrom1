import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
const http = httpRouter();
const JWKS_DATA = JSON.stringify({
    keys: [
        {
            kty: "RSA",
            n: "1sx2Dz64sIk5ip5rU5_Ft4IuYqziSooeIsvC2iANhe3bwTq76itJWKK41zIGKf9uKqgWJFgNPrvcwuRBvb79UbWpPvZ2t0Hf7O8a0GZTlL4s30B7nQXA8wJOr8yQLhtM4ArYDMqzeij-4hD7Xgjlj-cXcwofXKBprMw-Ixcgawb_Jty_yDxZqFf48_EYIoPBBlSr8wWRELkrvpQYPCQ9GiBGQs-34O34uO3Wj9k_homElc_XEWYA7ijCAjZOoL95h7U2km3E684IWUimkXF8sMjP6NB87W9n80Flu1Ya7iyGm1OAx-R-nSKsOYQPtwJZe9U31UKoTKPUZpXjMbgpEQ",
            e: "AQAB",
            kid: "shothik-convex-1",
            use: "sig",
            alg: "RS256",
        },
    ],
});
http.route({
    path: "/.well-known/jwks.json",
    method: "GET",
    handler: httpAction(async () => {
        const jwks = process.env.JWKS || JWKS_DATA;
        return new Response(jwks, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }),
});
http.route({
    path: "/.well-known/openid-configuration",
    method: "GET",
    handler: httpAction(async () => {
        const siteUrl = process.env.CONVEX_SITE_URL || "https://doting-labrador-207.convex.site";
        return new Response(JSON.stringify({
            issuer: siteUrl,
            jwks_uri: `${siteUrl}/.well-known/jwks.json`,
            id_token_signing_alg_values_supported: ["RS256"],
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }),
});
export default http;
