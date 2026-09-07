import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { getAdsenseClient } from "../config/adsense";
import { loadAdsenseScript } from "../utils/loadAdsense";

/**
 * Injects the AdSense account meta + script on public routes.
 * Admin stays ad-free. In AdSense, also exclude paths containing /admin.
 */
export default function AdSenseLoader() {
  const { pathname } = useLocation();
  const client = getAdsenseClient();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (!client || isAdmin) return;
    loadAdsenseScript(client);
  }, [client, isAdmin]);

  if (!client) return null;

  return (
    <Helmet>
      <meta name="google-adsense-account" content={client} />
    </Helmet>
  );
}
