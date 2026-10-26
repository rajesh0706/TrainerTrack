import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { SESSION_STATUS_LABELS, SESSION_TYPE_LABELS } from "@/features/attendance/labels";
import { PdfBarChart, PdfLineChart } from "@/features/reports/pdf/charts";
import type {
  AttendanceReport,
  BuiltReport,
  BusinessReport,
  ProgressReport,
  ReportMeta,
  RosterReport,
} from "@/features/reports/types";
import { formatDate, formatPercent, formatTime, signedNumber } from "@/lib/format";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  brand: { flexDirection: "row", alignItems: "center" },
  logoWrap: { marginRight: 10 },
  logo: { width: 36, height: 36, objectFit: "contain" },
  business: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  muted: { fontSize: 9, color: "#6b7280" },
  h2: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  cell: { fontSize: 8 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#6b7280",
  },
  photoRow: { flexDirection: "row", marginTop: 8 },
  photoWrap: { marginRight: 12 },
  photo: { width: 220, height: 280 },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  kpi: {
    width: "23%",
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#f9fafb",
  },
  kpiLabel: { fontSize: 8, color: "#6b7280", marginBottom: 3 },
  kpiValue: { fontSize: 12, fontFamily: "Helvetica-Bold" },
});

function Header({ meta }: { meta: ReportMeta }) {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        {meta.branding.logoDataUrl ? (
          <View style={styles.logoWrap}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
            <Image src={meta.branding.logoDataUrl} style={styles.logo} />
          </View>
        ) : null}
        <View>
          <Text style={styles.business}>{meta.branding.businessName}</Text>
          <Text style={styles.muted}>TrainerTrack</Text>
        </View>
      </View>
      <View>
        <Text style={styles.title}>{meta.title}</Text>
        <Text style={styles.muted}>
          {formatDate(meta.from)} – {formatDate(meta.to)}
        </Text>
        <Text style={styles.muted}>Generated {meta.generatedOn}</Text>
      </View>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>Confidential health data · TrainerTrack</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

function AttendancePages({ report }: { report: AttendanceReport }) {
  return (
    <Page size="A4" style={styles.page} wrap>
      <Header meta={report.meta} />
      <Text style={styles.muted}>
        {report.clientName} · {report.clientEmail}
      </Text>
      <View style={styles.kpiRow}>
        <Kpi label="Scheduled" value={String(report.summary.scheduled)} />
        <Kpi label="Attended" value={String(report.summary.attended)} />
        <Kpi label="Missed" value={String(report.summary.missed)} />
        <Kpi label="Late" value={String(report.summary.late)} />
        <Kpi label="Cancelled" value={String(report.summary.cancelled)} />
        <Kpi label="Attendance" value={formatPercent(report.summary.rate)} />
      </View>
      <Text style={styles.h2}>Month-by-month</Text>
      {report.months.length > 0 ? (
        <PdfBarChart
          items={report.months.map((month) => ({
            label: month.month,
            value: month.summary.rate ?? 0,
          }))}
        />
      ) : null}
      <View style={styles.tableHeader}>
        <Text style={[styles.cell, { width: "18%" }]}>Month</Text>
        <Text style={[styles.cell, { width: "14%" }]}>Sched.</Text>
        <Text style={[styles.cell, { width: "14%" }]}>Attended</Text>
        <Text style={[styles.cell, { width: "14%" }]}>Missed</Text>
        <Text style={[styles.cell, { width: "14%" }]}>Late</Text>
        <Text style={[styles.cell, { width: "14%" }]}>Cancel</Text>
        <Text style={[styles.cell, { width: "12%" }]}>%</Text>
      </View>
      {report.months.map((month) => (
        <View key={month.month} style={styles.tableRow}>
          <Text style={[styles.cell, { width: "18%" }]}>{month.month}</Text>
          <Text style={[styles.cell, { width: "14%" }]}>{month.summary.scheduled}</Text>
          <Text style={[styles.cell, { width: "14%" }]}>{month.summary.attended}</Text>
          <Text style={[styles.cell, { width: "14%" }]}>{month.summary.missed}</Text>
          <Text style={[styles.cell, { width: "14%" }]}>{month.summary.late}</Text>
          <Text style={[styles.cell, { width: "14%" }]}>{month.summary.cancelled}</Text>
          <Text style={[styles.cell, { width: "12%" }]}>
            {formatPercent(month.summary.rate)}
          </Text>
        </View>
      ))}
      <Text style={styles.h2}>Sessions</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.cell, { width: "22%" }]}>Date</Text>
        <Text style={[styles.cell, { width: "12%" }]}>Time</Text>
        <Text style={[styles.cell, { width: "12%" }]}>Min</Text>
        <Text style={[styles.cell, { width: "18%" }]}>Type</Text>
        <Text style={[styles.cell, { width: "18%" }]}>Status</Text>
        <Text style={[styles.cell, { width: "18%" }]}>Notes</Text>
      </View>
      {report.sessions.map((session, index) => (
        <View key={`${session.session_date}-${index}`} style={styles.tableRow} wrap={false}>
          <Text style={[styles.cell, { width: "22%" }]}>
            {formatDate(session.session_date)}
          </Text>
          <Text style={[styles.cell, { width: "12%" }]}>
            {formatTime(session.start_time)}
          </Text>
          <Text style={[styles.cell, { width: "12%" }]}>{session.duration_min}</Text>
          <Text style={[styles.cell, { width: "18%" }]}>
            {SESSION_TYPE_LABELS[session.type]}
          </Text>
          <Text style={[styles.cell, { width: "18%" }]}>
            {SESSION_STATUS_LABELS[session.status]}
          </Text>
          <Text style={[styles.cell, { width: "18%" }]}>{session.notes ?? ""}</Text>
        </View>
      ))}
      {report.sessions.length === 0 ? (
        <Text style={styles.muted}>No sessions in this range.</Text>
      ) : null}
      <Footer />
    </Page>
  );
}

