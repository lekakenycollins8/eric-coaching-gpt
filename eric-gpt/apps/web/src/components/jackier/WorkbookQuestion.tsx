import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'choice' | 'checkbox' | 'rating' | 'scale' | 'info';
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

interface WorkbookQuestionProps {
  question: Question;
  sectionIndex?: number;
  questionIndex?: number;
  isLastQuestion?: boolean;
}

export function WorkbookQuestion({ question, sectionIndex, questionIndex, isLastQuestion }: WorkbookQuestionProps) {
  const { control, formState: { errors } } = useFormContext();
  const fieldName = question.id;
  const isRequired = question.required;
  
  // Memoize default values to prevent re-renders
  const defaultMin = React.useMemo(() => question.min || 1, [question.min]);
  const defaultMax = React.useMemo(() => question.max || 10, [question.max]);
  
  switch (question.type) {
    case 'text':
      return (
        <FormField
          key={fieldName}
          control={control}
          name={fieldName}
          render={({ field }) => (
            <div className="mb-8">
              <Label htmlFor={fieldName} className="block mb-3 font-medium">
                {question.text} {isRequired && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id={fieldName}
                {...field}
                value={field.value || ''}
                className="w-full"
                aria-invalid={!!errors[fieldName]}
              />
              {errors[fieldName] && (
                <p className="text-sm text-red-500 mt-2">{String(errors[fieldName]?.message)}</p>
              )}
            </div>
          )}
        />
      );
      
    case 'textarea':
      return (
        <FormField
          key={fieldName}
          control={control}
          name={fieldName}
          render={({ field }) => (
            <div className="mb-8">
              <Label htmlFor={fieldName} className="block mb-3 font-medium">
                {question.text} {isRequired && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id={fieldName}
                {...field}
                value={field.value || ''}
                className="w-full min-h-[120px]"
                aria-invalid={!!errors[fieldName]}
              />
              {errors[fieldName] && (
                <p className="text-sm text-red-500 mt-2">{String(errors[fieldName]?.message)}</p>
              )}
            </div>
          )}
        />
      );
      
    case 'rating':
    case 'scale':
      return (
        <FormField
          key={fieldName}
          control={control}
          name={fieldName}
          render={({ field }) => {
            // Memoize the slider component to prevent re-renders
            const SliderComponent = React.useMemo(() => {
              // Default to min value if undefined
              const currentValue = field.value !== undefined ? field.value : defaultMin;
              
              // Create a stable onChange handler
              const handleValueChange = (value: number[]) => {
                field.onChange(value[0]);
              };
              
              return (
                <div className="py-6 px-2">
                  <Slider
                    id={fieldName}
                    min={defaultMin}
                    max={defaultMax}
                    step={1}
                    value={[currentValue]}
                    onValueChange={handleValueChange}
                    className="mb-4"
                  />
                  <div className="flex justify-between mt-3 text-sm text-muted-foreground">
                    <span>{defaultMin}</span>
                    <span>{defaultMax}</span>
                  </div>
                  <div className="text-center mt-4 font-medium">
                    Selected: <strong>{currentValue}</strong>
                  </div>
                </div>
              );
            }, [field.value, defaultMin, defaultMax, fieldName]);
            
            return (
              <div className="mb-8">
                <Label htmlFor={fieldName} className="block mb-3 font-medium">
                  {question.text} {isRequired && <span className="text-red-500">*</span>}
                </Label>
                {SliderComponent}
                {errors[fieldName] && (
                  <p className="text-sm text-red-500 mt-2">{String(errors[fieldName]?.message)}</p>
                )}
              </div>
            );
          }}
        />
      );
      
    case 'choice':
      return (
        <FormField
          key={fieldName}
          control={control}
          name={fieldName}
          render={({ field }) => (
            <div className="mb-8">
              <Label className="block mb-3 font-medium">
                {question.text} {isRequired && <span className="text-red-500">*</span>}
              </Label>
              <RadioGroup
                value={field.value || ''}
                onValueChange={field.onChange}
                className="space-y-3 mt-2 pl-1"
              >
                {question.options?.map((option: string, i: number) => (
                  <div key={i} className="flex items-center space-x-3">
                    <RadioGroupItem value={option} id={`${fieldName}-${i}`} />
                    <Label htmlFor={`${fieldName}-${i}`} className="text-base">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
              {errors[fieldName] && (
                <p className="text-sm text-red-500 mt-3">{String(errors[fieldName]?.message)}</p>
              )}
            </div>
          )}
        />
      );
      
    case 'checkbox':
      return (
        <FormField
          key={fieldName}
          control={control}
          name={fieldName}
          render={({ field }) => (
            <div className="mb-8">
              <Label className="block mb-3 font-medium">
                {question.text} {isRequired && <span className="text-red-500">*</span>}
              </Label>
              <div className="space-y-3 mt-2 pl-1">
                {question.options?.map((option: string, i: number) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Checkbox
                      id={`${fieldName}-${i}`}
                      checked={(field.value || []).includes(option)}
                      onCheckedChange={(checked) => {
                        const currentValue = field.value || [];
                        const newValue = checked
                          ? [...currentValue, option]
                          : currentValue.filter((val: string) => val !== option);
                        field.onChange(newValue);
                      }}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={`${fieldName}-${i}`} className="text-base">{option}</Label>
                  </div>
                ))}
              </div>
              {errors[fieldName] && (
                <p className="text-sm text-red-500 mt-3">{String(errors[fieldName]?.message)}</p>
              )}
            </div>
          )}
        />
      );
      
    case 'info':
      return (
        <div key={fieldName} className="mb-8 p-6 bg-muted rounded-md">
          <p className="text-base">{question.text}</p>
        </div>
      );
      
    default:
      return null;
  }
}
