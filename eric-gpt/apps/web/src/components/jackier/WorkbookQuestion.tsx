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
          render={({ field }) => (
            <div className="mb-8">
              <Label htmlFor={fieldName} className="block mb-3 font-medium">
                {question.text} {isRequired && <span className="text-red-500">*</span>}
              </Label>
              <div className="py-6 px-2">
                <Slider
                  id={fieldName}
                  min={question.min || 1}
                  max={question.max || 10}
                  step={1}
                  value={field.value ? [field.value] : [question.min || 1]}
                  onValueChange={(value) => field.onChange(value[0])}
                  className="mb-4"
                />
                <div className="flex justify-between mt-3 text-sm text-muted-foreground">
                  <span>{question.min || 1}</span>
                  <span>{question.max || 10}</span>
                </div>
                <div className="text-center mt-4 font-medium">
                  Selected: <strong>{field.value || (question.min || 1)}</strong>
                </div>
              </div>
              {errors[fieldName] && (
                <p className="text-sm text-red-500 mt-2">{String(errors[fieldName]?.message)}</p>
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
