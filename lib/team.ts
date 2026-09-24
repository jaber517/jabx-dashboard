// The people shown on jabx.me/team. Everything here is published publicly.
// AI team profiles come from the jabx-profiles-final set (profiles.json);
// portraits are AI-generated and live in /public/team.
// instagram: the handle without "@"; leave it out until an account exists.
export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
  email?: string;
  instagram?: string;
};

export const founder: TeamMember = {
  id: "jaber",
  name: "Jaber Alenezi",
  role: "Founder",
  bio: "Jaber founded jabx and sets its direction. He decides what the studio builds and why, and reviews the work before it ships.",
  photo: "/team/anonymous.svg",
  email: "contact@jabx.me",
  instagram: "jabx.ai"
};

export const aiTeam: TeamMember[] = [
  {
    id: "adam",
    name: "Adam Carter",
    role: "Team Lead",
    bio: "Adam leads the AI team under Jaber’s direction, turning ideas into clear priorities and practical plans. He coordinates the team’s work, keeps projects moving, and keeps the focus on quality.",
    photo: "/team/adam.jpg",
    email: "adam@jabx.me"
  },
  {
    id: "cody",
    name: "Cody Morgan",
    role: "Software Engineer",
    bio: "Cody turns technical challenges into dependable software. He builds features, connects systems, and fixes bugs, with an eye for readable code and smooth performance.",
    photo: "/team/cody.jpg",
    email: "cody@jabx.me"
  },
  {
    id: "alina",
    name: "Alina Sokolova",
    role: "Product Engineer",
    bio: "Alina connects product thinking with hands-on engineering. She shapes ideas into useful features, refines user journeys, and sweats the details that make a product feel intuitive.",
    photo: "/team/alina.jpg",
    email: "alina@jabx.me"
  },
  {
    id: "maya",
    name: "Maya Haddad",
    role: "Research & Growth",
    bio: "Maya explores the people, questions, and opportunities behind each project. She turns research into clear insights and testable growth ideas.",
    photo: "/team/maya.jpg",
    email: "maya@jabx.me"
  },
  {
    id: "nico",
    name: "Nico Álvarez",
    role: "Support Specialist",
    bio: "Nico makes support clear, friendly, and useful. He helps people troubleshoot and find their next step, and turns recurring feedback into practical improvements.",
    photo: "/team/nico.jpg",
    email: "nico@jabx.me"
  },
  {
    id: "wei",
    name: "Wei Zhang",
    role: "Automation & Operations",
    bio: "Wei keeps the studio’s workflows organised and repeatable. He connects tools, automates routine tasks, and monitors processes to catch issues early.",
    photo: "/team/wei.jpg",
    email: "wei@jabx.me"
  }
];
