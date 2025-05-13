// Type declarations for worksheet field components

declare module './TextInput' {
  interface TextInputProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    name: string;
    error?: string;
    placeholder?: string;
  }
  
  const TextInput: React.FC<TextInputProps>;
  export default TextInput;
}

declare module './TextareaInput' {
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
  
  const TextareaInput: React.FC<TextareaInputProps>;
  export default TextareaInput;
}

declare module './RatingInput' {
  interface RatingInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    name: string;
    error?: string;
    options: string[];
  }
  
  const RatingInput: React.FC<RatingInputProps>;
  export default RatingInput;
}

declare module './CheckboxInput' {
  interface CheckboxInputProps {
    label: string;
    value: boolean;
    onChange: (checked: boolean) => void;
    onBlur: () => void;
    name: string;
    error?: string;
  }
  
  const CheckboxInput: React.FC<CheckboxInputProps>;
  export default CheckboxInput;
}

declare module './InfoField' {
  interface InfoFieldProps {
    label: string;
  }
  
  const InfoField: React.FC<InfoFieldProps>;
  export default InfoField;
}

declare module './MultiSelectInput' {
  interface MultiSelectInputProps {
    label: string;
    value: string[];
    onChange: (value: string[]) => void;
    onBlur: () => void;
    name: string;
    error?: string;
    options: string[];
  }
  
  const MultiSelectInput: React.FC<MultiSelectInputProps>;
  export default MultiSelectInput;
}
