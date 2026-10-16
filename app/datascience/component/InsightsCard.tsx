import React from "react";
import { Lightbulb } from "lucide-react";

interface InsightsCardProps {
  insights: string[];
}

export function InsightsCard({ insights }: InsightsCardProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-2">
        <Lightbulb size={16} /> Insights automáticos
      </div>
      <ul className="space-y-1">
        {insights.map((ins, i) => (
          <li key={i} className="text-sm text-amber-900 flex gap-2">
            <span>•</span>
            {ins}
          </li>
        ))}
      </ul>
    </section>
  );
}
