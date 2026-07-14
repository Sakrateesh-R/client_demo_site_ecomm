"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setLoading(true);
    const toastId = toast.loading("Updating password...");

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Password updated successfully!", { id: toastId });
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 p-sm-5 rounded-4 shadow-sm" style={{ border: "var(--border-light)" }}>
      <div className="mb-4">
        <h2 className="h4 fw-bold mb-2 text-dark" style={{ fontFamily: "var(--font-heading)" }}>
          Reset Password
        </h2>
        <p className="text-secondary small">Please enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* New Password Field */}
        <div className="mb-3">
          <label className="form-label small fw-semibold text-uppercase text-secondary" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>
            New Password
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
        <button type="submit" disabled={loading} className="btn btn-wix-primary w-100 py-3 d-flex align-items-center justify-content-center">
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Updating...
            </>
          ) : (
            "Update Password"
          )}
        </button>
      </form>
    </div>
  );
}
