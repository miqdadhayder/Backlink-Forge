import React from "react";
import { Link } from "react-router-dom";
import { Link2, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import Header from "@/components/bf/Header";
import Footer from "@/components/bf/Footer";

const SUPPORT_EMAIL = "support@backlinkforge.com";

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = React.useState({ name: "", email: "", message: "" });

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ title: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    const subject = encodeURIComponent(`BacklinkForge contact from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    toast({ title: "Opening your email client…", description: "We'll get back to you shortly." });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to home
        </Link>
        <div className="mt-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Link2 className="h-4 w-4" />
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Contact Us</h1>
        </div>

        <p className="mt-4 text-slate-600">
          Have a question about BacklinkForge, a feature request, or feedback? We'd love to hear from you.
          Reach out by email or send us a message using the form below.
        </p>

        <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 hover:border-slate-300">
          <Mail className="h-4 w-4 text-slate-500" />
          <span className="font-medium text-slate-900">{SUPPORT_EMAIL}</span>
        </a>

        <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="c_name">Name</Label>
              <Input id="c_name" value={form.name} onChange={update("name")} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c_email">Email</Label>
              <Input id="c_email" type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c_message">Message</Label>
            <textarea
              id="c_message"
              rows={5}
              value={form.message}
              onChange={update("message")}
              placeholder="How can we help?"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" size="lg" className="w-full">Send Message</Button>
        </form>
      </main>
      <Footer />
    </div>
  );
}