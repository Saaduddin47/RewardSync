import { Card } from "./ui/card";

const StatCard = ({ title, value, subtitle }) => (
  <Card>
    <p className="text-sm text-foreground/70">{title}</p>
    <h3 className="mt-1 text-2xl font-semibold text-foreground">{value}</h3>
    {subtitle && <p className="mt-1 text-xs text-foreground/70">{subtitle}</p>}
  </Card>
);

export default StatCard;
