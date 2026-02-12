'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { classNames, type Student } from '@/lib/data';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';

interface DashboardChartProps {
    students: Student[] | null;
    isLoading: boolean;
}

export function DashboardChart({ students, isLoading }: DashboardChartProps) {
    const classStudentCount = useMemo(() => {
        if (!students) {
            return classNames.map(name => ({ class: name, total: 0 }));
        }

        const counts = students.reduce((acc, student) => {
            const className = student.classGrade;
            if (!acc[className]) {
                acc[className] = 0;
            }
            acc[className]++;
            return acc;
        }, {} as Record<string, number>);

        return classNames.map(name => ({
            class: name,
            total: counts[name] || 0,
        }));

    }, [students]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[350px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={classStudentCount}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="class" />
        <YAxis />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
          }}
        />
        <Legend />
        <Bar dataKey="total" fill="hsl(var(--primary))" name="শিক্ষার্থী" />
      </BarChart>
    </ResponsiveContainer>
  );
}
