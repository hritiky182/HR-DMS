import type {
  AuditEntry,
  Employee,
  HRDocument,
  DocumentCategory,
  SignatureState,
} from "./types";

// Deterministic date helpers relative to "now"
const now = new Date();
function daysFromNow(d: number): string {
  const x = new Date(now);
  x.setDate(x.getDate() + d);
  return x.toISOString();
}

const DEPARTMENTS = ["Engineering", "Design", "Sales", "People Ops"];
const AVATAR_COLORS = [
  "oklch(0.75 0.13 30)",
  "oklch(0.72 0.14 155)",
  "oklch(0.7 0.14 250)",
  "oklch(0.75 0.13 60)",
  "oklch(0.7 0.15 320)",
  "oklch(0.72 0.13 195)",
];

const EMPLOYEE_SEED: Array<Omit<Employee, "avatarColor">> = [
  { id: "e1", name: "Amara Okafor", title: "Staff Engineer", department: "Engineering", email: "amara@acme.co", employeeCode: "ACM-0012", joinDate: daysFromNow(-1120), status: "active" },
  { id: "e2", name: "Ben Halvorsen", title: "Product Designer", department: "Design", email: "ben@acme.co", employeeCode: "ACM-0034", joinDate: daysFromNow(-720), status: "active" },
  { id: "e3", name: "Chen Wei", title: "Senior Engineer", department: "Engineering", email: "chen@acme.co", employeeCode: "ACM-0041", joinDate: daysFromNow(-560), status: "active" },
  { id: "e4", name: "Diana Ruiz", title: "Account Executive", department: "Sales", email: "diana@acme.co", employeeCode: "ACM-0052", joinDate: daysFromNow(-410), status: "active" },
  { id: "e5", name: "Ethan Park", title: "Design Lead", department: "Design", email: "ethan@acme.co", employeeCode: "ACM-0061", joinDate: daysFromNow(-1400), status: "active" },
  { id: "e6", name: "Fatima Nasser", title: "Sales Manager", department: "Sales", email: "fatima@acme.co", employeeCode: "ACM-0072", joinDate: daysFromNow(-980), status: "active" },
  { id: "e7", name: "Gabriel Silva", title: "Engineering Manager", department: "Engineering", email: "gabriel@acme.co", employeeCode: "ACM-0080", joinDate: daysFromNow(-1600), status: "active" },
  { id: "e8", name: "Hana Ito", title: "People Ops Lead", department: "People Ops", email: "hana@acme.co", employeeCode: "ACM-0091", joinDate: daysFromNow(-1800), status: "active" },
  { id: "e9", name: "Ivan Petrov", title: "Backend Engineer", department: "Engineering", email: "ivan@acme.co", employeeCode: "ACM-0104", joinDate: daysFromNow(-260), status: "active" },
  { id: "e10", name: "Jessie Cole", title: "Recruiter", department: "People Ops", email: "jessie@acme.co", employeeCode: "ACM-0118", joinDate: daysFromNow(-200), status: "active" },
  { id: "e11", name: "Kenji Watanabe", title: "Data Scientist", department: "Engineering", email: "kenji@acme.co", employeeCode: "ACM-0125", joinDate: daysFromNow(-680), status: "active" },
  { id: "e12", name: "Lila Andersson", title: "Junior Designer", department: "Design", email: "lila@acme.co", employeeCode: "ACM-0133", joinDate: daysFromNow(-95), status: "active" },
  { id: "e13", name: "Marco Bianchi", title: "Account Executive", department: "Sales", email: "marco@acme.co", employeeCode: "ACM-0140", joinDate: daysFromNow(-1240), status: "exited" },
  { id: "e14", name: "Nadia Haddad", title: "Frontend Engineer", department: "Engineering", email: "nadia@acme.co", employeeCode: "ACM-0148", joinDate: daysFromNow(-540), status: "active" },
  { id: "e15", name: "Oliver Grant", title: "SDR", department: "Sales", email: "oliver@acme.co", employeeCode: "ACM-0156", joinDate: daysFromNow(-70), status: "active" },
  { id: "e16", name: "Priya Menon", title: "Compliance Analyst", department: "People Ops", email: "priya@acme.co", employeeCode: "ACM-0163", joinDate: daysFromNow(-880), status: "active" },
  { id: "e17", name: "Quinn Foster", title: "Designer", department: "Design", email: "quinn@acme.co", employeeCode: "ACM-0171", joinDate: daysFromNow(-330), status: "exited" },
  { id: "e18", name: "Rahul Verma", title: "Platform Engineer", department: "Engineering", email: "rahul@acme.co", employeeCode: "ACM-0179", joinDate: daysFromNow(-1050), status: "active" },
];

