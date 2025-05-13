import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TextInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  name: string;
  error?: string;
  placeholder?: string;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  name,
  error,
  placeholder = '',
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default TextInput;
