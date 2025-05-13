import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface RatingInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  name: string;
  error?: string;
  options: string[];
}

const RatingInput: React.FC<RatingInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  name,
  error,
  options,
}) => {
  // Use defaultValue instead of value to avoid controlled component issues
  // This prevents the infinite update loop
  return (
    <div className="space-y-3">
      <Label htmlFor={name}>{label}</Label>
      <RadioGroup
        defaultValue={value}
        onValueChange={(newValue: string) => {
          onChange(newValue);
          // Only call onBlur when needed, not on every value change
        }}
        className="flex flex-row space-x-2 flex-wrap"
        name={name}
      >
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-1">
            <RadioGroupItem value={option} id={`${name}-${option}`} />
            <Label htmlFor={`${name}-${option}`} className="text-sm font-normal">
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default RatingInput;
