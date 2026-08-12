"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { useTenant } from "@/lib/tenant-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const accent = tenant.accentColor || "#000000";
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full border border-brand-line bg-transparent py-3 pl-11 pr-4 text-brand-ink placeholder:text-brand-muted transition-colors focus:border-brand-ink focus:outline-none dark:border-brand-line  ";

  const fieldIconClass = "absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-muted";

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
              Create Your Account
            </h1>
            <p className="mt-1.5 text-sm text-brand-muted">
              Join us for exclusive offers and faster checkout
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-ink ">
                Full Name
              </label>
              <div className="relative">
                <FiUser className={fieldIconClass} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                  placeholder="Your name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-ink ">
                Email Address
              </label>
              <div className="relative">
                <FiMail className={fieldIconClass} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputClass}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-ink ">
                Password
              </label>
              <div className="relative">
                <FiLock className={fieldIconClass} />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={inputClass}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-ink ">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className={fieldIconClass} />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={inputClass}
                  placeholder="••••••••"
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
                  Create Account
                  <FiArrowRight className="text-lg" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center text-sm text-brand-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold underline underline-offset-4 hover:opacity-80"
              style={{ color: accent }}
            >
              Sign in here
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </>
  );
}
