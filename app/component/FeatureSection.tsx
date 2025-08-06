import React from 'react';

interface Feature {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>;
  title: string;
  description: string;
}

interface FeatureSectionProps {
  features: Feature[];
}

export default function FeatureSection({ features }: FeatureSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
          Funcionalidades Disponíveis
        </h3>
      </div>
      <div className="p-6 space-y-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg">
                <Icon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{feature.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}