function ProgressPages({ report }: { report: ProgressReport }) {
  return (
    <Page size="A4" style={styles.page} wrap>
      <Header meta={report.meta} />
      <Text style={styles.muted}>
        {report.clientName} · {report.clientEmail}
      </Text>
      <Text style={styles.h2}>Starting vs current</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.cell, { width: "22%" }]}>Metric</Text>
        <Text style={[styles.cell, { width: "18%" }]}>Start</Text>
        <Text style={[styles.cell, { width: "18%" }]}>Current</Text>
        <Text style={[styles.cell, { width: "20%" }]}>Change</Text>
        <Text style={[styles.cell, { width: "22%" }]}>% change</Text>
      </View>
      {report.metrics.map((metric) => (
        <View key={metric.key} style={styles.tableRow}>
          <Text style={[styles.cell, { width: "22%" }]}>{metric.label}</Text>
          <Text style={[styles.cell, { width: "18%" }]}>
            {metric.start == null ? "—" : `${metric.start} ${metric.unit}`}
          </Text>
          <Text style={[styles.cell, { width: "18%" }]}>
            {metric.current == null ? "—" : `${metric.current} ${metric.unit}`}
          </Text>
          <Text style={[styles.cell, { width: "20%" }]}>
            {signedNumber(metric.change)} {metric.unit}
          </Text>
          <Text style={[styles.cell, { width: "22%" }]}>
            {formatPercent(metric.percent, 1)}
          </Text>
        </View>
      ))}
      {report.series.slice(0, 3).map((item) => (
        <View key={item.key} wrap={false}>
          <Text style={styles.h2}>{item.label}</Text>
          <PdfLineChart points={item.points} />
        </View>
      ))}
      {report.photos.length > 0 ? (
        <View>
          <Text style={styles.h2}>Before / after</Text>
          <View style={styles.photoRow}>
            {report.photos.map((photo) => (
              <View key={photo.taken_on + photo.label} style={styles.photoWrap}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
                <Image src={photo.dataUrl} style={styles.photo} />
                <Text style={styles.muted}>
                  {photo.label} · {formatDate(photo.taken_on)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      {report.notes ? (
        <View>
          <Text style={styles.h2}>Trainer notes</Text>
          <Text>{report.notes}</Text>
        </View>
      ) : null}
      <Footer />
    </Page>
  );
}

function RosterPages({ report }: { report: RosterReport }) {
  return (
    <Page size="A4" style={styles.page} orientation="landscape" wrap>
      <Header meta={report.meta} />
      <View style={styles.tableHeader}>
        <Text style={[styles.cell, { width: "22%" }]}>Client</Text>
        <Text style={[styles.cell, { width: "18%" }]}>Email</Text>
        <Text style={[styles.cell, { width: "8%" }]}>Sess.</Text>
        <Text style={[styles.cell, { width: "9%" }]}>Attended</Text>
        <Text style={[styles.cell, { width: "8%" }]}>Missed</Text>
        <Text style={[styles.cell, { width: "10%" }]}>%</Text>
        <Text style={[styles.cell, { width: "25%" }]}>Last session</Text>
      </View>
      {report.rows.map((row) => (
        <View key={row.client_id} style={styles.tableRow} wrap={false}>
          <Text style={[styles.cell, { width: "22%" }]}>{row.full_name}</Text>
          <Text style={[styles.cell, { width: "18%" }]}>{row.email}</Text>
          <Text style={[styles.cell, { width: "8%" }]}>{row.total}</Text>
          <Text style={[styles.cell, { width: "9%" }]}>{row.attended}</Text>
          <Text style={[styles.cell, { width: "8%" }]}>{row.missed}</Text>
          <Text style={[styles.cell, { width: "10%" }]}>{formatPercent(row.rate)}</Text>
          <Text style={[styles.cell, { width: "25%" }]}>
            {formatDate(row.last_session)}
          </Text>
        </View>
      ))}
      <Footer />
    </Page>
  );
}

function BusinessPages({ report }: { report: BusinessReport }) {
  return (
    <Page size="A4" style={styles.page} wrap>
      <Header meta={report.meta} />
      <View style={styles.kpiRow}>
        <Kpi label="Total sessions" value={String(report.totalSessions)} />
        <Kpi label="Active clients" value={String(report.activeClients)} />
        <Kpi label="Avg attendance" value={formatPercent(report.averageAttendance)} />
        <Kpi label="New clients" value={String(report.newClients)} />
        <Kpi label="Archived" value={String(report.archivedClients)} />
      </View>
      <Text style={styles.h2}>Attendance by month</Text>
      <PdfBarChart
        items={report.months.map((month) => ({
          label: month.month,
          value: month.summary.present,
        }))}
      />
      <Footer />
    </Page>
  );
}

export function ReportPdfDocument({ report }: { report: BuiltReport }) {
  return (
    <Document
      title={
        report.kind === "summary" ? report.attendance.meta.title : report.meta.title
      }
      author="TrainerTrack"
    >
      {report.kind === "attendance" ? <AttendancePages report={report} /> : null}
      {report.kind === "progress" ? <ProgressPages report={report} /> : null}
      {report.kind === "summary" ? (
        <>
          <AttendancePages report={report.attendance} />
          <ProgressPages report={report.progress} />
        </>
      ) : null}
      {report.kind === "clients-attendance" ? <RosterPages report={report} /> : null}
      {report.kind === "business" ? <BusinessPages report={report} /> : null}
    </Document>
  );
}
