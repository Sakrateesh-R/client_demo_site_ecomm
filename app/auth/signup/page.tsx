"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setLoading(true);
    const toastId = toast.loading("Creating your account...");

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: "customer",
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      // Automatically sign in the user to bypass email verification
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 500);
        return;
      }

      toast.success("Account created and logged in!", { id: toastId });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (err: any) {
      toast.error(err.message || "Failed to create account.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-4 p-sm-5 rounded-4 shadow-sm text-center" style={{ border: "var(--border-light)" }}>
        <div className="mb-4 text-primary">
          <i className="bi bi-envelope-check-fill fs-1"></i>
        </div>
        <h2 className="h4 fw-bold text-dark mb-3" style={{ fontFamily: "var(--font-heading)" }}>
          Verify Email
        </h2>
        <p className="text-secondary small mb-4">
          We have sent a verification link to your email address. Please click the link to activate your account.
        </p>
        <Link href="/auth/login" className="btn btn-wix-primary w-100 py-3">
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 p-sm-5 rounded-4 shadow-sm" style={{ border: "var(--border-light)" }}>
      <div className="mb-4">
        <h2 className="h4 fw-bold mb-2 text-dark" style={{ fontFamily: "var(--font-heading)" }}>
          Create Account
        </h2>
        <p className="text-secondary small">Join us and experience the luxury of high-end handwoven textiles.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Full Name Field */}
        <div className="mb-3">
          <label className="form-label small fw-semibold text-uppercase text-secondary" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>
            Full Name
          </label>
          <input
            type="text"
            disabled={loading}
            className={`form-control wix-input ${errors.fullName ? "is-invalid" : ""}`}
            placeholder="John Doe"
            {...register("fullName")}
          />
          {errors.fullName && <div className="invalid-feedback small mt-1">{errors.fullName.message}</div>}
        </div>

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
        <div className="mb-3">
          <label className="form-label small fw-semibold text-uppercase text-secondary" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>
            Password
          </label>
          <input
            type="password"
            disabled={loading}
            className={`form-control wix-input ${errors.password ? "is-invalid" : ""}`}
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && <div className="invalid-feedback small mt-1">{errors.password.message}</div>}
        </div>

        {/* Confirm Password Field */}
        <div className="mb-4">
          <label className="form-label small fw-semibold text-uppercase text-secondary" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>
            Confirm Password
          </label>
          <input
            type="password"
            disabled={loading}
            className={`form-control wix-input ${errors.confirmPassword ? "is-invalid" : ""}`}
            placeholder="••••••••"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && <div className="invalid-feedback small mt-1">{errors.confirmPassword.message}</div>}
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={loading} className="btn btn-wix-primary w-100 py-3 mb-3 d-flex align-items-center justify-content-center">
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Registering...
            </>
          ) : (
            "Create Account"
          )}
        </button>

        {/* Login redirection */}
        <div className="text-center mt-3">
          <span className="small text-secondary">Already have an account? </span>
          <Link href="/auth/login" className="small fw-bold text-decoration-none text-primary">
            Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}
