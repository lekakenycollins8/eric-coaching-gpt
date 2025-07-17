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
  
  switch (question.type) {
    case 'text':
      return (
        <FormField
          key={fieldName}
          control={control}
          name={fieldName}
          render={({ field }) => (
            <div className="mb-4">
              <Label htmlFor={fieldName} className="block mb-2">
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
                <p className="text-sm text-red-500 mt-1">{String(errors[fieldName]?.message)}</p>
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
            <div className="mb-4">
              <Label htmlFor={fieldName} className="block mb-2">
                {question.text} {isRequired && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id={fieldName}
                {...field}
                value={field.value || ''}
                className="w-full min-h-[100px]"
                aria-invalid={!!errors[fieldName]}
              />
              {errors[fieldName] && (
                <p className="text-sm text-red-500 mt-1">{String(errors[fieldName]?.message)}</p>
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
          render={({ field }) => (
            <div className="mb-4">
              <Label htmlFor={fieldName} className="block mb-2">
                {question.text} {isRequired && <span className="text-red-500">*</span>}
              </Label>
              <div className="py-4">
                <Slider
                  id={fieldName}
                  min={question.min || 1}
                  max={question.max || 10}
                  step={1}
                  value={field.value ? [field.value] : [question.min || 1]}
                  onValueChange={(value) => field.onChange(value[0])}
                />
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span>{question.min || 1}</span>
                  <span>{question.max || 10}</span>
                </div>
                <div className="text-center mt-2">
                  Selected: <strong>{field.value || (question.min || 1)}</strong>
                </div>
              </div>
              {errors[fieldName] && (
                <p className="text-sm text-red-500 mt-1">{String(errors[fieldName]?.message)}</p>
              )}
            </div>
          )}
        />
      );
      
    case 'choice':
      return (
        <FormField
          key={fieldName}
          control={control}
          name={fieldName}
          render={({ field }) => (
            <div className="mb-4">
              <Label className="block mb-2">
                {question.text} {isRequired && <span className="text-red-500">*</span>}
              </Label>
              <RadioGroup
                value={field.value || ''}
                onValueChange={field.onChange}
                className="space-y-2"
              >
                {question.options?.map((option: string, i: number) => (
                  <div key={i} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${fieldName}-${i}`} />
                    <Label htmlFor={`${fieldName}-${i}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
              {errors[fieldName] && (
                <p className="text-sm text-red-500 mt-1">{String(errors[fieldName]?.message)}</p>
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
            <div className="mb-4">
              <Label className="block mb-2">
                {question.text} {isRequired && <span className="text-red-500">*</span>}
              </Label>
              <div className="space-y-2">
                {question.options?.map((option: string, i: number) => (
                  <div key={i} className="flex items-center space-x-2">
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
                    />
                    <Label htmlFor={`${fieldName}-${i}`}>{option}</Label>
                  </div>
                ))}
              </div>
              {errors[fieldName] && (
                <p className="text-sm text-red-500 mt-1">{String(errors[fieldName]?.message)}</p>
              )}
            </div>
          )}
        />
      );
      
    case 'info':
      return (
        <div key={fieldName} className="mb-4 p-4 bg-muted rounded-md">
          <p>{question.text}</p>
        </div>
      );
      
    default:
      return null;
  }
}
