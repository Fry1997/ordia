import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

const PasswordProvider = Password({
  profile(params) {
    const email = String(params.email ?? "").trim().toLowerCase();
    const name = String(params.name ?? "").trim();

    if (!email || !email.includes("@")) {
      throw new ConvexError("Enter a valid email address.");
    }
    if (name.length < 2) {
      throw new ConvexError("Enter your name.");
    }

    return { email, name };
  },
  validatePasswordRequirements(password: string) {
    if (password.length < 10) {
      throw new ConvexError("Your password must be at least 10 characters.");
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [PasswordProvider],
});
