'use client';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Props {
  data: { t: number; v: number }[];
}

export function VelocityChart({ data }: Props) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="vel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="t" tickFormatter={() => ''} stroke="#3a3f4d" tickLine={false} axisLine={false} />
          <YAxis
            stroke="#3a3f4d"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6b7184', fontSize: 10 }}
            width={36}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
          />
          <Tooltip
            cursor={{ stroke: 'rgba(124,92,255,0.5)' }}
            contentStyle={{
              background: 'rgba(19,21,28,0.95)',
              border: '1px solid #272a36',
              borderRadius: 8,
              color: '#f5f6fa',
              fontSize: 12,
            }}
            labelFormatter={(v) => `t-${data.length - 1 - Number(v)}s`}
            formatter={(v) => [`${Number(v).toLocaleString()} viewers`, '']}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke="#7c5cff"
            strokeWidth={2}
            fill="url(#vel)"
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
