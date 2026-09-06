import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";
import { validatePassword } from "@/lib/authValidation";

export default function ResetPassword() {
  const navigate = useNavigate(); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (event) => { event.preventDefault(); const passwordError = validatePassword(password); if (passwordError) return setError(passwordError); if (password !== confirm) return setError("Passwords do not match."); setLoading(true); const { error: authError } = await supabase.auth.updateUser({ password }); if (authError) setError(authError.message); else navigate("/login", { replace: true }); setLoading(false); };
  return <AuthLayout title="New password" subtitle="Choose a strong password" footer={<Link to="/login" className="text-primary font-medium hover:underline">Back to login</Link>}>{error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</div>}<form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="password">New password</Label><Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="confirm">Confirm password</Label><Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div><Button type="submit" className="h-12 w-full" disabled={loading}>{loading ? "Updating..." : "Update password"}</Button></form></AuthLayout>;
}
