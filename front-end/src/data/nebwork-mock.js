export const currentUser = {
  name: "Dion Pratama",
  role: "Product Owner",
  team: "People Systems",
  initials: "DP",
  unreadNotifications: 7,
};

export const homeMetrics = [
  { label: "Knowledge retained", value: "82%", detail: "critical workstreams covered", change: "+12% vs last quarter" },
  { label: "Active documenters", value: "74%", detail: "posting at least monthly", change: "+18 contributors this month" },
  { label: "Onboarding compression", value: "3.4 mo", detail: "from 6-12 months baseline", change: "48% faster ramp-up" },
  { label: "AI helpfulness", value: "87%", detail: "positive answer feedback", change: "based on 1,284 questions" },
];

export const feedBuckets = ["For You", "Following", "Trending"];

export const filterChips = ["Engineering", "Onboarding", "Bug Fix", "Project Handover", "Finance Ops", "How-to"];

export const worklogFeed = [
  {
    id: "wl-1",
    bucket: "For You",
    title: "Handover payroll anomaly resolution for multi-bank transfers",
    excerpt:
      "Summarizes the multi-bank payroll error investigation pattern, including root causes, fallback batches, and contact persons for delayed settlements.",
    author: "Rani Siregar",
    role: "Senior Payroll Specialist",
    initials: "RS",
    publishedAgo: "2 hours ago",
    team: "Finance Ops",
    project: "Payroll Stabilization Q2",
    privacy: "Public",
    tags: ["Troubleshooting", "Finance Ops", "Critical"],
    metrics: { views: 128, comments: 16, likes: 42 },
    tone: "teal",
  },
  {
    id: "wl-2",
    bucket: "For You",
    title: "Set up Atlas project environment for new engineers in 35 minutes",
    excerpt:
      "This document combines local setup steps, VPN access, seed data, and a validation checklist so new engineers can commit on their first day without full-day pairing.",
    author: "Fikri Mahendra",
    role: "Staff Backend Engineer",
    initials: "FM",
    publishedAgo: "5 hours ago",
    team: "Engineering",
    project: "Atlas Core API",
    privacy: "Team Only",
    tags: ["Onboarding", "Engineering", "How-to"],
    metrics: { views: 214, comments: 9, likes: 58 },
    tone: "amber",
  },
  {
    id: "wl-3",
    bucket: "Following",
    title: "Template meeting notes yang langsung berubah jadi action plan tim",
    excerpt:
      "This format separates decision logs, owners, and follow-up risks so meeting outcomes aren't lost in chat. Ideal for cross-functional syncs and weekly project reviews.",
    author: "Nadia Putri",
    role: "Program Manager",
    initials: "NP",
    publishedAgo: "Yesterday",
    team: "Operations",
    project: "Cross-Functional PMO",
    privacy: "Public",
    tags: ["Template", "Meeting Notes", "Operations"],
    metrics: { views: 96, comments: 11, likes: 31 },
    tone: "rose",
  },
  {
    id: "wl-4",
    bucket: "Trending",
    title: "Postmortem error 502 pada gateway vendor dan langkah recovery-nya",
    excerpt:
      "This worklog records early signals, main queries, fix rollout, and monitoring guardrails to prevent similar incidents during peak transaction hours.",
    author: "Kevin Halim",
    role: "Site Reliability Engineer",
    initials: "KH",
    publishedAgo: "3 days ago",
    team: "Platform",
    project: "Vendor Gateway Reliability",
    privacy: "Public",
    tags: ["Incident", "SRE", "Best Practice"],
    metrics: { views: 481, comments: 28, likes: 113 },
    tone: "sky",
  },
];

export const trendingTopics = [
  { label: "#handover", volume: "84 worklogs" },
  { label: "#employee-onboarding", volume: "61 worklogs" },
  { label: "#knowledge-gap", volume: "37 AI questions" },
  { label: "#bug-fix", volume: "112 worklogs" },
];

export const topContributors = [
  { name: "Rani Siregar", role: "Finance Ops", initials: "RS", streak: "18 days" },
  { name: "Fikri Mahendra", role: "Engineering", initials: "FM", streak: "11 days" },
  { name: "Nadia Putri", role: "Program Management", initials: "NP", streak: "9 days" },
];

