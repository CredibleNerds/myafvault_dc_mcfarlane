/** Friendly copy for Better Auth / OAuth callback query errors. */
export function oauthErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  let raw = code.trim();
  try {
    const parsed = JSON.parse(raw) as { message?: string; error?: string };
    raw = parsed.message || parsed.error || raw;
  } catch {
    /* not JSON */
  }
  const key = raw.toLowerCase().replace(/[\s+]+/g, "_");
  const messages: Record<string, string> = {
    email_is_missing:
      "X did not share an email for this account. Try again, or use email sign-in.",
    email_not_found:
      "X did not share an email for this account. Try Continue with X again, or use email sign-in.",
    name_is_missing: "Could not read your name from that account. Try again.",
    id_is_missing: "That sign-in provider did not return an account id. Try again.",
    unable_to_link_account:
      "This Google or X account could not be linked. Sign in with the same method you used before, or use email.",
    account_not_linked:
      "This Google or X login is not linked to your existing account. Use the original sign-in method, or email.",
    account_already_linked_to_different_user:
      "That Google or X account is already used on a different vault login.",
    oauth_code_verification_failed:
      "Sign-in expired or was interrupted. Please try Continue with Google or X again.",
    invalid_code:
      "Sign-in expired. Please try Continue with Google or X again.",
    state_mismatch:
      "Sign-in expired. Please try Continue with Google or X again.",
    user_info_is_missing:
      "Could not load your Google or X profile. Please try again.",
    unable_to_get_user_info:
      "Could not load your Google or X profile. Please try again.",
    signup_disabled: "New accounts cannot be created this way right now.",
    access_denied: "Sign-in was cancelled.",
    invalid_redirect_uri:
      "Google and X are not connected on this website yet. Sign in with email for now.",
    "invalid_redirect_url":
      "Google and X are not connected on this website yet. Sign in with email for now.",
    provider_not_found:
      "Google and X are not connected on this website yet. Sign in with email for now.",
  };
  if (messages[key]) return messages[key];
  if (key.includes("redirect")) {
    return "Google and X are not connected on this website yet. Sign in with email for now.";
  }
  return "Google or X sign-in did not finish. Please try again, or use email.";
}
