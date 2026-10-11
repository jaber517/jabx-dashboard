// The Jabx Studio offer on jabx.me. No prices: Jaber quotes each request himself.
// Package ids and the sector and timing lists must match the lead Worker's allowlists.

export type ServicePackage = {
  id: "business-website" | "operations-dashboard" | "business-automation";
  name: string;
  summary: string;
  audience: string;
  includes: string[];
  excludes: string[];
  delivery: string;
};

export const servicePackages: ServicePackage[] = [
  {
    id: "business-website",
    name: "Business Website",
    summary: "A clear, fast site that tells people what you do and how to reach you.",
    audience: "Restaurants, service firms and consultants.",
    includes: ["Up to 5 pages that work on any screen", "Arabic and English", "A contact form", "Basic search setup and visitor analytics", "Two rounds of revisions"],
    excludes: ["An online shop", "Writing copy beyond the 5 pages", "Paid plugins and hosting fees"],
    delivery: "1–2 weeks"
  },
  {
    id: "operations-dashboard",
    name: "Operations Dashboard",
    summary: "The numbers your team already keeps, turned into one view everyone can use.",
    audience: "Contractors, workshops, logistics and industrial firms.",
    includes: ["Key figures built from your spreadsheets", "Views for equipment, inspections and workforce", "A monthly summary", "Up to 3 user roles"],
    excludes: ["Connections to ERP or other live systems", "Mobile apps"],
    delivery: "2–4 weeks"
  },
  {
    id: "business-automation",
    name: "Business Automation",
    summary: "One recurring job taken off your team's hands, from start to finish.",
    audience: "Teams that run on spreadsheets and email.",
    includes: ["One recurring workflow automated end to end", "For example a report, a chain of notifications, an approval or a file-processing step"],
    excludes: ["More than one workflow", "Systems with no API or export"],
    delivery: "1–3 weeks"
  }
];

export const leadPackages = [...servicePackages.map(({ id, name }) => ({ value: id as string, label: name })), { value: "not-sure", label: "Not sure yet" }];

export const leadSectors = [
  "Restaurant or hospitality",
  "Professional services or consulting",
  "Contracting or construction",
  "Workshop or industrial",
  "Logistics",
  "Retail",
  "Other"
];

export const leadTimings = ["As soon as possible", "Within a month", "In 1–3 months", "Just exploring"];
