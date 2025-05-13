import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface TextareaInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur: () => void;
  name: string;
  error?: string;
  placeholder?: string;
  rows?: number;
}

const TextareaInput: React.FC<TextareaInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  name,
  error,
  placeholder = '',
  rows = 4,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default TextareaInput;
