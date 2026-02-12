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
import { classStudentCount } from '@/lib/data';

export function DashboardChart() {
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
