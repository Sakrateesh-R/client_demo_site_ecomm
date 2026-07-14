"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true);
    const toastId = toast.loading("Sending recovery email...");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Recovery link sent!", { id: toastId });
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send recovery email.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-4 p-sm-5 rounded-4 shadow-sm text-center" style={{ border: "var(--border-light)" }}>
        <div className="mb-4 text-primary">
          <i className="bi bi-send-check-fill fs-1"></i>
        </div>
        <h2 className="h4 fw-bold text-dark mb-3" style={{ fontFamily: "var(--font-heading)" }}>
          Email Sent
        </h2>
        <p className="text-secondary small mb-4">
          Please check your inbox. If the email exists in our system, you will receive a link to reset your password.
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
          Forgot Password
        </h2>
        <p className="text-secondary small">Enter your email address and we will send you a recovery link.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Email Field */}
        <div className="mb-4">
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

        {/* Submit Button */}
        <button type="submit" disabled={loading} className="btn btn-wix-primary w-100 py-3 mb-3 d-flex align-items-center justify-content-center">
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Sending Link...
            </>
          ) : (
            "Send Reset Link"
          )}
        </button>

        {/* Back to Login */}
        <div className="text-center mt-3">
          <Link href="/auth/login" className="small fw-bold text-decoration-none text-primary">
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}
