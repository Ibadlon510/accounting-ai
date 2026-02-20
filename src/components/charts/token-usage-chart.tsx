"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { day: "Jan 20", tokens: 120 },
  { day: "Jan 21", tokens: 85 },
  { day: "Jan 22", tokens: 200 },
  { day: "Jan 23", tokens: 45 },
  { day: "Jan 24", tokens: 0 },
  { day: "Jan 25", tokens: 0 },
  { day: "Jan 26", tokens: 150 },
  { day: "Jan 27", tokens: 310 },
  { day: "Jan 28", tokens: 175 },
  { day: "Jan 29", tokens: 90 },
  { day: "Jan 30", tokens: 220 },
  { day: "Jan 31", tokens: 60 },
  { day: "Feb 1", tokens: 180 },
  { day: "Feb 2", tokens: 0 },
  { day: "Feb 3", tokens: 140 },
  { day: "Feb 4", tokens: 250 },
  { day: "Feb 5", tokens: 130 },
  { day: "Feb 6", tokens: 95 },
  { day: "Feb 7", tokens: 170 },
  { day: "Feb 8", tokens: 0 },
  { day: "Feb 9", tokens: 0 },
  { day: "Feb 10", tokens: 210 },
  { day: "Feb 11", tokens: 160 },
  { day: "Feb 12", tokens: 80 },
  { day: "Feb 13", tokens: 190 },
  { day: "Feb 14", tokens: 110 },
  { day: "Feb 15", tokens: 240 },
  { day: "Feb 16", tokens: 0 },
  { day: "Feb 17", tokens: 155 },
  { day: "Feb 18", tokens: 300 },
];

const totalUsed = data.reduce((s, d) => s + d.tokens, 0);

export function TokenUsageChart() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-text-meta">30-Day Usage</p>
          <p className="text-[20px] font-bold text-text-primary">{totalUsed.toLocaleString()} tokens</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-text-meta">Daily Average</p>
          <p className="text-[14px] font-semibold text-text-primary">{Math.round(totalUsed / 30)} / day</p>
        </div>
      </div>
      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={8}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
            <XAxis dataKey="day" tick={false} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(value) => [`${Number(value)} tokens`, ""]}
              contentStyle={{
                background: "white",
                border: "1px solid var(--border-subtle)",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}
            />
            <Bar dataKey="tokens" fill="var(--accent-ai)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