export const EMPLOYEES: Employee[] = EMPLOYEE_SEED.map((e, i) => ({
  ...e,
  avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
  assignedManagerId: e.department === "Engineering" ? "e7" : e.department === "Sales" ? "e6" : e.department === "Design" ? "e5" : "e8",
}));

let docSeq = 1;
function makeDoc(
  employeeId: string,
  category: DocumentCategory,
  filename: string,
  opts: {
    uploadedDays: number;
    expiresInDays?: number | null;
    uploader?: string;
    sig?: SignatureState;
    signer?: string;
    versions?: number;
    sizeKb?: number;
  }
): HRDocument {
  const uploadedAt = daysFromNow(-opts.uploadedDays);
  const uploader = opts.uploader ?? "Hana Ito";
  const versions = Math.max(1, opts.versions ?? 1);
  const id = `d${docSeq++}`;
  return {
    id,
    employeeId,
    category,
    filename,
    sizeKb: opts.sizeKb ?? 240 + ((docSeq * 37) % 800),
    uploadedAt,
    uploadedBy: uploader,
    expiresAt: opts.expiresInDays === null || opts.expiresInDays === undefined ? undefined : daysFromNow(opts.expiresInDays),
    signatureState: opts.sig ?? "not_required",
    signer: opts.signer,
    signatureSentAt: opts.sig && opts.sig !== "not_required" ? daysFromNow(-opts.uploadedDays + 1) : undefined,
    signatureEvents:
      opts.sig === "signed"
        ? [
            { actor: uploader, action: "sent", at: daysFromNow(-opts.uploadedDays + 1) },
            { actor: opts.signer ?? "Employee", action: "viewed", at: daysFromNow(-opts.uploadedDays + 2) },
            { actor: opts.signer ?? "Employee", action: "signed", at: daysFromNow(-opts.uploadedDays + 3), ip: "10.0.4.22", device: "Chrome / macOS" },
          ]
        : opts.sig === "viewed"
        ? [
            { actor: uploader, action: "sent", at: daysFromNow(-opts.uploadedDays + 1) },
            { actor: opts.signer ?? "Employee", action: "viewed", at: daysFromNow(-opts.uploadedDays + 2) },
          ]
        : opts.sig === "sent"
        ? [{ actor: uploader, action: "sent", at: daysFromNow(-opts.uploadedDays + 1) }]
        : [],
    versions: Array.from({ length: versions }, (_, v) => ({
      version: v + 1,
      uploadedAt: daysFromNow(-opts.uploadedDays - (versions - v - 1) * 45),
      uploadedBy: uploader,
      filename,
      sizeKb: 240 + v * 20,
    })),
  };
}

