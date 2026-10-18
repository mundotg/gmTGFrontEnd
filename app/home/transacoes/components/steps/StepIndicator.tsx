// components/steps/StepIndicator.tsx
import { CheckCircle2 } from "lucide-react";

interface StepIndicatorProps {
    currentStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
    const steps = [
        { number: 1, title: "Conexões" },
        { number: 2, title: "Tabelas" },
        { number: 3, title: "Mapeamento" },
        { number: 4, title: "Execução" }
    ];

    const Step: React.FC<{ stepNumber: number; title: string; isActive: boolean; isCompleted: boolean }> = 
        ({ stepNumber, title, isActive, isCompleted }) => (
        <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                isCompleted 
                    ? "bg-green-500 border-green-500" 
                    : isActive 
                        ? "bg-blue-500 border-blue-500" 
                        : "bg-white border-gray-300"
            }`}>
                {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                ) : (
                    <span className={`font-bold text-sm ${isActive ? "text-white" : "text-gray-400"}`}>
                        {stepNumber}
                    </span>
                )}
            </div>
            <div className="ml-3 hidden md:block">
                <div className={`text-sm font-semibold ${isActive ? "text-gray-900" : "text-gray-500"}`}>
                    {title}
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
                {steps.map((step, index) => (
                    <div key={step.number} className="flex items-center flex-1">
                        <Step
                            stepNumber={step.number}
                            title={step.title}
                            isActive={currentStep === step.number}
                            isCompleted={currentStep > step.number}
                        />
                        {index < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 md:mx-4 ${
                                currentStep > step.number ? "bg-green-500" : "bg-gray-300"
                            }`} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};