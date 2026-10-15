import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StatCardType } from "../clouds/componets";

interface StatsCardsProps {
  stats: StatCardType[];
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const content = (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">{stat.value}</p>
                {stat.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {stat.badge}
                  </span>
                )}
              </div>
              {stat.description && (
                <p className="text-xs text-gray-400">{stat.description}</p>
              )}
            </div>
            <div className="relative">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-200">
                <Icon className={`w-6 h-6 ${stat.color || "text-blue-600"}`} />
              </div>
              {stat.href && (
                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                </div>
              )}
            </div>
          </div>
        );

        if (stat.href) {
          return (
            <Link
              key={index}
              href={stat.href}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/80 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group block"
            >
              {content}
            </Link>
          );
        }

        return (
          <div
            key={index}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/80 group"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
