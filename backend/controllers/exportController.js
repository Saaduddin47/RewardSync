const ExcelJS = require("exceljs");
const IncentiveClaim = require("../models/IncentiveClaim");
const BGV = require("../models/BGV");
const Joiner = require("../models/Joiner");
const User = require("../models/User");

const TRACKER_START = new Date("2025-04-01T00:00:00.000Z");
const TRACKER_END = new Date("2026-03-31T23:59:59.999Z");

const trackerMonths = [
  { key: "2025-04", label: "Apr" },
  { key: "2025-05", label: "May" },
  { key: "2025-06", label: "Jun" },
  { key: "2025-07", label: "Jul" },
  { key: "2025-08", label: "Aug" },
  { key: "2025-09", label: "Sep" },
  { key: "2025-10", label: "Oct" },
  { key: "2025-11", label: "Nov" },
  { key: "2025-12", label: "Dec" },
  { key: "2026-01", label: "Jan" },
  { key: "2026-02", label: "Feb" },
  { key: "2026-03", label: "Mar" },
];

const trackerQuarters = [
  { key: "Q1", monthKeys: ["2025-04", "2025-05", "2025-06"] },
  { key: "Q2", monthKeys: ["2025-07", "2025-08", "2025-09"] },
  { key: "Q3", monthKeys: ["2025-10", "2025-11", "2025-12"] },
  { key: "Q4", monthKeys: ["2026-01", "2026-02", "2026-03"] },
];

const toMonthKey = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const exportReport = async (req, res) => {
  const claims = await IncentiveClaim.find()
    .populate("recruiterId", "name empId doj")
    .populate("joinerId", "joinerId joinerName joinDate client skill portal");

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Incentive Report");

  sheet.columns = [
    { header: "Team Member Name", key: "teamMemberName", width: 24 },
    { header: "Incentive Type", key: "incentiveType", width: 16 },
    { header: "Claim Status", key: "claimStatus", width: 16 },
    { header: "Comment", key: "comment", width: 48 },
    { header: "EMP ID", key: "empId", width: 12 },
    { header: "Joiner ID", key: "joinerId", width: 16 },
    { header: "EMPNA", key: "empna", width: 20 },
    { header: "DOJ", key: "empdoj", width: 16 },
    { header: "Client", key: "client", width: 18 },
    { header: "Skill", key: "skill", width: 16 },
    { header: "Portal", key: "portal", width: 16 },
    { header: "BGV", key: "bgv", width: 12 },
    { header: "Month Paid", key: "monthPaid", width: 12 },
    { header: "Incentive Amount", key: "incentiveAmount", width: 18 },
  ];

  for (const claim of claims) {
    const bgv = await BGV.findOne({ joinerId: claim.joinerId?._id });
    const incentiveStatus =
      claim.status === "approved" && claim.managerNote !== "Approved — incentive withheld due to recovery deficit"
        ? "approved"
        : "rejected";

    sheet.addRow({
      teamMemberName: claim.recruiterId?.name || "",
      incentiveType: claim.incentiveType,
      claimStatus: claim.status,
      comment: claim.managerNote || "",
      empId: claim.recruiterId?.empId || "",
      joinerId: claim.joinerId?.joinerId || "",
      empna: claim.joinerId?.joinerName || claim.joinerId?.name || "",
      empdoj: claim.joinerId?.joinDate ? new Date(claim.joinerId.joinDate).toISOString().slice(0, 10) : "",
      client: claim.joinerId?.client || "",
      skill: claim.joinerId?.skill || "",
      portal: claim.joinerId?.portal || "",
      bgv: bgv?.bgvStatus || "pending",
      monthPaid: claim.claimMonth || "",
      incentiveAmount: claim.status === "approved" && incentiveStatus === "approved" ? claim.incentiveAmount : "",
    });
  }

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=incentive-report.xlsx");
  await workbook.xlsx.write(res);
  res.end();
};

const exportIncentiveTracker = async (req, res) => {
  const [recruiters, joiners, rejectedForRecovery] = await Promise.all([
    User.find({ role: "recruiter", isActive: true }).select("name empId quarterlyTarget").sort({ name: 1 }).lean(),
    Joiner.find({ joinDate: { $gte: TRACKER_START, $lte: TRACKER_END } }).select("recruiterId joinDate").lean(),
    IncentiveClaim.find({
      managerNote: /(Recovery deficit active|incentive withheld due to recovery deficit)/i,
      createdAt: { $gte: TRACKER_START, $lte: TRACKER_END },
    })
      .select("recruiterId createdAt")
      .lean(),
  ]);

  const joinerCountMap = new Map();
  for (const joiner of joiners) {
    const monthKey = toMonthKey(joiner.joinDate);
    if (!monthKey) continue;
    const key = `${joiner.recruiterId?.toString()}|${monthKey}`;
    joinerCountMap.set(key, (joinerCountMap.get(key) || 0) + 1);
  }

  const recoveryQuarterMap = new Map();
  for (const claim of rejectedForRecovery) {
    const monthKey = toMonthKey(claim.createdAt);
    const quarter = trackerQuarters.find((item) => item.monthKeys.includes(monthKey));
    if (!quarter) continue;
    const key = `${claim.recruiterId?.toString()}|${quarter.key}`;
    recoveryQuarterMap.set(key, (recoveryQuarterMap.get(key) || 0) + 1);
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Incentive Tracker");

  const totalColumns = 27;
  sheet.mergeCells(1, 1, 1, totalColumns);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = "IncenTrack : APR'25 - MAR'26";
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: "center" };

  const headers = ["Team Member", "Target Joiners", ...trackerMonths.map((month) => month.label)];
  for (const quarter of trackerQuarters) {
    headers.push(`${quarter.key} DEL`, `${quarter.key} RECOV`, `${quarter.key} CF`);
  }
  headers.push("Carry Forward Total");

  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true };

  for (const recruiter of recruiters) {
    const row = [recruiter.name, recruiter.quarterlyTarget || 0];
    const monthlyCounts = {};

    for (const month of trackerMonths) {
      const count = joinerCountMap.get(`${recruiter._id.toString()}|${month.key}`) || 0;
      monthlyCounts[month.key] = count;
      row.push(count);
    }

    const quarterTarget = recruiter.quarterlyTarget || 0;
    let carryForward = 0;
    for (const quarter of trackerQuarters) {
      const actual = quarter.monthKeys.reduce((sum, monthKey) => sum + (monthlyCounts[monthKey] || 0), 0);
      const deficit = Math.max(quarterTarget - actual, 0);
      const recovery = recoveryQuarterMap.get(`${recruiter._id.toString()}|${quarter.key}`) || 0;
      carryForward = Math.max(carryForward + deficit - recovery, 0);
      row.push(deficit, recovery, carryForward);
    }

    row.push(carryForward);
    sheet.addRow(row);
  }

  sheet.columns = headers.map((header, index) => ({
    header,
    key: `col_${index}`,
    width: index < 2 ? 20 : 12,
  }));

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=incentive-tracker.xlsx");
  await workbook.xlsx.write(res);
  res.end();
};

module.exports = {
  exportReport,
  exportIncentiveTracker,
};