export const spotlightNotifications = [
  "3 new engineers saved Atlas setup worklogs this week",
  "2 AI questions lack strong answers in the Finance Ops domain",
  "Project Handover template used 24 times in the last 14 days",
];

export const editorTemplates = [
  { name: "Bug Fix Documentation", blurb: "Root cause, reproduction, fix, and prevention guardrails." },
  { name: "Feature Implementation", blurb: "Business context, architecture, decision log, and rollout plan." },
  { name: "Project Handover", blurb: "Project status, open risks, owner, and next checkpoints." },
  { name: "Onboarding Guide", blurb: "Setup steps, required access, and quick FAQs." },
];

export const editorToolbar = ["Heading", "Checklist", "Code Block", "Table", "Quote", "Attachment"];

export const docMenus = ["File", "Edit", "View", "Insert", "Format", "Tools", "Help"];

export const docToolbarGroups = [
  ["Undo", "Redo", "Print"],
  ["Normal text", "H1", "H2"],
  ["Bold", "Italic", "Underline"],
  ["Checklist", "Bullet list", "Numbered list"],
  ["Link", "Comment", "Image"],
];

export const editorSections = [
  {
    title: "1. Context",
    body:
      "The Payroll team encountered a salary transfer anomaly at the third bank when batch volumes exceeded 3,000 transactions. This worklog ensures new engineers or ops can repeat the recovery process without waiting for the original author.",
  },
  {
    title: "2. Investigation path",
    body:
      "Start from the reconciliation dashboard, check for mismatch settlement IDs, then compare remittance files with vendor callback logs. If the first retry fails, switch to fallback batch and escalate to #finance-incident.",
  },
  {
    title: "3. Best practice",
    body:
      "Save mismatch screenshots, record bank cut-off timestamps, and update the worklog status after the fix so the AI Assistant can use the latest context for the next hire's onboarding.",
  },
];

export const editorChecklist = [
  "Add project metadata and privacy level",
  "Attach dashboard screenshots or main queries",
  "Fill in a 2-3 sentence summary for AI retrieval",
  "Tag an expert or reviewer before publishing",
];

export const editorSuggestions = [
  "AI suggests tags: Finance Ops, Troubleshooting, Handover, Payroll",
  "Found 2 similar worklogs, consider linking them as additional references",
  "Auto-summary: Multi-bank payroll recovery documentation for high batch volumes",
];

export const docOutline = [
  "Context and objective",
  "Symptoms and early signals",
  "Investigation path",
  "Recovery steps",
  "Escalation contacts",
  "Lessons learned",
];

export const versionHistory = [
  { version: "v3", time: "Saved 18 seconds ago", editor: "Dion Pratama" },
  { version: "v2", time: "Today, 09:18", editor: "Rani Siregar" },
  { version: "v1", time: "Today, 08:47", editor: "Dion Pratama" },
];

export const collaborators = [
  { name: "Rani Siregar", role: "Reviewer", initials: "RS", status: "Active" },
  { name: "Fikri Mahendra", role: "Editor", initials: "FM", status: "Watching" },
  { name: "Mira Anjani", role: "Commenter", initials: "MA", status: "Idle" },
];

export const inviteSuggestions = [
  { label: "Invite by email", value: "rani.siregar@nebwork.id" },
  { label: "Invite by username", value: "@fikrimahendra" },
  { label: "Invite by team", value: "Finance Ops - Payroll Squad" },
];

export const collaborationGuide = [
  "Click Invite collaborator, then enter an email, username, or select a relevant team.",
  "Choose permission: Editor to co-write, Commenter for review, Viewer for reading only.",
  "Once invited, collaborators can open the same worklog and add their sections directly.",
];

export const activeInvites = [
  { name: "Rani Siregar", role: "Editor", channel: "email invite sent" },
  { name: "Fikri Mahendra", role: "Commenter", channel: "username invite sent" },
];

