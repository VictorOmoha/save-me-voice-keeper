const ALLOWED_POST_AUTH_PATHS = [
  "/dashboard",
  "/all-entries",
  "/insights",
  "/settings",
  "/brain-dump",
  "/subscription",
  "/user-guide",
  "/share",
];

type ResolvePostAuthDestinationInput = {
  next?: string | null;
  requestedPlan?: string | null;
};

const isSafeInternalDestination = (destination: string): boolean => {
  if (!destination.startsWith("/") || destination.startsWith("//")) return false;

  let parsed: URL;
  try {
    parsed = new URL(destination, "https://saveme.space");
  } catch {
    return false;
  }

  if (parsed.origin !== "https://saveme.space") return false;
  return ALLOWED_POST_AUTH_PATHS.includes(parsed.pathname);
};

export const resolvePostAuthDestination = ({
  next,
  requestedPlan,
}: ResolvePostAuthDestinationInput): string => {
  if (next && isSafeInternalDestination(next)) {
    return next;
  }

  if (requestedPlan === "basic" || requestedPlan === "premium") {
    return `/subscription?plan=${requestedPlan}`;
  }

  return "/dashboard";
};
