import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CheckboxInputProps {
  label: string;
  value: boolean;
  onChange: (checked: boolean) => void;
  onBlur: () => void;
  name: string;
  error?: string;
}

const CheckboxInput: React.FC<CheckboxInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  name,
  error,
}) => {
  return (
    <div className="flex items-start space-x-2">
      <Checkbox
        id={name}
        checked={value}
        onCheckedChange={(checked) => {
          onChange(checked as boolean);
          onBlur();
        }}
      />
      <div className="grid gap-1.5 leading-none">
        <Label htmlFor={name} className="text-sm font-normal">
          {label}
        </Label>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default CheckboxInput;
