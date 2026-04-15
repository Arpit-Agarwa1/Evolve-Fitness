import React from "react";
import { Helmet } from "react-helmet-async";
import { getSiteUrl } from "../config/seoConfig";
import { INSTAGRAM_URL } from "../config/socialLinks";
import { EVOLVE_MAP_LAT, EVOLVE_MAP_LNG } from "../config/googleMaps";

/**
 * schema.org SportsActivityLocation — helps Google show rich results for local “gym” searches.
 */
export default function JsonLdLocalBusiness() {
  const url = getSiteUrl();

  const data = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: "Evolve Fitness",
    alternateName: ["Evolve Gym Jaipur", "Evolve Gym", "Evolve Fitness Club"],
    description:
      "Luxury fitness gym at Vivacity Mall, Jaipur — personal training, elite equipment, recovery, and membership.",
    url,
    telephone: "+91-90243-01606",
    email: "info@evolvefitness.com",
    image: import.meta.env.VITE_OG_IMAGE_URL?.trim() || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress:
        "5th floor, Vivacity Mall, C-3, Hare Krishna Marg, near Akshay Patra temple, Mahal Yojana, Jagatpura",
      addressLocality: "Jaipur",
      addressRegion: "Rajasthan",
      postalCode: "302017",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: EVOLVE_MAP_LAT,
      longitude: EVOLVE_MAP_LNG,
    },
    sameAs: [INSTAGRAM_URL],
    priceRange: "$$",
  };

  if (!data.image) {
    delete data.image;
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}
