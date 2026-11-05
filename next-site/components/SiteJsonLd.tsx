import { projects } from "@/data/projects";
import { heroLead, heroSupport, ogImage, siteDescription, siteName, siteUrl, socialProfiles } from "@/data/site";

const personId = `${siteUrl}/#person`;
const websiteId = `${siteUrl}/#website`;
const projectsId = `${siteUrl}/#projects`;

/**
 * Person, WebSite, and project list structured data.
 * Facts are limited to the homepage bio, profile links, and project entries.
 */
export default function SiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteUrl,
        name: siteName,
        description: siteDescription,
        inLanguage: "en",
        mainEntity: { "@id": personId },
        hasPart: { "@id": projectsId },
      },
      {
        "@type": "Person",
        "@id": personId,
        name: siteName,
        url: siteUrl,
        jobTitle: "Forward Deployed Engineer",
        description: `${heroLead} ${heroSupport}`,
        image: `${siteUrl}${ogImage.url}`,
        sameAs: [...socialProfiles],
      },
      {
        "@type": "ItemList",
        "@id": projectsId,
        name: "Projects",
        itemListElement: projects.map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "CreativeWork",
            name: project.title,
            description: project.cardDescription,
            ...(project.url ? { url: project.url } : {}),
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
