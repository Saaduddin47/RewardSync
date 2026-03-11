const ExcelJS = require("exceljs");
const IncentiveClaim = require("../models/IncentiveClaim");
const BGV = require("../models/BGV");

const exportReport = async (req, res) => {
  const claims = await IncentiveClaim.find()
    .populate("recruiterId", "name empId doj")
    .populate("joinerId", "client skill portal");

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Incentive Report");

  sheet.columns = [
    { header: "Team Member Name", key: "teamMemberName", width: 24 },
    { header: "Incentive Type", key: "incentiveType", width: 16 },
    { header: "EMP ID", key: "empId", width: 12 },
    { header: "EMPNA", key: "empna", width: 20 },
    { header: "EMPDOJ", key: "empdoj", width: 16 },
    { header: "Client", key: "client", width: 18 },
    { header: "Skill", key: "skill", width: 16 },
    { header: "Portal", key: "portal", width: 16 },
    { header: "BGV", key: "bgv", width: 12 },
    { header: "Month Paid", key: "monthPaid", width: 12 },
    { header: "Incentive Amount", key: "incentiveAmount", width: 18 },
  ];

  for (const claim of claims) {
    const bgv = await BGV.findOne({ joinerId: claim.joinerId?._id });
    sheet.addRow({
      teamMemberName: claim.recruiterId?.name || "",
      incentiveType: claim.incentiveType,
      empId: claim.recruiterId?.empId || "",
      empna: claim.recruiterId?.name || "",
      empdoj: claim.recruiterId?.doj ? new Date(claim.recruiterId.doj).toISOString().slice(0, 10) : "",
      client: claim.joinerId?.client || "",
      skill: claim.joinerId?.skill || "",
      portal: claim.joinerId?.portal || "",
      bgv: bgv?.bgvStatus || "pending",
      monthPaid: claim.monthPaid || "",
      incentiveAmount: claim.incentiveAmount,
    });
  }

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=incentive-report.xlsx");
  await workbook.xlsx.write(res);
  res.end();
};

module.exports = {
  exportReport,
};
