import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  error?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export function FormField({ 
  label, 
  id, 
  type = "text", 
  placeholder, 
  error, 
  value, 
  onChange,
  required
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-background border-border focus:ring-primary/20 focus:border-primary transition-all ${
          error ? "border-destructive focus:border-destructive focus:ring-destructive/20" : ""
        }`}
        required={required}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