export const DOCUMENTS: HRDocument[] = [
  // Amara - complete
  makeDoc("e1", "offer_letter", "Offer_Letter_Amara_Okafor.pdf", { uploadedDays: 1120, sig: "signed", signer: "Amara Okafor" }),
  makeDoc("e1", "contract", "Employment_Contract_v3.pdf", { uploadedDays: 400, expiresInDays: 380, sig: "signed", signer: "Amara Okafor", versions: 3 }),
  makeDoc("e1", "performance_review", "H1_2026_Review_Amara.pdf", { uploadedDays: 40 }),
  makeDoc("e1", "compliance", "Data_Protection_Training.pdf", { uploadedDays: 300, expiresInDays: 65 }),
  makeDoc("e1", "payroll", "Payroll_Amara_June2026.pdf", { uploadedDays: 15 }),
  makeDoc("e1", "leave", "Parental_Leave_Request.pdf", { uploadedDays: 90, sig: "signed", signer: "Amara Okafor" }),

  // Ben - expiring visa
  makeDoc("e2", "offer_letter", "Offer_Letter_Ben.pdf", { uploadedDays: 720, sig: "signed", signer: "Ben Halvorsen" }),
  makeDoc("e2", "contract", "Employment_Contract.pdf", { uploadedDays: 720, sig: "signed", signer: "Ben Halvorsen" }),
  makeDoc("e2", "compliance", "Work_Visa_H1B.pdf", { uploadedDays: 400, expiresInDays: 18 }), // expiring soon
  makeDoc("e2", "compliance", "NDA_Signed.pdf", { uploadedDays: 720, sig: "signed", signer: "Ben Halvorsen" }),
  makeDoc("e2", "performance_review", "H2_2025_Review_Ben.pdf", { uploadedDays: 180 }),

  // Chen - expired cert
  makeDoc("e3", "offer_letter", "Offer_Chen.pdf", { uploadedDays: 560, sig: "signed", signer: "Chen Wei" }),
  makeDoc("e3", "contract", "Contract_Chen.pdf", { uploadedDays: 560, expiresInDays: -12, sig: "signed", signer: "Chen Wei" }), // expired
  makeDoc("e3", "compliance", "Security_Certification.pdf", { uploadedDays: 380, expiresInDays: -30 }), // expired
  makeDoc("e3", "payroll", "Payroll_Chen_June2026.pdf", { uploadedDays: 15 }),

  // Diana - pending signature
  makeDoc("e4", "offer_letter", "Offer_Diana.pdf", { uploadedDays: 410, sig: "signed", signer: "Diana Ruiz" }),
  makeDoc("e4", "contract", "Sales_Commission_Amendment.pdf", { uploadedDays: 5, sig: "sent", signer: "Diana Ruiz" }),
  makeDoc("e4", "performance_review", "Q2_2026_Review.pdf", { uploadedDays: 20, sig: "viewed", signer: "Diana Ruiz" }),
  makeDoc("e4", "compliance", "Sales_Ethics_Training.pdf", { uploadedDays: 200, expiresInDays: 165 }),

  // Ethan
  makeDoc("e5", "offer_letter", "Offer_Ethan.pdf", { uploadedDays: 1400, sig: "signed", signer: "Ethan Park" }),
  makeDoc("e5", "contract", "Contract_Ethan_v2.pdf", { uploadedDays: 700, expiresInDays: 800, sig: "signed", signer: "Ethan Park", versions: 2 }),
  makeDoc("e5", "compliance", "IP_Assignment.pdf", { uploadedDays: 1400, sig: "signed", signer: "Ethan Park" }),
  makeDoc("e5", "performance_review", "H1_2026_Review.pdf", { uploadedDays: 45 }),

  // Fatima
  makeDoc("e6", "offer_letter", "Offer_Fatima.pdf", { uploadedDays: 980, sig: "signed", signer: "Fatima Nasser" }),
  makeDoc("e6", "contract", "Manager_Contract.pdf", { uploadedDays: 500, expiresInDays: 260, sig: "signed", signer: "Fatima Nasser" }),
  makeDoc("e6", "compliance", "Anti_Bribery_Training.pdf", { uploadedDays: 340, expiresInDays: 25 }),
  makeDoc("e6", "leave", "Vacation_July_2026.pdf", { uploadedDays: 8, sig: "sent", signer: "Fatima Nasser" }),

  // Gabriel
  makeDoc("e7", "offer_letter", "Offer_Gabriel.pdf", { uploadedDays: 1600, sig: "signed", signer: "Gabriel Silva" }),
  makeDoc("e7", "contract", "Contract_Gabriel_v4.pdf", { uploadedDays: 200, expiresInDays: 500, sig: "signed", signer: "Gabriel Silva", versions: 4 }),
  makeDoc("e7", "compliance", "Manager_Training_Cert.pdf", { uploadedDays: 400, expiresInDays: -5 }), // expired
  makeDoc("e7", "performance_review", "H1_2026_Review_Gabriel.pdf", { uploadedDays: 40 }),

  // Hana
  makeDoc("e8", "offer_letter", "Offer_Hana.pdf", { uploadedDays: 1800, sig: "signed", signer: "Hana Ito" }),
  makeDoc("e8", "contract", "Contract_Hana.pdf", { uploadedDays: 900, sig: "signed", signer: "Hana Ito" }),
  makeDoc("e8", "compliance", "GDPR_Training.pdf", { uploadedDays: 100, expiresInDays: 260 }),

  // Ivan - INCOMPLETE (missing compliance)
  makeDoc("e9", "offer_letter", "Offer_Ivan.pdf", { uploadedDays: 260, sig: "signed", signer: "Ivan Petrov" }),
  makeDoc("e9", "contract", "Contract_Ivan.pdf", { uploadedDays: 260, sig: "sent", signer: "Ivan Petrov" }),

  // Jessie
  makeDoc("e10", "offer_letter", "Offer_Jessie.pdf", { uploadedDays: 200, sig: "signed", signer: "Jessie Cole" }),
  makeDoc("e10", "contract", "Contract_Jessie.pdf", { uploadedDays: 200, sig: "signed", signer: "Jessie Cole" }),
  makeDoc("e10", "compliance", "Recruiter_Ethics.pdf", { uploadedDays: 180, expiresInDays: 90 }),

  // Kenji - visa expired
  makeDoc("e11", "offer_letter", "Offer_Kenji.pdf", { uploadedDays: 680, sig: "signed", signer: "Kenji Watanabe" }),
  makeDoc("e11", "contract", "Contract_Kenji.pdf", { uploadedDays: 680, sig: "signed", signer: "Kenji Watanabe" }),
  makeDoc("e11", "compliance", "Work_Visa.pdf", { uploadedDays: 400, expiresInDays: -45 }), // expired
  makeDoc("e11", "performance_review", "Annual_Review_2025.pdf", { uploadedDays: 210 }),

  // Lila — new hire, mostly missing
  makeDoc("e12", "offer_letter", "Offer_Lila.pdf", { uploadedDays: 95, sig: "signed", signer: "Lila Andersson" }),
  makeDoc("e12", "contract", "Contract_Lila.pdf", { uploadedDays: 2, sig: "sent", signer: "Lila Andersson" }),

  // Marco - exited
  makeDoc("e13", "offer_letter", "Offer_Marco.pdf", { uploadedDays: 1240, sig: "signed", signer: "Marco Bianchi" }),
  makeDoc("e13", "contract", "Contract_Marco.pdf", { uploadedDays: 1240, sig: "signed", signer: "Marco Bianchi" }),
  makeDoc("e13", "compliance", "Exit_Interview.pdf", { uploadedDays: 60, sig: "signed", signer: "Marco Bianchi" }),

  // Nadia
  makeDoc("e14", "offer_letter", "Offer_Nadia.pdf", { uploadedDays: 540, sig: "signed", signer: "Nadia Haddad" }),
  makeDoc("e14", "contract", "Contract_Nadia.pdf", { uploadedDays: 540, expiresInDays: 190, sig: "signed", signer: "Nadia Haddad" }),
  makeDoc("e14", "compliance", "Security_Training.pdf", { uploadedDays: 90, expiresInDays: 275 }),
  makeDoc("e14", "leave", "Sick_Leave_May.pdf", { uploadedDays: 45 }),

  // Oliver — brand new, incomplete
  makeDoc("e15", "offer_letter", "Offer_Oliver.pdf", { uploadedDays: 70, sig: "signed", signer: "Oliver Grant" }),

  // Priya
  makeDoc("e16", "offer_letter", "Offer_Priya.pdf", { uploadedDays: 880, sig: "signed", signer: "Priya Menon" }),
  makeDoc("e16", "contract", "Contract_Priya.pdf", { uploadedDays: 880, sig: "signed", signer: "Priya Menon" }),
  makeDoc("e16", "compliance", "Compliance_Officer_Cert.pdf", { uploadedDays: 200, expiresInDays: 8 }), // expiring very soon
  makeDoc("e16", "performance_review", "H1_2026_Priya.pdf", { uploadedDays: 40 }),
  makeDoc("e16", "payroll", "Payroll_Priya_June.pdf", { uploadedDays: 15 }),

  // Quinn - exited
  makeDoc("e17", "offer_letter", "Offer_Quinn.pdf", { uploadedDays: 330, sig: "signed", signer: "Quinn Foster" }),
  makeDoc("e17", "contract", "Contract_Quinn.pdf", { uploadedDays: 330, sig: "signed", signer: "Quinn Foster" }),
  makeDoc("e17", "compliance", "Exit_NDA.pdf", { uploadedDays: 30, sig: "declined", signer: "Quinn Foster" }),

  // Rahul
  makeDoc("e18", "offer_letter", "Offer_Rahul.pdf", { uploadedDays: 1050, sig: "signed", signer: "Rahul Verma" }),
  makeDoc("e18", "contract", "Contract_Rahul_v2.pdf", { uploadedDays: 500, expiresInDays: 720, sig: "signed", signer: "Rahul Verma", versions: 2 }),
  makeDoc("e18", "compliance", "SOC2_Training.pdf", { uploadedDays: 100, expiresInDays: 45 }),
  makeDoc("e18", "performance_review", "H1_2026_Rahul.pdf", { uploadedDays: 40 }),
  makeDoc("e18", "payroll", "Payroll_Rahul_June.pdf", { uploadedDays: 15 }),
];

