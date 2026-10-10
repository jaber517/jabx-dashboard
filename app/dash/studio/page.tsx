import type { Metadata } from "next";
import { StudioView } from "@/features/studio/studio-view";
import { fetchStudioLeads, getLeadsWithStages } from "@/lib/studio-leads";

export const metadata: Metadata = { title: "Studio" };
export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const result = await fetchStudioLeads();

  if (!result.ok) {
    return (
      <StudioView
        connected={result.connected}
        reason={result.connected ? result.error : result.reason}
        leads={[]}
      />
    );
  }

  const leadsWithStages = await getLeadsWithStages(result.leads);

  return (
    <StudioView
      connected={true}
      isFixture={result.isFixture}
      leads={leadsWithStages}
    />
  );
}
