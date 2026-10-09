import type { Metadata } from "next";
import { AiTeamView } from "@/features/ai-team/ai-team-view";

export const metadata: Metadata = { title: "AI Team" };

// Everything on this tab comes from the laptop through /api/team, loaded in the browser so
// the page still opens (with the offline state) when the MacBook is asleep.
export default function AiTeamPage() {
  return <AiTeamView />;
}
