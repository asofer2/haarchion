export const SITE_ADMIN_NAME = "תמיר סופר";
export const SITE_ADMIN_EMAIL = "tamirsofer@gmail.com";
export const SITE_ADMIN_PERSON_ID = "tmyr-svpr";

export function isAdminPerson(person?: { id?: string; name?: string } | null): boolean {
  if (!person) return false;
  if (person.id === SITE_ADMIN_PERSON_ID) return true;
  return (person.name || "").replace(/\s+/g, " ").trim() === SITE_ADMIN_NAME;
}

const ADMIN_NAMES = new Set([
  "תמיר סופר",
  "tamir sofer",
  "tamir soffer",
]);

const ADMIN_EMAILS = new Set([SITE_ADMIN_EMAIL]);

function extraAdminEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeName(value?: string): string {
  return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function isSiteAdmin(user?: {
  uid?: string;
  displayName?: string;
  email?: string;
} | null): boolean {
  if (!user?.uid) return false;
  const name = normalizeName(user.displayName);
  if (name && ADMIN_NAMES.has(name)) return true;
  if (name.includes("tamir") && name.includes("sofer")) return true;
  if ((user.displayName || "").includes("תמיר") && (user.displayName || "").includes("סופר")) {
    return true;
  }
  const email = (user.email || "").trim().toLowerCase();
  if (email && (ADMIN_EMAILS.has(email) || extraAdminEmails().includes(email))) {
    return true;
  }
  return false;
}
