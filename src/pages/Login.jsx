import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (event) => { event.preventDefault(); setError(""); setLoading(true); const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }); if (authError) setError("Invalid email or password."); else navigate(safeReturnTo(), { replace: true }); setLoading(false); };
  const google = async () => { await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } }); };
  return <AuthLayout title="Welcome back" subtitle="Log in to your account" footer={<>Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link></>}>
    <Button variant="outline" className="mb-6 h-12 w-full" onClick={google}>Continue with Google</Button>
    {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</div>}
    <form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="email"><Mail className="mr-2 inline h-4 w-4" />Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="password"><Lock className="mr-2 inline h-4 w-4" />Password</Label><Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div><Link to="/forgot-password" className="block text-sm text-primary hover:underline">Forgot password?</Link><Button type="submit" className="h-12 w-full" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Logging in...</> : "Log in"}</Button></form>
  </AuthLayout>;
}
