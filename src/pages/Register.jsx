import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";
import { validatePassword } from "@/lib/authValidation";

export default function Register() {
  const navigate = useNavigate(); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (event) => { event.preventDefault(); setError(""); setMessage(""); const passwordError = validatePassword(password); if (passwordError) return setError(passwordError); if (password !== confirm) return setError("Passwords do not match."); setLoading(true); const { data, error: authError } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/login` } }); if (authError) setError(authError.message); else if (!data.session) setMessage("Check your email to verify your account, then log in."); else navigate("/dashboard", { replace: true }); setLoading(false); };
  return <AuthLayout title="Create your account" subtitle="Sign up to get started" footer={<>Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link></>}>
    {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</div>}{message && <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700" role="status">{message}</div>}
    <form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="confirm">Confirm password</Label><Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div><Button type="submit" className="h-12 w-full" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : "Create account"}</Button></form>
  </AuthLayout>;
}
