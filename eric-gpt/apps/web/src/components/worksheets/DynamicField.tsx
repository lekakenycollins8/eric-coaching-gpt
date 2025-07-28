'use client';

import React from 'react';
import type { Control, Controller, FieldErrors } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface FieldProps {
  id: string;
  label: string;
  type: string;
  description?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

interface DynamicFieldProps {
  field: FieldProps;
  control: Control<Record<string, any>>;
  errors: FieldErrors;
}

/**
 * A dynamic form field component that renders different field types based on the field.type
 */
export function DynamicField({ field, control, errors }: DynamicFieldProps) {
  const { id, label, type, description, required = false, options = [] } = field;

  // Render different field types
  const renderFieldByType = (fieldType: string, field: any) => {
    switch (fieldType) {
      case 'text':
        return (
          <FormControl>
            <Input {...field} />
          </FormControl>
        );
      case 'textarea':
        return (
          <FormControl>
            <Textarea {...field} rows={5} />
          </FormControl>
        );
      case 'rating':
        return (
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex space-x-2"
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <FormItem key={rating} className="flex items-center space-x-1">
                  <FormControl>
                    <RadioGroupItem value={rating.toString()} />
                  </FormControl>
                  <FormLabel className="text-sm">{rating}</FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
        );
      case 'checkbox':
        return (
          <FormControl>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                id={id}
              />
              <FormLabel htmlFor={id} className="text-sm font-normal">
                {label}
              </FormLabel>
            </div>
          </FormControl>
        );
      case 'select':
      case 'multiselect':
        return (
          <FormControl>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
        );
      case 'info':
        return (
          <Alert className="bg-blue-50">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>{description}</AlertDescription>
          </Alert>
        );
      default:
        return (
          <FormControl>
            <Input {...field} />
          </FormControl>
        );
    }
  };

  // Special case for checkbox type which includes the label in the field
  if (type === 'checkbox') {
    return (
      <FormField
        control={control}
        name={id}
        render={({ field }) => (
          <FormItem className="space-y-2">
            {renderFieldByType(type, field)}
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Special case for info type which doesn't need a form field
  if (type === 'info') {
    return (
      <div className="space-y-2">
        {renderFieldByType(type, null)}
      </div>
    );
  }

  // Standard field rendering
  return (
    <FormField
      control={control}
      name={id}
      rules={{ required: required ? 'This field is required' : false }}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          {renderFieldByType(type, field)}
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
