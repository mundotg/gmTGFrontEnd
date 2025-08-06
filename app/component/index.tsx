"use client";
import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

export const Spinner = () => (
  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary border-opacity-70" />
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export const Button = ({ variant = "primary", className, ...props }: ButtonProps) => {
  const base = "px-4 py-2 rounded font-medium transition-colors";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover",
    secondary: "bg-secondary text-secondary-text hover:bg-secondary-hover",
    danger: "bg-danger text-white hover:bg-danger-hover",
  };

  return (
    <button className={clsx(base, variants[variant], className)} {...props} />
  );
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded p-6 w-full max-w-md shadow-lg relative">
        {title && <h3 className="text-xl font-bold mb-4">{title}</h3>}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-muted hover:text-danger"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export interface CardProps {
  title?: string;
  children: React.ReactNode;
}

export const Card = ({ title, children }: CardProps) => (
  <div className="border border-muted-border rounded shadow-sm p-4 bg-white">
    {title && <h2 className="text-lg font-semibold mb-2">{title}</h2>}
    {children}
  </div>
);

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = ({ label, ...props }: TextareaProps) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-muted-text">{label}</label>}
    <textarea
      {...props}
      className="px-3 py-2 border border-muted-border rounded focus:outline-none focus:ring-2 focus:ring-primary-ring"
    />
  </div>
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = ({ label, ...props }: InputProps) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-muted-text">{label}</label>}
    <input
      {...props}
      className="px-3 py-2 border border-muted-border rounded focus:outline-none focus:ring-2 focus:ring-primary-ring"
    />
  </div>
);




import React from 'react';


interface Option {
  value: string;
  label: string;
}

interface LabeledSelectProps2 {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

export const LabeledSelect2: React.FC<LabeledSelectProps2> = ({
  label,
  value,
  onChange,
  options,
  placeholder = '-- Selecione uma opção --',
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};


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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
        className="px-4 py-2 bg-secondary text-secondary-text rounded hover:bg-secondary-hover"
      >
        {label}
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-40 bg-white border rounded shadow-lg">
          {options.map((option) => (
            <div
              key={option}
              onClick={() => {
                onSelect(option);
                setOpen(false);
              }}
              className="px-4 py-2 hover:bg-muted cursor-pointer"
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
      <div className="flex border-b mb-4">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={clsx(
              "px-4 py-2 font-medium",
              activeIndex === i
                ? "border-b-2 border-primary text-primary"
                : "text-muted-text"
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

export interface AlertProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export const Alert = ({ type, message }: AlertProps) => {
  const base = "p-4 rounded font-medium";
  const types = {
    success: "bg-success-bg text-success-text border border-success-border",
    error: "bg-error-bg text-error-text border border-error-border",
    warning: "bg-warning-bg text-warning-text border border-warning-border",
    info: "bg-info-bg text-info-text border border-info-border",
  };

  return <div className={`${base} ${types[type]}`}>{message}</div>;
};

export interface BadgeProps {
  text: string;
  color?: "blue" | "green" | "red" | "gray";
}

export const Badge = ({ text, color = "gray" }: BadgeProps) => {
  const colors = {
    blue: "bg-info-bg text-info-text",
    green: "bg-success-bg text-success-text",
    red: "bg-error-bg text-error-text",
    gray: "bg-muted text-muted-text",
  };

  return <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[color]}`}>{text}</span>;
};
