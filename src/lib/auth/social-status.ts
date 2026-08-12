import { createServerFn } from "@tanstack/react-start";

function present(key: string): boolean {
  const v = process.env[key]?.trim();
  return Boolean(v);
}

export type SocialAuthStatus = {
  google: boolean;
  twitter: boolean;
};

/** Which native Google / X apps are configured on this deployment. */
export const getSocialAuthStatus = createServerFn({ method: "GET" }).handler(
  (): SocialAuthStatus => ({
    google: present("GOOGLE_CLIENT_ID") && present("GOOGLE_CLIENT_SECRET"),
    twitter: present("TWITTER_CLIENT_ID") && present("TWITTER_CLIENT_SECRET"),
  }),
);
