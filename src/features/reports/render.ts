import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import { reportToCsv, reportTitle } from "@/features/reports/csv";
import { ReportPdfDocument } from "@/features/reports/pdf/document";
import { reportToXlsx, xlsxFilename } from "@/features/reports/xlsx";
import type { ReportFormat } from "@/features/reports/schemas";
import type { BuiltReport } from "@/features/reports/types";
import { reportRange } from "@/features/reports/csv";

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function reportFilename(report: BuiltReport, format: ReportFormat) {
  const meta = reportRange(report);
  const base = `${slug(reportTitle(report))}-${meta.from}-to-${meta.to}`;
  if (format === "pdf") return `${base}.pdf`;
  if (format === "xlsx") return xlsxFilename(report);
  return `${base}.csv`;
}

export async function serializeReport(report: BuiltReport, format: ReportFormat) {
  if (format === "csv") {
    return {
      body: reportToCsv(report),
      contentType: "text/csv; charset=utf-8",
      filename: reportFilename(report, format),
    };
  }
  if (format === "xlsx") {
    return {
      body: reportToXlsx(report),
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: reportFilename(report, format),
    };
  }

  const buffer = await renderToBuffer(
    createElement(ReportPdfDocument, { report }) as unknown as ReactElement<DocumentProps>,
  );
  return {
    body: Buffer.from(buffer),
    contentType: "application/pdf",
    filename: reportFilename(report, format),
  };
}
