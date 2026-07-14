"use client";

import React, { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    const toastId = toast.loading("Authenticating...");

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Failed to retrieve user session.");
      }

      // Fetch user role for redirection
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        toast.success("Welcome back!", { id: toastId });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
        return;
      }

      toast.success(`Welcome back, ${profile.role.replace("_", " ")}!`, { id: toastId });

      // Determine redirect path
      const nextPath = searchParams.get("next");
      const STAFF_ROLES = ["super_admin", "admin", "store_manager", "inventory_manager", "marketing_manager"];

      let redirectUrl = "/";
      if (nextPath) {
        redirectUrl = nextPath;
      } else if (STAFF_ROLES.includes(profile.role)) {
        redirectUrl = "/admin";
      }

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 500);
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during login.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 p-sm-5 rounded-4 shadow-sm" style={{ border: "var(--border-light)" }}>
      <div className="mb-4">
        <h2 className="h4 fw-bold mb-2 text-dark" style={{ fontFamily: "var(--font-heading)" }}>
          Sign In
        </h2>
        <p className="text-secondary small">Access your secure atelier portal.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Email Field */}
        <div className="mb-3">
          <label className="form-label small fw-semibold text-uppercase text-secondary" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>
            Email Address
          </label>
          <input
            type="email"
            disabled={loading}
            className={`form-control wix-input ${errors.email ? "is-invalid" : ""}`}
            placeholder="name@example.com"
            {...register("email")}
          />
          {errors.email && <div className="invalid-feedback small mt-1">{errors.email.message}</div>}
        </div>

        {/* Password Field */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label small fw-semibold text-uppercase text-secondary m-0" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>
              Password
            </label>
            <Link href="/auth/forgot-password" className="small hover-link text-decoration-none text-primary fw-semibold" style={{ fontSize: "0.8rem" }}>
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            disabled={loading}
            className={`form-control wix-input ${errors.password ? "is-invalid" : ""}`}
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && <div className="invalid-feedback small mt-1">{errors.password.message}</div>}
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={loading} className="btn btn-wix-primary w-100 py-3 mb-3 d-flex align-items-center justify-content-center">
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Verifying...
            </>
          ) : (
            "Sign In"
          )}
        </button>

        {/* Signup redirection */}
        <div className="text-center mt-3">
          <span className="small text-secondary">Don&apos;t have an account? </span>
          <Link href="/auth/signup" className="small fw-bold text-decoration-none text-primary">
            Create one
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white p-4 p-sm-5 rounded-4 shadow-sm text-center py-5" style={{ border: "var(--border-light)" }}>
          <div className="spinner-border text-primary my-4" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-secondary small">Loading Secure Portal...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
