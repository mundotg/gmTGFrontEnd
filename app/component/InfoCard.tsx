export const InfoCard = ({
  icon,
  label,
  count,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number | undefined;
  color: string;
}) => (
  <div className={`flex items-center gap-2 text-${color}-600 bg-${color}-50 px-3 py-2 rounded-lg`}>
    {icon}
    <span className="font-medium">{count}</span>
    <span className="text-xs">{label}</span>
  </div>
);