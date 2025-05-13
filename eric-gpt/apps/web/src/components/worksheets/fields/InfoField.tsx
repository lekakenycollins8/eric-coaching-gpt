import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface InfoFieldProps {
  label: string;
}

const InfoField: React.FC<InfoFieldProps> = ({ label }) => {
  return (
    <Card className="bg-muted">
      <CardContent className="pt-4">
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
};

export default InfoField;
