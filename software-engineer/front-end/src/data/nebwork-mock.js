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
      "Ringkasan ini merapikan pola investigasi error payroll lintas bank, lengkap dengan root cause, fallback batch, dan siapa yang perlu dihubungi saat settlement tertunda.",
    author: "Rani Siregar",
    role: "Senior Payroll Specialist",
    initials: "RS",
    publishedAgo: "2 jam lalu",
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
    title: "Setup environment project Atlas untuk engineer baru dalam 35 menit",
    excerpt:
      "Dokumen ini menggabungkan langkah setup lokal, akses VPN, seed data, dan checklist validasi supaya engineer baru bisa commit di hari pertama tanpa pair full day.",
    author: "Fikri Mahendra",
    role: "Staff Backend Engineer",
    initials: "FM",
    publishedAgo: "5 jam lalu",
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
      "Format ini memisahkan decision log, owner, dan risiko lanjutan sehingga hasil meeting tidak hilang di chat. Cocok untuk sync lintas fungsi dan weekly project review.",
    author: "Nadia Putri",
    role: "Program Manager",
    initials: "NP",
    publishedAgo: "Kemarin",
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
      "Worklog ini mencatat sinyal awal, query utama, rollout fix, dan guardrail monitoring agar insiden serupa tidak terulang pada jam puncak transaksi.",
    author: "Kevin Halim",
    role: "Site Reliability Engineer",
    initials: "KH",
    publishedAgo: "3 hari lalu",
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
  { name: "Rani Siregar", role: "Finance Ops", initials: "RS", streak: "18 hari" },
  { name: "Fikri Mahendra", role: "Engineering", initials: "FM", streak: "11 hari" },
  { name: "Nadia Putri", role: "Program Management", initials: "NP", streak: "9 hari" },
];

export const spotlightNotifications = [
  "3 engineer baru menyimpan worklog setup Atlas minggu ini",
  "2 pertanyaan AI belum punya jawaban kuat di domain Finance Ops",
  "Project Handover template dipakai 24 kali dalam 14 hari terakhir",
];

export const editorTemplates = [
  { name: "Bug Fix Documentation", blurb: "Akar masalah, reproduksi, fix, dan guardrail pencegahan." },
  { name: "Feature Implementation", blurb: "Context bisnis, arsitektur, decision log, dan rollout plan." },
  { name: "Project Handover", blurb: "Status proyek, risiko terbuka, owner, dan next checkpoints." },
  { name: "Onboarding Guide", blurb: "Langkah setup, akses yang diperlukan, dan FAQ cepat." },
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
      "Tim Payroll menerima anomali transfer gaji di bank ketiga saat volume batch melewati 3.000 transaksi. Worklog ini dibuat untuk memastikan engineer atau ops baru bisa mengulang proses recovery tanpa harus menunggu author asli.",
  },
  {
    title: "2. Investigation path",
    body:
      "Mulai dari dashboard reconciliation, cek mismatch settlement ID, lalu bandingkan file remittance dengan log callback vendor. Jika retry pertama gagal, pindah ke fallback batch dan eskalasi ke channel #finance-incident.",
  },
  {
    title: "3. Best practice",
    body:
      "Simpan screenshot mismatch, catat timestamp bank cut-off, dan update status worklog setelah fix agar AI Assistant bisa memakai konteks terbaru untuk onboarding orang berikutnya.",
  },
];

export const editorChecklist = [
  "Tambahkan metadata project dan privacy level",
  "Lampirkan screenshot dashboard atau query utama",
  "Isi summary 2-3 kalimat untuk AI retrieval",
  "Tag expert atau reviewer sebelum publish",
];

export const editorSuggestions = [
  "AI menyarankan tag: Finance Ops, Troubleshooting, Handover, Payroll",
  "Ditemukan 2 worklog serupa, pertimbangkan tautkan sebagai referensi tambahan",
  "Summary otomatis: Dokumentasi recovery payroll lintas bank untuk volume batch tinggi",
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
  { version: "v3", time: "Disimpan 18 detik lalu", editor: "Dion Pratama" },
  { version: "v2", time: "Hari ini, 09:18", editor: "Rani Siregar" },
  { version: "v1", time: "Hari ini, 08:47", editor: "Dion Pratama" },
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
  "Klik Invite collaborator, lalu masukkan email, username, atau pilih team yang relevan.",
  "Pilih permission: Editor untuk ikut menulis, Commenter untuk review, Viewer untuk baca saja.",
  "Setelah diundang, collaborator bisa membuka worklog yang sama dan menambahkan bagian mereka langsung.",
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
    content: "Bagaimana cara setup environment untuk project Atlas tanpa menunggu engineer senior online?",
  },
  {
    role: "assistant",
    author: "Nebwork AI",
    time: "09:24",
    content:
      "Berdasarkan 3 worklog terbaru, jalur tercepat adalah: aktifkan akses VPN, clone repo Atlas Core API, jalankan seed data atlas-dev-lite, lalu validasi healthcheck di /readyz. Saya juga menemukan checklist onboarding 35 menit yang paling sering disimpan tim baru.",
  },
  {
    role: "user",
    author: "Dion",
    time: "09:25",
    content: "Siapa expert yang bisa saya kontak kalau seed data gagal?",
  },
  {
    role: "assistant",
    author: "Nebwork AI",
    time: "09:25",
    content:
      "Expert yang paling relevan adalah Fikri Mahendra untuk masalah seed data dan Kevin Halim untuk isu konektivitas service pendukung. Confidence saya 0.89 karena keduanya tercatat sebagai author atau reviewer di worklog terkait.",
  },
];

