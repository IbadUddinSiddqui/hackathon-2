"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { useTenant } from "@/lib/tenant-provider";

export default function LoginPage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const accent = tenant.accentColor || "#000000";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <>
      <Header />
      <div className="flex min-h-screen items-center justify-center bg-brand-surface px-4 py-16 text-brand-ink ">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md border border-brand-line bg-brand-surface p-9 dark:bg-brand-surface-alt"
        >
          <div className="mb-8 text-center">
            <p className="text-eyebrow mb-3" style={{ color: accent }}>
              {tenant.name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome Back
            </h1>
            <p className="mt-1.5 text-sm text-brand-muted">
              Sign in to your account to continue
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 border border-brand-bad/40 bg-brand-bad-soft px-4 py-3 text-center text-sm font-medium text-brand-bad"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-ink ">
                Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-brand-line bg-transparent py-3 pl-11 pr-4 text-brand-ink placeholder:text-brand-muted transition-colors focus:border-brand-ink focus:outline-none dark:border-brand-line  "
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-ink ">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-brand-line bg-transparent py-3 pl-11 pr-4 text-brand-ink placeholder:text-brand-muted transition-colors focus:border-brand-ink focus:outline-none dark:border-brand-line  "
                  required
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 bg-brand-ink py-3.5 text-sm font-semibold uppercase tracking-[0.15em] text-brand-ink-inverse transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-brand-ink-inverse dark:text-brand-ink"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <>
                  Sign In
                  <FiArrowRight className="text-lg" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center text-sm text-brand-muted">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold underline underline-offset-4 hover:opacity-80"
              style={{ color: accent }}
            >
              Create one here
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </>
  );
}
