const siteUrl = process.env.CONVEX_SITE_URL || "https://healthy-mastiff-358.convex.site";

export default {
  providers: [
    {
      domain: siteUrl,
      applicationID: "shothik-publishing",
    },
  ],
};
