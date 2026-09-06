import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [loading, setLoading] = useState(false);
  const submit = async (event) => { event.preventDefault(); setLoading(true); await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/reset-password` }); setSent(true); setLoading(false); };
  return <AuthLayout title="Reset password" subtitle="We will send a recovery link" footer={<Link to="/login" className="text-primary font-medium hover:underline">Back to login</Link>}>{sent ? <p className="text-center text-sm">If an account exists, check your email for a password reset link.</p> : <form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><Button type="submit" className="h-12 w-full" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button></form>}</AuthLayout>;
}
