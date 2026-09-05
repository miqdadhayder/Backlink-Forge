import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Mail } from "lucide-react";

export default function TemplateManager({ templates, onReload }) {
  const { toast } = useToast();
  const [editing, setEditing] = React.useState(null);
  const [name, setName] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const startNew = () => {
    setEditing("new");
    setName(""); setSubject(""); setBody("");
  };

  const startEdit = (t) => {
    setEditing(t);
    setName(t.name); setSubject(t.subject); setBody(t.body);
  };

  const cancel = () => {
    setEditing(null);
    setName(""); setSubject(""); setBody("");
  };

  const save = async () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      toast({ title: "All fields required", description: "Name, subject, and body are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing === "new") {
        await base44.entities.EmailTemplate.create({ name, subject, body });
        toast({ title: "Template created" });
      } else {
        await base44.entities.EmailTemplate.update(editing.id, { name, subject, body });
        toast({ title: "Template updated" });
      }
      cancel();
      onReload();
    } catch (e) {
      toast({ title: "Could not save", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete "${t.name}"?`)) return;
    try {
      await base44.entities.EmailTemplate.delete(t.id);
      toast({ title: "Template deleted" });
      onReload();
    } catch (e) {
      toast({ title: "Could not delete", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Outreach Templates</h3>
        {editing === null && (
          <Button size="sm" onClick={startNew}><Plus className="mr-2 h-4 w-4" /> New Template</Button>
        )}
      </div>

      {editing !== null && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-1.5">
            <Label className="text-xs">Template name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Guest post pitch" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              placeholder="Write your outreach email. Use {website}, {url}, {niche}, {da}, {traffic}, {type} as placeholders filled from each opportunity."
            />
          </div>
          <p className="text-xs text-slate-500">
            Placeholders: {"{website}"}, {"{url}"}, {"{niche}"}, {"{da}"}, {"{traffic}"}, {"{type}"} — filled automatically per opportunity.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={cancel}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save template"}</Button>
          </div>
        </div>
      )}

      {editing === null && (
        templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Mail className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No templates yet. Create one to speed up outreach.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {templates.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-slate-900">{t.name}</p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(t)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                  </div>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-600">{t.subject}</p>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-slate-500">{t.body}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}