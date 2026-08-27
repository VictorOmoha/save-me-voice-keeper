const SUPPORT_EMAIL = "victor@omohasolutions.com";

export const buildAccountDeletionSupportHref = (user?: { uid?: string | null; email?: string | null } | null) => {
  const subject = encodeURIComponent("Account deletion request - SaveMe");
  const body = encodeURIComponent(
    `Please help me request deletion of my SaveMe account.\n\nAccount email: ${user?.email || ""}\nAccount ID: ${user?.uid || ""}\n\nI understand support must confirm the request and that opening this email does not itself record or complete deletion.`,
  );
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
};
