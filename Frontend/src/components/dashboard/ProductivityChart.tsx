import React, { useState } from 'react';
import { Card, Title3, Text, Button, RadioGroup, Radio } from '@fluentui/react-components';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../../styles/dashboard.css';

interface ChartData {
  name: string;
  tasks: number;
  meetings: number;
  focus: number;
}

const generateChartData = (period: 'week' | 'month'): ChartData[] => {
  const data: ChartData[] = [];
  const days = period === 'week' ? 7 : 30;

  for (let i = days; i > 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    data.push({
      name: dayName,
      tasks: Math.floor(Math.random() * 15) + 5,
      meetings: Math.floor(Math.random() * 8) + 2,
      focus: Math.floor(Math.random() * 300) + 120,
    });
  }

  return data;
};

export const ProductivityChart: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const data = generateChartData(period);

  const handleExportPDF = async () => {
    // PDF export would be implemented with @react-pdf/renderer or jspdf
    console.log('Exporting to PDF...');
  };

  const handleExportCSV = () => {
    // CSV export logic
    const csv = [
      ['Date', 'Tasks', 'Meetings', 'Focus Time (mins)'],
      ...data.map((d) => [d.name, d.tasks, d.meetings, d.focus]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-${period}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="dashboard-widget chart-card full-width">
      <div className="chart-header">
        <Title3>Productivity Trends</Title3>
        <div className="chart-controls">
          <div>
            <Text size={100}>Period:</Text>
            <RadioGroup value={period} onChange={(_, data: any) => setPeriod(data.value as 'week' | 'month')}>
              <Radio value="week" label="Week" />
              <Radio value="month" label="Month" />
            </RadioGroup>
          </div>

          <div>
            <Text size={100}>Chart Type:</Text>
            <RadioGroup value={chartType} onChange={(_, data: any) => setChartType(data.value as 'line' | 'bar')}>
              <Radio value="line" label="Line" />
              <Radio value="bar" label="Bar" />
            </RadioGroup>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="tasks"
              stroke="#0078d4"
              name="Tasks Completed"
            />
            <Line
              type="monotone"
              dataKey="meetings"
              stroke="#6200ea"
              name="Meetings"
            />
            <Line
              type="monotone"
              dataKey="focus"
              stroke="#16a34a"
              name="Focus Time (mins)"
            />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="tasks" fill="#0078d4" name="Tasks Completed" />
            <Bar dataKey="meetings" fill="#6200ea" name="Meetings" />
            <Bar dataKey="focus" fill="#16a34a" name="Focus Time (mins)" />
          </BarChart>
        )}
      </ResponsiveContainer>

      <div className="chart-footer">
        <div className="chart-info">
          <Text size={100}>
            Showing {period === 'week' ? 'last 7 days' : 'last 30 days'} of productivity data
          </Text>
        </div>
        <div className="chart-actions">
          <Button appearance="subtle" size="small" onClick={handleExportPDF}>
            📄 Export PDF
          </Button>
          <Button appearance="subtle" size="small" onClick={handleExportCSV}>
            📊 Export CSV
          </Button>
        </div>
      </div>
    </Card>
  );
};
