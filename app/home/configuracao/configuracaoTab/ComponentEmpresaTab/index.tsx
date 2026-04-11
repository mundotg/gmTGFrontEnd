interface FormFieldProps {
  label: string;
  value?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (v: string) => void;
}

export const FormField = ({
  label,
  value,
  type = "text",
  placeholder,
  required,
  disabled,
  onChange
}: FormFieldProps) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-800">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>

    <input
      type={type}
      defaultValue={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={e => onChange?.(e.target.value)}
      className={`w-full px-4 py-2.5 border rounded-lg outline-none transition
        ${disabled
          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
          : "border-gray-300 focus:ring-2 focus:ring-black focus:border-black"
        }`}
    />
  </div>
);
