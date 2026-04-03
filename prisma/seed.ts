import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  await prisma.activity.deleteMany();
  await prisma.resourceLink.deleteMany();
  await prisma.note.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.project.deleteMany();

  const projects = await Promise.all([
    prisma.project.create({
      data: {
        slug: "occ-shutdown-command-hub",
        title: "OCC Shutdown Command Hub",
        summary: "Central oversight for shutdown coordination, permits, and milestone readiness.",
        description:
          "Track shutdown execution, stakeholder actions, permit readiness, and the critical path from planning through daily control room updates.",
        category: "OCC",
        status: "ACTIVE",
        priority: "CRITICAL",
        progress: 72,
        owner: "Operations",
        dueDate: addDays(17)
      }
    }),
    prisma.project.create({
      data: {
        slug: "hse-field-observation-program",
        title: "HSE Field Observation Program",
        summary: "Improve field visibility, risk reporting, and action closeout performance.",
        description:
          "Create a cleaner operating rhythm for HSE observations, actions, leading indicators, and leadership intervention tracking.",
        category: "HSE",
        status: "ACTIVE",
        priority: "HIGH",
        progress: 61,
        owner: "HSE Team",
        dueDate: addDays(24)
      }
    }),
    prisma.project.create({
      data: {
        slug: "training-matrix-refresh",
        title: "Training Matrix Refresh",
        summary: "Rebuild role-based learning pathways and certification visibility.",
        description:
          "Align training requirements by role, identify expired certifications, and improve readiness reporting across teams.",
        category: "TRAINING",
        status: "PLANNED",
        priority: "HIGH",
        progress: 34,
        owner: "Capability Lead",
        dueDate: addDays(30)
      }
    }),
    prisma.project.create({
      data: {
        slug: "ai-pm-copilot",
        title: "AI Project Copilot",
        summary: "A local-first AI workspace for project summaries, risk reviews, and drafting.",
        description:
          "Design a practical assistant for project reviews, note summarization, recurring reports, and action extraction from meeting content.",
        category: "AI_PROJECTS",
        status: "ACTIVE",
        priority: "HIGH",
        progress: 48,
        owner: "Digital Lab",
        dueDate: addDays(40)
      }
    }),
    prisma.project.create({
      data: {
        slug: "personal-life-admin-sprint",
        title: "Personal Life Admin Sprint",
        summary: "Consolidate finances, routines, and admin tasks into a single weekly system.",
        description:
          "A short personal operating system sprint to improve routines, paperwork tracking, and planned commitments.",
        category: "PERSONAL",
        status: "WAITING",
        priority: "MEDIUM",
        progress: 22,
        owner: "Personal",
        dueDate: addDays(12)
      }
    }),
    prisma.project.create({
      data: {
        slug: "ai-knowledge-vault",
        title: "AI Knowledge Vault",
        summary: "Structured vault for prompts, reusable workflows, and deployment notes.",
        description:
          "Create a searchable vault for reusable prompt systems, experiments, and architecture notes with future sync support.",
        category: "AI_PROJECTS",
        status: "IDEA",
        priority: "MEDIUM",
        progress: 9,
        owner: "Digital Lab",
        dueDate: addDays(55)
      }
    })
  ]);

  const [
    occProject,
    hseProject,
    trainingProject,
    aiProject,
    personalProject,
    knowledgeVaultProject
  ] = projects;

  await prisma.task.createMany({
    data: [
      {
        title: "Confirm final shutdown permit matrix",
        description: "Validate permit owners, permit windows, and escalation contacts.",
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        dueDate: addDays(2),
        blocked: false,
        category: "OCC",
        projectId: occProject.id
      },
      {
        title: "Review blocked isolation actions",
        description: "Clear waiting items impacting shutdown path readiness.",
        status: "BLOCKED",
        priority: "HIGH",
        dueDate: addDays(1),
        blocked: true,
        category: "OCC",
        projectId: occProject.id
      },
      {
        title: "Publish weekly field observation scorecard",
        description: "Summarize trends, leadership visits, and repeat exposure themes.",
        status: "TODO",
        priority: "HIGH",
        dueDate: addDays(3),
        blocked: false,
        category: "HSE",
        projectId: hseProject.id
      },
      {
        title: "Close out overdue action backlog",
        description: "Focus on actions older than 21 days with risk-ranked follow-up.",
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        dueDate: addDays(5),
        blocked: false,
        category: "HSE",
        projectId: hseProject.id
      },
      {
        title: "Map competencies by role family",
        description: "Rework the matrix structure for operators, supervisors, and leads.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: addDays(7),
        blocked: false,
        category: "TRAINING",
        projectId: trainingProject.id
      },
      {
        title: "Collect certification expiry data",
        description: "Pull source lists and identify missing dates before dashboard release.",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: addDays(6),
        blocked: false,
        category: "TRAINING",
        projectId: trainingProject.id
      },
      {
        title: "Draft assistant system prompt",
        description: "Define voice, project context ingestion, and operating constraints.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: addDays(2),
        blocked: false,
        category: "AI_PROJECTS",
        projectId: aiProject.id
      },
      {
        title: "Prototype local search indexing",
        description: "Test note and task retrieval for offline-first workflows.",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: addDays(9),
        blocked: false,
        category: "AI_PROJECTS",
        projectId: aiProject.id
      },
      {
        title: "Organize monthly admin checklist",
        description: "Group recurring personal admin items into weekly buckets.",
        status: "BLOCKED",
        priority: "LOW",
        dueDate: addDays(4),
        blocked: true,
        category: "PERSONAL",
        projectId: personalProject.id
      },
      {
        title: "Finalize expenses review",
        description: "Clear reimbursements and prepare the monthly cash overview.",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: addDays(8),
        blocked: false,
        category: "PERSONAL",
        projectId: personalProject.id
      },
      {
        title: "Outline vault taxonomy",
        description: "Define tags, templates, and search groups for reusable AI notes.",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: addDays(14),
        blocked: false,
        category: "AI_PROJECTS",
        projectId: knowledgeVaultProject.id
      },
      {
        title: "Archive completed shutdown lessons",
        description: "Move last-cycle lessons learned into the new project archive structure.",
        status: "DONE",
        priority: "LOW",
        dueDate: addDays(-5),
        blocked: false,
        category: "OCC",
        projectId: occProject.id,
        completedAt: addDays(-4)
      }
    ]
  });

  await prisma.note.createMany({
    data: [
      {
        title: "Shutdown daily briefing outline",
        content:
          "Use a three-part daily rhythm: critical path, blockers, and permit readiness. Keep decisions visible and action owners explicit.",
        tags: "operations,shutdown,briefing",
        category: "OCC",
        projectId: occProject.id
      },
      {
        title: "HSE observation themes",
        content:
          "Common themes remain line-of-fire exposure, vehicle movement, and rushed closeout documentation. Need visuals by area next.",
        tags: "hse,observations,insights",
        category: "HSE",
        projectId: hseProject.id
      },
      {
        title: "Training dashboard ideas",
        content:
          "Track expiring certifications by 30/60/90 day buckets and provide role-based drill-down for supervisors.",
        tags: "training,dashboard,planning",
        category: "TRAINING",
        projectId: trainingProject.id
      },
      {
        title: "Copilot capability map",
        content:
          "Phase one should focus on summarization, task extraction, risk prompts, and recurring status reports before broader automation.",
        tags: "ai,assistant,roadmap",
        category: "AI_PROJECTS",
        projectId: aiProject.id
      },
      {
        title: "Personal reset checklist",
        content:
          "Keep weekly review lightweight: finances, calendar, errands, paperwork, and one personal system improvement.",
        tags: "personal,weekly,checklist",
        category: "PERSONAL",
        projectId: personalProject.id
      },
      {
        title: "Reusable prompt patterns",
        content:
          "Document working prompt structures with examples, constraints, and evaluation criteria to avoid rediscovering them later.",
        tags: "ai,prompts,vault",
        category: "AI_PROJECTS",
        projectId: knowledgeVaultProject.id
      }
    ]
  });

  await prisma.resourceLink.createMany({
    data: [
      {
        title: "Shutdown checklist",
        description: "Master checklist for outage readiness and workfront alignment.",
        url: "https://intranet.example.local/shutdown-checklist",
        type: "Checklist",
        category: "OCC",
        projectId: occProject.id
      },
      {
        title: "HSE leading indicators",
        description: "Reference sheet for weekly observation metrics and lagging indicators.",
        url: "https://intranet.example.local/hse-indicators",
        type: "Reference",
        category: "HSE",
        projectId: hseProject.id
      },
      {
        title: "Training matrix template",
        description: "Spreadsheet model for role-to-certification mapping.",
        url: "https://intranet.example.local/training-matrix",
        type: "Template",
        category: "TRAINING",
        projectId: trainingProject.id
      },
      {
        title: "AI experimentation log",
        description: "Running log of experiments, model notes, and evaluation criteria.",
        url: "https://intranet.example.local/ai-log",
        type: "Log",
        category: "AI_PROJECTS",
        projectId: aiProject.id
      },
      {
        title: "Personal admin board",
        description: "High-level personal planning board and recurring reminders.",
        url: "https://intranet.example.local/personal-board",
        type: "Board",
        category: "PERSONAL",
        projectId: personalProject.id
      }
    ]
  });

  await prisma.milestone.createMany({
    data: [
      {
        title: "Shutdown go/no-go review",
        summary: "Final execution readiness review with permit and isolation owners.",
        status: "ACTIVE",
        date: addDays(4),
        category: "OCC",
        projectId: occProject.id
      },
      {
        title: "Observation program steering review",
        summary: "Present closeout trend improvement and intervention priorities.",
        status: "PLANNED",
        date: addDays(8),
        category: "HSE",
        projectId: hseProject.id
      },
      {
        title: "Training matrix v1 approval",
        summary: "Review draft role matrix and confirm reporting structure.",
        status: "PLANNED",
        date: addDays(11),
        category: "TRAINING",
        projectId: trainingProject.id
      },
      {
        title: "Copilot alpha demo",
        summary: "Demonstrate local note summarization, task extraction, and analytics.",
        status: "ACTIVE",
        date: addDays(15),
        category: "AI_PROJECTS",
        projectId: aiProject.id
      },
      {
        title: "Personal systems review",
        summary: "Check whether the weekly structure is reducing admin overhead.",
        status: "WAITING",
        date: addDays(10),
        category: "PERSONAL",
        projectId: personalProject.id
      }
    ]
  });

  await prisma.activity.createMany({
    data: [
      {
        action: "Updated project progress",
        description: "OCC Shutdown Command Hub moved from 65% to 72% after permit reconciliation.",
        entityType: "project",
        category: "OCC",
        projectId: occProject.id,
        createdAt: addDays(-1)
      },
      {
        action: "Blocked task flagged",
        description: "Isolation action remains blocked pending contractor input.",
        entityType: "task",
        category: "OCC",
        projectId: occProject.id,
        createdAt: addDays(-1)
      },
      {
        action: "Weekly scorecard drafted",
        description: "HSE field observation data prepared for leadership review.",
        entityType: "task",
        category: "HSE",
        projectId: hseProject.id,
        createdAt: addDays(-2)
      },
      {
        action: "Role mapping workshop planned",
        description: "Training matrix refresh workshop scheduled with supervisors.",
        entityType: "milestone",
        category: "TRAINING",
        projectId: trainingProject.id,
        createdAt: addDays(-2)
      },
      {
        action: "Prompt system refined",
        description: "AI Project Copilot now separates reporting tone from risk analysis instructions.",
        entityType: "note",
        category: "AI_PROJECTS",
        projectId: aiProject.id,
        createdAt: addDays(-3)
      },
      {
        action: "Vault concept captured",
        description: "Initial taxonomy for reusable prompts and templates saved to notes.",
        entityType: "note",
        category: "AI_PROJECTS",
        projectId: knowledgeVaultProject.id,
        createdAt: addDays(-3)
      },
      {
        action: "Weekly review delayed",
        description: "Personal admin sprint is waiting on updated expense exports.",
        entityType: "task",
        category: "PERSONAL",
        projectId: personalProject.id,
        createdAt: addDays(-4)
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
