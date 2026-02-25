const siteUrl = process.env.CONVEX_SITE_URL || "https://doting-labrador-207.convex.site";
export default {
    providers: [
        {
            domain: siteUrl,
            applicationID: "shothik-publishing",
        },
    ],
};
