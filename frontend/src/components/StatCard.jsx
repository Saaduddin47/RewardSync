import { Card } from "./ui/card";

const StatCard = ({ title, value, subtitle }) => (
  <Card>
    <p className="text-sm text-slate-500">{title}</p>
    <h3 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{value}</h3>
    {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
  </Card>
);

export default StatCard;