export const AUDIT_LOG: AuditEntry[] = [
  { id: "a1", at: daysFromNow(-0.02), actor: "Hana Ito", actorRole: "admin", action: "upload", employeeId: "e1", documentId: "d5", documentName: "Payroll_Amara_June2026.pdf" },
  { id: "a2", at: daysFromNow(-0.1), actor: "Amara Okafor", actorRole: "employee", action: "download", employeeId: "e1", documentName: "Employment_Contract_v3.pdf" },
  { id: "a3", at: daysFromNow(-0.3), actor: "Jessie Cole", actorRole: "manager", action: "upload", employeeId: "e15", documentName: "Offer_Oliver.pdf" },
  { id: "a4", at: daysFromNow(-0.5), actor: "Ben Halvorsen", actorRole: "employee", action: "signature_signed", employeeId: "e2", documentName: "NDA_Signed.pdf" },
  { id: "a5", at: daysFromNow(-1), actor: "Hana Ito", actorRole: "admin", action: "reminder_sent", employeeId: "e11", documentName: "Work_Visa.pdf", meta: "Expired 45 days ago" },
  { id: "a6", at: daysFromNow(-1.2), actor: "Hana Ito", actorRole: "admin", action: "edit", employeeId: "e7", documentName: "Contract_Gabriel_v4.pdf", meta: "Updated expiry date" },
  { id: "a7", at: daysFromNow(-1.5), actor: "Fatima Nasser", actorRole: "manager", action: "signature_sent", employeeId: "e6", documentName: "Vacation_July_2026.pdf" },
  { id: "a8", at: daysFromNow(-2), actor: "Diana Ruiz", actorRole: "employee", action: "view", employeeId: "e4", documentName: "Q2_2026_Review.pdf" },
  { id: "a9", at: daysFromNow(-2.4), actor: "Hana Ito", actorRole: "admin", action: "upload", employeeId: "e18", documentName: "Payroll_Rahul_June.pdf" },
  { id: "a10", at: daysFromNow(-3), actor: "Hana Ito", actorRole: "admin", action: "replace", employeeId: "e1", documentName: "Employment_Contract_v3.pdf", meta: "v2 → v3" },
  { id: "a11", at: daysFromNow(-3.5), actor: "Quinn Foster", actorRole: "employee", action: "signature_declined", employeeId: "e17", documentName: "Exit_NDA.pdf" },
  { id: "a12", at: daysFromNow(-4), actor: "Jessie Cole", actorRole: "manager", action: "upload", employeeId: "e12", documentName: "Contract_Lila.pdf" },
  { id: "a13", at: daysFromNow(-5), actor: "Hana Ito", actorRole: "admin", action: "delete", employeeId: "e13", documentName: "Old_Payroll_2023.pdf" },
  { id: "a14", at: daysFromNow(-6), actor: "Priya Menon", actorRole: "employee", action: "download", employeeId: "e16", documentName: "Compliance_Officer_Cert.pdf" },
  { id: "a15", at: daysFromNow(-7), actor: "Hana Ito", actorRole: "admin", action: "reminder_sent", employeeId: "e2", documentName: "Work_Visa_H1B.pdf", meta: "Expires in 18 days" },
  { id: "a16", at: daysFromNow(-8), actor: "Gabriel Silva", actorRole: "manager", action: "upload", employeeId: "e9", documentName: "Contract_Ivan.pdf" },
  { id: "a17", at: daysFromNow(-10), actor: "Hana Ito", actorRole: "admin", action: "edit", employeeId: "e5", documentName: "Contract_Ethan_v2.pdf", meta: "Updated title" },
  { id: "a18", at: daysFromNow(-12), actor: "Rahul Verma", actorRole: "employee", action: "signature_signed", employeeId: "e18", documentName: "SOC2_Training.pdf" },
  { id: "a19", at: daysFromNow(-14), actor: "Hana Ito", actorRole: "admin", action: "upload", employeeId: "e16", documentName: "H1_2026_Priya.pdf" },
  { id: "a20", at: daysFromNow(-16), actor: "Chen Wei", actorRole: "employee", action: "view", employeeId: "e3", documentName: "Security_Certification.pdf" },
  { id: "a21", at: daysFromNow(-20), actor: "Hana Ito", actorRole: "admin", action: "signature_sent", employeeId: "e4", documentName: "Sales_Commission_Amendment.pdf" },
  { id: "a22", at: daysFromNow(-25), actor: "Hana Ito", actorRole: "admin", action: "upload", employeeId: "e11", documentName: "Annual_Review_2025.pdf" },
];

// Current signed-in mock user per role (used for permission demos)
export const CURRENT_USER_BY_ROLE = {
  admin: { name: "Hana Ito", employeeId: "e8" },
  manager: { name: "Gabriel Silva", employeeId: "e7" },
  employee: { name: "Amara Okafor", employeeId: "e1" },
} as const;
