// Client-side export utilities for the Backlink Quality Checker.
import { jsPDF } from "jspdf";

function csvCell(v) {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function reportToCsv(report) {
  const rows = [
    ["Field", "Value"],
    ["Backlink URL", report.inputs.backlink_url],
    ["Your Website URL", report.inputs.website_url],
    ["Target Page URL", report.inputs.target_url || ""],
    ["Anchor Text (provided)", report.inputs.anchor_text || ""],
    ["Overall Score", report.overall_score],
    ["Classification", report.classification],
    ["Risk Level", report.risk_level],
    ["Recommendation", report.recommendation.action],
    ["Data Confidence", report.data_confidence],
    ["Source URL (final)", report.source.final_url],
    ["HTTP Status", report.source.http_status],
    ["Source Domain", report.source.domain],
    ["Link Found", report.link.found ? "Yes" : "No"],
    ["Link Attribute", report.link.attribute],
    ["Detected Anchor", report.link.anchor || ""],
    ["Link Placement", report.link.placement || ""],
    ["Word Count", report.source.word_count],
    ["Outbound Links", report.source.outbound_links],
    ["Analyzed At", report.analyzed_at]
  ];
  (report.factors || []).forEach((f) => {
    rows.push([`Factor: ${f.name}`, f.score == null ? f.status : `${f.score}/100 (${f.status})`]);
  });
  (report.risk_signals || []).forEach((r) => {
    rows.push([`Risk: ${r.label}`, `${r.severity} — ${r.explanation}`]);
  });
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

export function bulkToCsv(items) {
  const rows = [
    ["Source Domain", "Source URL", "Target Page", "Anchor", "Link Type", "Quality Score", "Classification", "Risk", "Recommendation", "Data Confidence"]
  ];
  items.forEach((it) => {
    const r = it.report || it;
    rows.push([
      r.source?.domain || "",
      r.inputs?.backlink_url || "",
      r.inputs?.target_url || "",
      r.link?.anchor || r.inputs?.anchor_text || "",
      r.link?.attribute || "",
      r.overall_score ?? "",
      r.classification || "",
      r.risk_level || "",
      r.recommendation?.action || "",
      r.data_confidence || ""
    ]);
  });
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename, content) {
  download(filename, content, "text/csv;charset=utf-8;");
}

export function downloadReportPdf(report) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 48;
  const brand = "BacklinkForge";
  const accent = [15, 23, 42];

  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, W, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(brand, 40, y);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Backlink Quality Report", W - 40, y, { align: "right" });
  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(40, y, W - 40, y);
  y += 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(`${report.overall_score} / 100`, 40, y);
  doc.setFontSize(13);
  doc.text(report.classification, 180, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Risk: ${report.risk_level}   |   Recommendation: ${report.recommendation.action}   |   Data confidence: ${report.data_confidence}`, 40, y);
  y += 24;

  const section = (title) => {
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(title, 40, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
  };

  const kv = (label, value) => {
    if (y > 780) { doc.addPage(); y = 48; }
    doc.setTextColor(100, 116, 139);
    doc.text(label, 40, y);
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(String(value == null ? "" : value), W - 160);
    doc.text(lines, 160, y);
    y += Math.max(14, lines.length * 12);
  };

  section("Link Details");
  kv("Backlink URL", report.inputs.backlink_url);
  kv("Your Website", report.inputs.website_url);
  kv("Target Page", report.inputs.target_url || "—");
  kv("Anchor (provided)", report.inputs.anchor_text || "—");
  kv("Source URL (final)", report.source.final_url);
  kv("HTTP Status", report.source.http_status);
  kv("Source Domain", report.source.domain);
  kv("Link Found", report.link.found ? "Yes" : "No");
  kv("Link Attribute", report.link.attribute);
  kv("Detected Anchor", report.link.anchor || "—");
  kv("Link Placement", report.link.placement || "—");
  kv("Word Count", report.source.word_count);
  kv("Analyzed At", report.analyzed_at);

  section("Quality Breakdown");
  (report.factors || []).forEach((f) => {
    const val = f.available ? `${f.score}/100 — ${f.status}` : f.status;
    kv(f.name, val);
  });

  section("Risk Analysis");
  if (!report.risk_signals || report.risk_signals.length === 0) {
    kv("Signals", "No suspicious or low-quality signals detected.");
  } else {
    report.risk_signals.forEach((r) => {
      kv(`${r.label} (${r.severity})`, r.explanation);
    });
  }

  section("Recommendation");
  kv(report.recommendation.action, report.recommendation.text);

  section("Data Confidence & Methodology");
  kv("Data Confidence", report.data_confidence);
  (report.methodology || []).forEach((m) => {
    kv(m.factor, m.included ? `Weight ${m.weight}% — included` : "Not available — excluded from score");
  });

  y += 16;
  if (y > 780) { doc.addPage(); y = 48; }
  doc.setDrawColor(226, 232, 240);
  doc.line(40, y, W - 40, y);
  y += 16;
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Generated by BacklinkForge. Scores are computed only from signals that could be verified or", 40, y);
  doc.text("explicitly marked as estimated. No authority, traffic, or spam-score metrics are fabricated.", 40, y + 12);

  doc.save(`backlink-quality-report-${Date.now()}.pdf`);
}