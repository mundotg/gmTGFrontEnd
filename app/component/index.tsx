"use client";
import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { Info, AlertTriangle, CheckCircle2, XCircle, ChevronDown, X, Loader2 } from "lucide-react";

// ------------------------------
// 🔄 Spinner (Padrão Oficial)
// ------------------------------
export const Spinner = ({ className }: { className?: string }) => (
  <Loader2 className={clsx("animate-spin text-blue-600", className)} size={24} />
);

// ------------------------------
// 🔘 Button (Padrão Oficial)
// ------------------------------
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export const Button = ({ variant = "primary", className, ...props }: ButtonProps) => {
  const base =
    "px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500/50 border border-transparent",
    secondary:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-300",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50 border border-transparent",
  };

  return (
    <button className={clsx(base, variants[variant], className)} {...props} />
  );
};

// ------------------------------
// 🪟 Modal (Padrão Oficial)
// ------------------------------
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            {title && (
              <h3 className="text-xl font-bold text-gray-900">
                {title}
              </h3>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

// ------------------------------
// 🧾 Card (Padrão Oficial)
// ------------------------------
export const Card = ({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) => (
  <div className={clsx("border border-gray-200 rounded-2xl shadow-sm p-6 bg-white", className)}>
    {title && (
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 pb-2 border-b border-gray-50">
        {title}
      </h2>
    )}
    {children}
  </div>
);

// ------------------------------
// 📝 Textarea (Padrão Oficial)
// ------------------------------
export const Textarea = ({ label, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">
        {label}
      </label>
    )}
    <textarea
      {...props}
      className={clsx(
        "px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 text-sm min-h-[100px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-gray-400",
        className
      )}
    />
  </div>
);

// ------------------------------
// 🔤 Input (Padrão Oficial)
// ------------------------------
export const Input = ({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">
        {label}
      </label>
    )}
    <input
      {...props}
      className={clsx(
        "px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-gray-400",
        className
      )}
    />
  </div>
);

// ------------------------------
// ⬇️ Dropdown (Padrão Oficial)
// ------------------------------
export const Dropdown = ({ label, options, onSelect }: { label: string; options: string[]; onSelect: (option: string) => void }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/50"
      >
        {label}
        <ChevronDown size={16} className={clsx("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => { onSelect(opt); setOpen(false); }}
              className="px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 cursor-pointer text-sm font-medium text-gray-700 transition-colors"
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ------------------------------
// 🧭 Tabs (Padrão Oficial)
// ------------------------------
export const Tabs = ({ tabs }: { tabs: { label: string; content: React.ReactNode }[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={clsx(
              "px-4 py-2.5 text-sm font-bold transition-all relative",
              activeIndex === i
                ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="animate-in fade-in duration-300">{tabs[activeIndex].content}</div>
    </div>
  );
};

// ------------------------------
// ⚠️ Alert (Padrão Oficial)
// ------------------------------
export const Alert = ({ type = "info", title, message, onClose }: { type?: "info" | "success" | "warning" | "error"; title?: string; message: string; onClose?: () => void }) => {
  const Icon = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle }[type];
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    error: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div className={clsx("flex items-start gap-3 p-4 border rounded-2xl shadow-sm transition-all animate-in slide-in-from-top-2", styles[type])}>
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0 opacity-80" />
      <div className="flex-1">
        {title && <p className="font-bold text-sm mb-0.5">{title}</p>}
        <p className="text-sm font-medium leading-relaxed">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-lg transition-colors">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

// ------------------------------
// 🏷️ Badge (Padrão Oficial)
// ------------------------------
export const Badge = ({ text, color = "gray" }: { text: string; color?: "blue" | "green" | "red" | "gray" | "yellow" }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <span className={clsx("px-2 py-0.5 border rounded-md text-[10px] font-bold uppercase tracking-wider shadow-xs", colors[color])}>
      {text}
    </span>
  );
};