export const assistantMessages = [
  {
    role: "user",
    author: "Dion",
    time: "09:24",
    content: "How do I set up the environment for the Atlas project without waiting for a senior engineer to come online?",
  },
  {
    role: "assistant",
    author: "Nebwork AI",
    time: "09:24",
    content:
      "Based on the 3 latest worklogs, the fastest path is: enable VPN access, clone the Atlas Core API repo, run the atlas-dev-lite seed data, then validate healthcheck at /readyz. I also found the 35-minute onboarding checklist most frequently saved by new teams.",
  },
  {
    role: "user",
    author: "Dion",
    time: "09:25",
    content: "Who is the expert I can contact if the seed data fails?",
  },
  {
    role: "assistant",
    author: "Nebwork AI",
    time: "09:25",
    content:
      "The most relevant expert is Fikri Mahendra for seed data issues and Kevin Halim for supporting service connectivity issues. My confidence is 0.89 because both are recorded as authors or reviewers in related worklogs.",
  },
];

export const assistantThreads = [
  { title: "Setup Atlas environment", preview: "VPN, seed data, local readyz check", time: "Today" },
  { title: "Payroll handover checklist", preview: "Recovery flow and escalation path", time: "Yesterday" },
  { title: "Error 502 vendor gateway", preview: "Postmortem, guardrail, monitoring", time: "Mon" },
  { title: "Onboarding for Finance Ops", preview: "First-week worklogs to read", time: "Sun" },
];

export const assistantPromptChips = [
  "How do I set up the Atlas project environment?",
  "Who is the expert for payroll settlement errors?",
  "Find relevant handover worklogs for new employees",
  "What are the best practices for bug fix documentation?",
];

export const assistantInlineCitations = [
  "Set up Atlas project environment for new engineers in 35 minutes",
  "Atlas seed data runbook (lite version) for the April onboarding batch",
];

export const myWorklogStats = [
  { label: "Total worklogs", value: "24", detail: "8 published this quarter" },
  { label: "Drafts", value: "5", detail: "2 need review before publish" },
  { label: "Collaborative docs", value: "7", detail: "shared with cross-functional teammates" },
];

export const myWorklogFilters = ["All", "Published", "Draft", "Collaborative"];

export const myWorklogs = [
  {
    id: "my-1",
    title: "Handover payroll anomaly resolution for multi-bank transfers",
    status: "Published",
    privacy: "Team Only",
    project: "Payroll Stabilization Q2",
    updatedAt: "Edited 18 minutes ago",
    excerpt: "Multi-bank payroll recovery documentation, escalation path, and fallback batch for high transaction volumes.",
    tags: ["#handover", "#payroll", "#troubleshooting"],
    collaborators: ["RS", "FM"],
  },
  {
    id: "my-2",
    title: "New analyst onboarding checklist - week one",
    status: "Draft",
    privacy: "Private",
    project: "Finance Ops Onboarding",
    updatedAt: "Edited yesterday",
    excerpt: "Access guide, required reading worklogs, and task sequence so new analysts aren't confused in their first week.",
    tags: ["#onboarding", "#financeops"],
    collaborators: [],
  },
  {
    id: "my-3",
    title: "Retrospective incident vendor settlement April",
    status: "Published",
    privacy: "Public",
    project: "Vendor Reliability",
    updatedAt: "Edited 3 days ago",
    excerpt: "Incident summary, team learnings, monitoring changes, and cross-functional follow-up decisions.",
    tags: ["#incident", "#retrospective", "#vendor"],
    collaborators: ["KH", "MA", "NP"],
  },
  {
    id: "my-4",
    title: "Draft SOP revoke access vendor payroll",
    status: "Collaborative",
    privacy: "Team Only",
    project: "Access Governance",
    updatedAt: "Edited 5 days ago",
    excerpt: "Collaborative work document for access revocation steps, owner approvals, and audit trails during handover.",
    tags: ["#access", "#security", "#collaboration"],
    collaborators: ["FM", "RS"],
  },
];

export const projectOverview = {
  name: "Project Handover: Payroll Stabilization",
  summary:
    "Project workspace for documenting multi-bank payroll processes, incident recovery, and new team member onboarding playbooks.",
  progress: 72,
  dueDate: "16 Apr 2026",
  team: "8 contributors",
};

