import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface MultiSelectInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  onBlur: () => void;
  name: string;
  error?: string;
  options: string[];
}

const MultiSelectInput: React.FC<MultiSelectInputProps> = ({
  label,
  value = [],
  onChange,
  onBlur,
  name,
  error,
  options,
}) => {
  const handleCheckboxChange = (option: string, checked: boolean) => {
    let newValue = [...value];
    
    if (checked) {
      if (!newValue.includes(option)) {
        newValue.push(option);
      }
    } else {
      newValue = newValue.filter(item => item !== option);
    }
    
    onChange(newValue);
    onBlur();
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`${name}-${option}`}
              checked={value.includes(option)}
              onCheckedChange={(checked) => handleCheckboxChange(option, checked as boolean)}
            />
            <Label htmlFor={`${name}-${option}`} className="text-sm font-normal">
              {option}
            </Label>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default MultiSelectInput;
