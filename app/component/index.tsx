"use client";
import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

// ------------------------------
// 🔄 Spinner
// ------------------------------
export const Spinner = () => (
  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500 border-opacity-70" />
);

// ------------------------------
// 🔘 Button
// ------------------------------
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export const Button = ({ variant = "primary", className, ...props }: ButtonProps) => {
  const base =
    "px-4 py-2 rounded font-medium transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-400",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600",
    danger:
      "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-400",
  };

  return (
    <button className={clsx(base, variants[variant], className)} {...props} />
  );
};

// ------------------------------
// 🪟 Modal
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl relative">
        {title && (
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        )}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

// ------------------------------
// 🧾 Card
// ------------------------------
export interface CardProps {
  title?: string;
  children: React.ReactNode;
}

export const Card = ({ title, children }: CardProps) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 bg-white dark:bg-gray-800">
    {title && (
      <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
        {title}
      </h2>
    )}
    {children}
  </div>
);

// ------------------------------
// 📝 Textarea
// ------------------------------
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = ({ label, ...props }: TextareaProps) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
    )}
    <textarea
      {...props}
      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  </div>
);

// ------------------------------
// 🔤 Input
// ------------------------------
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = ({ label, ...props }: InputProps) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
    )}
    <input
      {...props}
      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  </div>
);

// ------------------------------
// ⬇️ Dropdown
// ------------------------------
export interface DropdownProps {
  label: string;
  options: string[];
  onSelect: (option: string) => void;
}

export const Dropdown = ({ label, options, onSelect }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
      >
        {label}
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          {options.map((option) => (
            <div
              key={option}
              onClick={() => {
                onSelect(option);
                setOpen(false);
              }}
              className="px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer text-gray-700 dark:text-gray-200"
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ------------------------------
// 🧭 Tabs
// ------------------------------
export interface Tab {
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
}

export const Tabs = ({ tabs }: TabsProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <div className="flex border-b border-gray-300 dark:border-gray-700 mb-4">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={clsx(
              "px-4 py-2 font-medium transition-colors",
              activeIndex === i
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[activeIndex].content}</div>
    </div>
  );
};


interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  message: string;
  onClose?: () => void;
}

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  message,
  onClose,
}) => {
  const Icon = iconMap[type];

  const styles = {
    info: "bg-info-bg border-info-border text-info-text",
    success: "bg-success-bg border-success-border text-success-text",
    warning: "bg-warning-bg border-warning-border text-warning-text",
    error: "bg-error-bg border-error-border text-error-text",
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 border rounded-xl shadow-sm ${styles[type]} transition-all`}
    >
      <Icon className="w-5 h-5 mt-1 flex-shrink-0" />
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <p className="text-sm">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 text-sm opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
};



// ------------------------------
// 🏷️ Badge
// ------------------------------
export interface BadgeProps {
  text: string;
  color?: "blue" | "green" | "red" | "gray";
}

export const Badge = ({ text, color = "gray" }: BadgeProps) => {
  const colors = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    gray: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-semibold ${colors[color]}`}
    >
      {text}
    </span>
  );
};
