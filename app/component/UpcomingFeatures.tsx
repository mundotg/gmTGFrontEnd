import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';

export type UpcomingFeature = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  href?: string;
  badge?: string;
  onClick?: () => void;
};

type UpcomingFeaturesProps = {
  upcomingFeatures: UpcomingFeature[];
  onOpenRoadmapModal?: () => void;
};

export default function UpcomingFeatures({ upcomingFeatures, onOpenRoadmapModal }: UpcomingFeaturesProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center tracking-tight">
          <Sparkles className="w-4 h-4 text-amber-500 mr-2.5" />
          Módulos Avançados & Em Expansão
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
          {upcomingFeatures.length} Módulos em Expansão
        </span>
      </div>

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1 content-start">
        {upcomingFeatures.map((feature, index) => {
          const Icon = feature.icon;
          const isLink = Boolean(feature.href);

          const CardContent = (
            <div className="flex items-start space-x-3.5 p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-amber-50/40 hover:border-amber-200/80 transition-all duration-200 h-full group cursor-pointer">
              <div className="p-2.5 bg-white border border-gray-200/60 rounded-xl shadow-xs group-hover:scale-105 group-hover:border-amber-300 transition-all shrink-0">
                <Icon className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-semibold text-sm text-gray-900 group-hover:text-amber-800 transition-colors truncate">
                    {feature.title}
                  </h4>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {feature.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {feature.badge}
                      </span>
                    )}
                    {isLink && (
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          );

          if (feature.href) {
            return (
              <Link key={index} href={feature.href} className="block h-full">
                {CardContent}
              </Link>
            );
          }

          return (
            <div
              key={index}
              onClick={feature.onClick || onOpenRoadmapModal}
              className="h-full"
            >
              {CardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}