export const assistantThreads = [
  { title: "Setup Atlas environment", preview: "VPN, seed data, local readyz check", time: "Today" },
  { title: "Payroll handover checklist", preview: "Recovery flow and escalation path", time: "Yesterday" },
  { title: "Error 502 vendor gateway", preview: "Postmortem, guardrail, monitoring", time: "Mon" },
  { title: "Onboarding for Finance Ops", preview: "First-week worklogs to read", time: "Sun" },
];

export const assistantPromptChips = [
  "Bagaimana cara setup environment project Atlas?",
  "Siapa expert untuk payroll settlement error?",
  "Cari worklog handover yang relevan untuk karyawan baru",
  "Apa best practice dokumentasi bug fix?",
];

export const assistantInlineCitations = [
  "Setup environment project Atlas untuk engineer baru dalam 35 menit",
  "Runbook seed data Atlas versi lite untuk onboarding batch April",
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
    excerpt: "Dokumentasi recovery payroll lintas bank, escalation path, dan fallback batch untuk volume transaksi tinggi.",
    tags: ["#handover", "#payroll", "#troubleshooting"],
    collaborators: ["RS", "FM"],
  },
  {
    id: "my-2",
    title: "Checklist onboarding analyst baru minggu pertama",
    status: "Draft",
    privacy: "Private",
    project: "Finance Ops Onboarding",
    updatedAt: "Edited yesterday",
    excerpt: "Panduan akses, worklog wajib baca, dan urutan tugas agar analyst baru tidak bingung di minggu pertama.",
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
    excerpt: "Ringkasan incident, pembelajaran tim, perubahan monitoring, dan keputusan tindak lanjut lintas fungsi.",
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
    excerpt: "Dokumen kerja bersama untuk langkah revoke access, approval owner, dan audit trail saat handover.",
    tags: ["#access", "#security", "#collaboration"],
    collaborators: ["FM", "RS"],
  },
];

export const projectOverview = {
  name: "Project Handover: Payroll Stabilization",
  summary:
    "Project workspace untuk mendokumentasikan proses payroll multi-bank, recovery insiden, dan playbook onboarding anggota tim baru.",
  progress: 72,
  dueDate: "16 Apr 2026",
  team: "8 contributors",
};

export const projectColumns = [
  {
    title: "Not Started",
    tasks: [
      { title: "Rekam walkthrough dashboard reconciliation", owner: "Mira", priority: "Medium" },
      { title: "Tambahkan SOP revoke access vendor", owner: "Dion", priority: "High" },
    ],
  },
  {
    title: "In Progress",
    tasks: [
      { title: "Lengkapi runbook fallback batch transfer", owner: "Rani", priority: "High" },
      { title: "Review metadata tags untuk AI retrieval", owner: "Fikri", priority: "Low" },
    ],
  },
  {
    title: "Completed",
    tasks: [
      { title: "Dokumentasi root cause error settlement", owner: "Kevin", priority: "High" },
      { title: "Checklist onboarding analyst baru", owner: "Nadia", priority: "Medium" },
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
  "Rani menambahkan section baru: 'Escalation matrix'",
  "Fikri memberi komentar pada task metadata AI",
  "Mira menyelesaikan checklist onboarding batch April",
  "Kevin mengunggah lampiran postmortem 502 gateway",
];

export const projectMilestones = [
  { name: "Project overview published", date: "8 Apr", status: "Done" },
  { name: "Critical runbooks complete", date: "11 Apr", status: "In Progress" },
  { name: "Cross-team review", date: "14 Apr", status: "Planned" },
  { name: "Final handover pack", date: "16 Apr", status: "Planned" },
];

export const analyticsSummary = [
  { label: "Annual turnover savings", value: "Rp 182M", detail: "projected for 100 employees" },
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
  "Tim yang memakai template handover mencapai time-to-productivity tercepat",
  "Kategori dengan knowledge gap tertinggi masih berada di Finance Ops dan Vendor Management",
  "Feed dengan sorting 'Relevant to Me' meningkatkan save rate 1.7x dibanding chronological murni",
];