export const projectColumns = [
  {
    title: "Not Started",
    tasks: [
      { title: "Record reconciliation dashboard walkthrough", owner: "Mira", priority: "Medium" },
      { title: "Add vendor access revocation SOP", owner: "Dion", priority: "High" },
    ],
  },
  {
    title: "In Progress",
    tasks: [
      { title: "Complete fallback batch transfer runbook", owner: "Rani", priority: "High" },
      { title: "Review metadata tags for AI retrieval", owner: "Fikri", priority: "Low" },
    ],
  },
  {
    title: "Completed",
    tasks: [
      { title: "Document settlement error root cause", owner: "Kevin", priority: "High" },
      { title: "New analyst onboarding checklist", owner: "Nadia", priority: "Medium" },
    ],
  },
];

export const projectMembers = [
  { name: "Rani Siregar", role: "Owner", initials: "RS", presence: "Editing overview" },
  { name: "Fikri Mahendra", role: "Editor", initials: "FM", presence: "Reviewing task 3" },
  { name: "Mira Anjani", role: "Commenter", initials: "MA", presence: "Reading milestones" },
  { name: "Kevin Halim", role: "Viewer", initials: "KH", presence: "Offline" },
];

export const projectActivity = [
  "Rani added a new section: 'Escalation matrix'",
  "Fikri commented on the AI metadata task",
  "Mira completed the April onboarding batch checklist",
  "Kevin uploaded the 502 gateway postmortem attachment",
];

export const projectMilestones = [
  { name: "Project overview published", date: "8 Apr", status: "Done" },
  { name: "Critical runbooks complete", date: "11 Apr", status: "In Progress" },
  { name: "Cross-team review", date: "14 Apr", status: "Planned" },
  { name: "Final handover pack", date: "16 Apr", status: "Planned" },
];

export const analyticsSummary = [
  { label: "Annual turnover savings", value: "IDR 182M", detail: "projected for 100 employees" },
  { label: "Search success rate", value: "78%", detail: "useful worklog found in first session" },
  { label: "AI adoption in new hires", value: "63%", detail: "within first 90 days" },
  { label: "Critical project coverage", value: "81%", detail: "documented with handover-ready depth" },
];

export const adoptionTrend = [
  { month: "Jan", authors: 24, readers: 76 },
  { month: "Feb", authors: 31, readers: 88 },
  { month: "Mar", authors: 43, readers: 107 },
  { month: "Apr", authors: 57, readers: 124 },
  { month: "May", authors: 63, readers: 142 },
  { month: "Jun", authors: 71, readers: 156 },
];

export const roiTrend = [
  { quarter: "Q1", savings: 38 },
  { quarter: "Q2", savings: 64 },
  { quarter: "Q3", savings: 91 },
  { quarter: "Q4", savings: 182 },
];

export const analyticsNotes = [
  "Teams using handover templates achieve the fastest time-to-productivity",
  "The categories with the highest knowledge gaps remain Finance Ops and Vendor Management",
  "Feeds with 'Relevant to Me' sorting increase save rate 1.7x compared to purely chronological ones",
];

export const assistantStats = [
  { label: "Questions answered", value: "1,284" },
  { label: "Time saved", value: "340h" },
  { label: "Confidence score", value: "94%" },
];

export const assistantSources = [
  {
    title: "Set up Atlas project environment for new engineers in 35 minutes",
    author: "Fikri Mahendra",
    confidence: 98,
    excerpt: "Steps to enable VPN, clone repo, and run seed data for local dev.",
  },
  {
    title: "Runbook seed data Atlas version lite",
    author: "Kevin Halim",
    confidence: 85,
    excerpt: "Troubleshooting steps if healthcheck /readyz fails after seeding.",
  },
];

export const assistantExperts = [
  { name: "Fikri Mahendra", role: "Backend Engineer", initials: "FM", specialty: "Core API" },
  { name: "Kevin Halim", role: "SRE", initials: "KH", specialty: "Infrastructure" },
];

export const knowledgeGaps = [
  "How to handle vendor settlement timeout in bank batch?",
  "Standard operating procedure for revoking access of terminated vendors.",
];
