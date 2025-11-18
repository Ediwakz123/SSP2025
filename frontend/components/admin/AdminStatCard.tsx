import { ReactNode } from "react";

export default function AdminStatCard({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border flex items-center gap-4">
      <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
        {icon}
      </div>

      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
