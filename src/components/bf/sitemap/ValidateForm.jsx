import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileCode2, Upload, Search } from "lucide-react";

function isValidUrl(str) {
  try {
    const u = new URL(str.startsWith("http") ? str : `https://${str}`);
    return Boolean(u.hostname && u.hostname.includes(".") && (u.protocol === "http:" || u.protocol === "https:"));
  } catch (e) {
    return false;
  }
}

export default function ValidateForm({ onValidate, loading, prefillUrl }) {
  const [sitemap_url, setUrl] = React.useState(prefillUrl || "");
  const [xml_content, setXml] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [check_http, setCheckHttp] = React.useState(true);
  const [error, setError] = React.useState("");
  const [mode, setMode] = React.useState("url");

  React.useEffect(() => {
    if (prefillUrl) {
      setUrl(prefillUrl);
      setMode("url");
    }
  }, [prefillUrl]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setError("This sitemap exceeds the supported file size (10MB).");
      return;
    }
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => setXml(String(reader.result || ""));
    reader.onerror = () => setError("Could not read the uploaded file.");
    reader.readAsText(f);
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (mode === "url") {
      if (!sitemap_url.trim() || !isValidUrl(sitemap_url)) {
        setError("Please enter a valid sitemap URL.");
        return;
      }
      onValidate({
        sitemap_url: sitemap_url.trim().startsWith("http") ? sitemap_url.trim() : `https://${sitemap_url.trim()}`,
        check_http
      });
    } else {
      if (!xml_content.trim()) {
        setError("Please upload an XML sitemap file.");
        return;
      }
      onValidate({ xml_content, check_http });
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
          <FileCode2 className="h-4 w-4" />
        </span>
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">Validate Sitemap</h3>
      </div>
      <p className="mt-1 text-sm text-slate-500">Check a sitemap for XML errors, broken URLs, redirects, and indexing issues.</p>

      <div className="mt-6 flex gap-2 rounded-lg bg-slate-100 p-1">
        <button type="button" onClick={() => setMode("url")} className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${mode === "url" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>Enter Sitemap URL</button>
        <button type="button" onClick={() => setMode("upload")} className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${mode === "upload" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>Upload XML File</button>
      </div>

      <div className="mt-5 space-y-4">
        {mode === "url" ? (
          <div className="space-y-1.5">
            <Label htmlFor="sm_sitemap_url">Sitemap URL</Label>
            <Input id="sm_sitemap_url" placeholder="https://example.com/sitemap.xml" value={sitemap_url} onChange={(e) => setUrl(e.target.value)} />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>Upload Sitemap (.xml)</Label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600 hover:border-slate-400">
              <Upload className="h-5 w-5 text-slate-400" />
              <span>{fileName || "Choose an XML file…"}</span>
              <input type="file" accept=".xml,text/xml,application/xml" className="hidden" onChange={onFile} />
            </label>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <Checkbox checked={check_http} onCheckedChange={setCheckHttp} /> Check HTTP status of URLs (slower, more thorough)
        </label>
      </div>

      {error && <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <Button type="submit" size="lg" disabled={loading} className="mt-6 w-full">
        <Search className="mr-2 h-4 w-4" /> {loading ? "Validating…" : "Validate Sitemap"}
      </Button>
    </form>
  );
}