'use client';

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const revenueData = [
  { name: 'Jan', revenue: 4000, users: 2400 },
  { name: 'Feb', revenue: 3000, users: 1398 },
  { name: 'Mar', revenue: 2000, users: 9800 },
  { name: 'Apr', revenue: 2780, users: 3908 },
  { name: 'May', revenue: 1890, users: 4800 },
  { name: 'Jun', revenue: 2390, users: 3800 },
  { name: 'Jul', revenue: 3490, users: 4300 },
];

const topGenres = [
  { name: 'Action', count: 45 },
  { name: 'Drama', count: 32 },
  { name: 'Comedy', count: 28 },
  { name: 'Horror', count: 24 },
  { name: 'Sci-Fi', count: 18 },
];

const COLORS = ['#3299ff', '#9248ff', '#f43f5e', '#10b981', '#f59e0b'];

export default function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 bg-card p-6 rounded-2xl border border-border">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-semibold">Revenue Growth</h3>
            <p className="text-sm text-muted-foreground">Monthly revenue compared to last year</p>
          </div>
          <select className="bg-muted border-none rounded-lg text-sm px-3 py-1.5 outline-none focus:ring-1 ring-primary pr-8">
            <option>Last 7 months</option>
            <option>Last year</option>
          </select>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3299ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3299ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9248ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#9248ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#141418', 
                  borderColor: '#27272a', 
                  borderRadius: '12px',
                  color: '#f8fafc'
                }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3299ff" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#9248ff" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorUsers)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card p-6 rounded-2xl border border-border">
        <h3 className="text-lg font-semibold mb-8">Popular Genres</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topGenres} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#f8fafc', fontSize: 12 }}
                width={80}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ 
                  backgroundColor: '#141418', 
                  borderColor: '#27272a', 
                  borderRadius: '12px'
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                {topGenres.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {topGenres.map((genre, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-muted-foreground">{genre.name}</span>
              </div>
              <span className="font-medium">{genre.count}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
