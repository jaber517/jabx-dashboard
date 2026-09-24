import Image from "next/image";
import { Instagram, Mail } from "lucide-react";
import { PublicShell } from "@/components/public/public-shell";
import { publicMetadata } from "@/components/public/public-metadata";
import { aiTeam, founder, type TeamMember } from "@/lib/team";

export const metadata = publicMetadata("Team — jabx", "Meet the team behind jabx: an independent studio led by Jaber and supported by an AI team.", "/team");

function MemberLinks({ member }: { member: TeamMember }) {
  if (!member.email && !member.instagram) return null;
  return <div className="public-member-links">
    {member.email ? <a href={`mailto:${member.email}`} aria-label={`Email ${member.name}, ${member.email}`}><Mail aria-hidden="true" />{member.email}</a> : null}
    {member.instagram ? <a href={`https://www.instagram.com/${member.instagram}/`} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on Instagram, @${member.instagram} (opens in a new tab)`}><Instagram aria-hidden="true" />@{member.instagram}</a> : null}
  </div>;
}

export default function TeamPage() {
  return <PublicShell socials>
    <section className="public-hero public-hero-solo"><div className="public-hero-copy"><p className="public-eyebrow">Team</p><h1>Meet the team<br />behind <span className="public-accent">jabx.</span></h1><p className="public-lead">Human direction. AI capability. jabx is led by Jaber and supported by an AI team, each with a clear role in the work.</p></div></section>

    <section className="public-section" aria-labelledby="founder-heading">
      <article className="public-founder public-card">
        <Image src={founder.photo} alt="" width={640} height={640} />
        <div className="public-founder-body">
          <p className="public-eyebrow">Led by</p>
          <h2 id="founder-heading">{founder.name}</h2>
          <p className="public-member-role">{founder.role}</p>
          <p>{founder.bio}</p>
          <MemberLinks member={founder} />
        </div>
      </article>
    </section>

    <section className="public-section" aria-labelledby="ai-team-heading">
      <div className="public-section-heading"><div><p className="public-eyebrow">Supported by</p><h2 id="ai-team-heading">The AI team</h2></div></div>
      <div className="public-team-grid">
        {aiTeam.map((member) => <article key={member.id} className="public-member public-card" aria-labelledby={`member-${member.id}`}>
          <Image src={member.photo} alt={`AI-generated portrait of ${member.name}`} width={720} height={720} sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 370px" />
          <div className="public-member-body">
            <h2 id={`member-${member.id}`}>{member.name}</h2>
            <p className="public-member-role">{member.role}</p>
            <span className="public-member-tag">AI team member</span>
            <p>{member.bio}</p>
            <MemberLinks member={member} />
          </div>
        </article>)}
      </div>
      <p className="public-team-note">The AI team members are AI characters with AI-generated portraits. Jaber directs their work and reviews it before it ships.</p>
    </section>
  </PublicShell>;
}
