'use client';

import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, Clock, Users, TrendingUp } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type TimeSlotData = {
  fascia: string;        // e.g. "12:00", "20:30"
  giorno: string;        // e.g. "Lunedì"
  affluenza: number;     // number of covers
  durataMedia: number;   // average service duration in minutes
  servizio: 'pranzo' | 'cena';
};

type DayKey = 'Tutti' | 'Lunedì' | 'Martedì' | 'Mercoledì' | 'Giovedì' | 'Venerdì' | 'Sabato' | 'Domenica';

// ─── Mock Data Generator ─────────────────────────────────────────────────────

function generateMockData(): TimeSlotData[] {
  const giorni: DayKey[] = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const fascePranzo = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30'];
  const fasceCena   = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'];

  // Day multiplier for affluenza (higher = busier)
  const dayMultiplier: Record<string, number> = {
    'Lunedì':    0.35,
    'Martedì':   0.30,
    'Mercoledì': 0.40,
    'Giovedì':   0.55,
    'Venerdì':   0.80,
    'Sabato':    1.00,
    'Domenica':  0.85,
  };

  // Time-of-day peak curves (0-1) for pranzo and cena
  const pranzoPeak: Record<string, number> = {
    '12:00': 0.40, '12:30': 0.70, '13:00': 1.00, '13:30': 0.90, '14:00': 0.50, '14:30': 0.20,
  };
  const cenaPeak: Record<string, number> = {
    '19:00': 0.25, '19:30': 0.50, '20:00': 0.85, '20:30': 1.00, '21:00': 0.90, '21:30': 0.65, '22:00': 0.35, '22:30': 0.15, '23:00': 0.05,
  };

  // Base max covers
  const maxPranzo = 75;
  const maxCena = 95;

  // Duration ranges
  const durationConfig: Record<string, { pranzo: [number, number]; cena: [number, number] }> = {
    'Lunedì':    { pranzo: [38, 48], cena: [55, 70] },
    'Martedì':   { pranzo: [35, 45], cena: [50, 65] },
    'Mercoledì': { pranzo: [40, 50], cena: [55, 70] },
    'Giovedì':   { pranzo: [42, 52], cena: [60, 80] },
    'Venerdì':   { pranzo: [45, 55], cena: [75, 100] },
    'Sabato':    { pranzo: [50, 65], cena: [90, 120] },
    'Domenica':  { pranzo: [55, 70], cena: [80, 105] },
  };

  const data: TimeSlotData[] = [];

  for (const giorno of giorni) {
    const mult = dayMultiplier[giorno];

    // Pranzo
    for (const fascia of fascePranzo) {
      const peak = pranzoPeak[fascia];
      const base = Math.round(maxPranzo * mult * peak);
      const jitter = Math.round((Math.random() - 0.5) * 6);
      const affluenza = Math.max(2, base + jitter);

      const [dMin, dMax] = durationConfig[giorno].pranzo;
      // Duration scales slightly with peak (busier → slightly longer)
      const durataMedia = Math.round(dMin + (dMax - dMin) * peak + (Math.random() - 0.5) * 4);

      data.push({ fascia, giorno, affluenza, durataMedia, servizio: 'pranzo' });
    }

    // Cena
    for (const fascia of fasceCena) {
      const peak = cenaPeak[fascia];
      const base = Math.round(maxCena * mult * peak);
      const jitter = Math.round((Math.random() - 0.5) * 8);
      const affluenza = Math.max(1, base + jitter);

      const [dMin, dMax] = durationConfig[giorno].cena;
      const durataMedia = Math.round(dMin + (dMax - dMin) * peak + (Math.random() - 0.5) * 5);

      data.push({ fascia, giorno, affluenza, durataMedia, servizio: 'cena' });
    }
  }

  return data;
}

// ─── Stable mock data (generated once at module level) ───────────────────────
const MOCK_DATA = generateMockData();

// ─── Affluenza level helper ──────────────────────────────────────────────────

function getAffluenzaLabel(val: number): { label: string; color: string } {
  if (val >= 70) return { label: 'Alta',      color: '#E74C3C' };
  if (val >= 40) return { label: 'Media',     color: '#D35400' };
  if (val >= 15) return { label: 'Moderata',  color: '#F5A623' };
  return                 { label: 'Bassa',     color: '#27AE60' };
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0]?.payload;
  if (!entry) return null;

  const { label: levelLabel, color: levelColor } = getAffluenzaLabel(entry.affluenza);

  return (
    <div className="bg-white/95 backdrop-blur-md border border-[#F5CBA7]/60 rounded-2xl px-5 py-4 shadow-2xl min-w-[220px]">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#F5CBA7]/30">
        <Clock size={14} className="text-[#D35400]" />
        <span className="font-extrabold text-[#781D2D] text-sm">
          {entry.giorno} — {label}
        </span>
        <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full`}
          style={{ backgroundColor: `${levelColor}18`, color: levelColor }}>
          {entry.servizio === 'pranzo' ? '☀️ Pranzo' : '🌙 Cena'}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <Users size={13} /> Affluenza
          </span>
          <span className="font-black text-sm" style={{ color: levelColor }}>
            {levelLabel} ({entry.affluenza} coperti)
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <TrendingUp size={13} /> Durata media
          </span>
          <span className="font-black text-sm text-[#781D2D]">
            {entry.durataMedia} min
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Custom Legend ───────────────────────────────────────────────────────────

function CustomLegend() {
  return (
    <div className="flex items-center justify-center gap-6 mt-2 text-xs font-semibold">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(135deg, #D35400, #E67E22)' }} />
        <span className="text-gray-500">Affluenza (coperti)</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-[#781D2D]" />
        <span className="text-gray-500">Durata media (min)</span>
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AffluenzaChart() {
  const days: DayKey[] = ['Tutti', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const [selectedDay, setSelectedDay] = useState<DayKey>('Tutti');

  const filteredData = useMemo(() => {
    if (selectedDay === 'Tutti') {
      // Weekly aggregation: average by time slot across all days
      const grouped: Record<string, { totalAff: number; totalDur: number; count: number; servizio: 'pranzo' | 'cena' }> = {};
      for (const d of MOCK_DATA) {
        if (!grouped[d.fascia]) {
          grouped[d.fascia] = { totalAff: 0, totalDur: 0, count: 0, servizio: d.servizio };
        }
        grouped[d.fascia].totalAff += d.affluenza;
        grouped[d.fascia].totalDur += d.durataMedia;
        grouped[d.fascia].count += 1;
      }
      return Object.entries(grouped).map(([fascia, v]) => ({
        fascia,
        giorno: 'Media Sett.',
        affluenza: Math.round(v.totalAff / v.count),
        durataMedia: Math.round(v.totalDur / v.count),
        servizio: v.servizio,
      }));
    }
    return MOCK_DATA.filter(d => d.giorno === selectedDay);
  }, [selectedDay]);

  // Compute quick stats
  const stats = useMemo(() => {
    const maxAff = Math.max(...filteredData.map(d => d.affluenza));
    const avgDur = Math.round(filteredData.reduce((s, d) => s + d.durataMedia, 0) / filteredData.length);
    const totalCovers = filteredData.reduce((s, d) => s + d.affluenza, 0);
    const peakSlot = filteredData.find(d => d.affluenza === maxAff);
    return { maxAff, avgDur, totalCovers, peakSlot };
  }, [filteredData]);

  return (
    <div className="w-full bg-[#FFFDFB]/60 backdrop-blur-sm rounded-3xl border border-[#F5CBA7]/30 shadow-sm overflow-hidden">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="p-6 md:p-8 border-b border-[#F5CBA7]/20 bg-white/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Title */}
          <div className="flex items-center gap-4">
            <div className="bg-[#D35400]/10 text-[#D35400] w-12 h-12 rounded-xl flex items-center justify-center">
              <BarChart3 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#781D2D]">Affluenza & Tempi di Servizio</h2>
              <p className="text-sm font-medium text-[#D35400]/70">
                Analisi automatica per fascia oraria{selectedDay !== 'Tutti' ? ` — ${selectedDay}` : ' — Media settimanale'}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center bg-[#FDF1E9] px-5 py-3 rounded-2xl border border-[#F5CBA7]/50 divide-x divide-[#F5CBA7]/30 text-center gap-0">
            <div className="px-4">
              <span className="block text-xl font-black text-[#781D2D]">{stats.totalCovers}</span>
              <span className="block text-[10px] uppercase tracking-widest font-bold text-[#781D2D]/50">Coperti Tot.</span>
            </div>
            <div className="px-4">
              <span className="block text-xl font-black text-[#D35400]">{stats.maxAff}</span>
              <span className="block text-[10px] uppercase tracking-widest font-bold text-[#D35400]/50">Picco Max</span>
            </div>
            <div className="px-4">
              <span className="block text-xl font-black text-[#781D2D]">{stats.avgDur}<span className="text-xs font-medium text-gray-400"> min</span></span>
              <span className="block text-[10px] uppercase tracking-widest font-bold text-[#781D2D]/50">Durata Ø</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Day Filter ────────────────────────────────────────────────── */}
      <div className="px-6 md:px-8 pt-6 flex flex-wrap gap-2">
        {days.map(day => {
          const isActive = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#781D2D] to-[#5f1723] text-white shadow-md scale-[1.03]'
                  : 'bg-white text-gray-500 hover:bg-[#FDF1E9] hover:text-[#781D2D] border border-[#F5CBA7]/30'
              }`}
            >
              {day === 'Tutti' ? '📊 Vista Settimanale' : day}
            </button>
          );
        })}
      </div>

      {/* ── Chart ─────────────────────────────────────────────────────── */}
      <div className="p-6 md:p-8">
        <div className="w-full" style={{ height: 420 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
              barCategoryGap="20%"
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D35400" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#E67E22" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#781D2D" />
                  <stop offset="100%" stopColor="#A0304A" />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 6"
                stroke="#F5CBA7"
                strokeOpacity={0.4}
                vertical={false}
              />

              <XAxis
                dataKey="fascia"
                tick={{ fill: '#781D2D', fontWeight: 700, fontSize: 11 }}
                axisLine={{ stroke: '#F5CBA7', strokeWidth: 1 }}
                tickLine={false}
                dy={8}
              />

              {/* Left Y-axis: Affluenza */}
              <YAxis
                yAxisId="left"
                orientation="left"
                tick={{ fill: '#D35400', fontWeight: 600, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Coperti',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#D35400', fontWeight: 800, fontSize: 11 },
                  offset: 15,
                }}
              />

              {/* Right Y-axis: Durata */}
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#781D2D', fontWeight: 600, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 140]}
                label={{
                  value: 'Minuti',
                  angle: 90,
                  position: 'insideRight',
                  style: { fill: '#781D2D', fontWeight: 800, fontSize: 11 },
                  offset: 15,
                }}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: '#F5CBA7', fillOpacity: 0.15, radius: 8 }}
              />

              <Legend content={<CustomLegend />} />

              {/* Bar: Affluenza */}
              <Bar
                yAxisId="left"
                dataKey="affluenza"
                fill="url(#barGradient)"
                radius={[8, 8, 0, 0]}
                maxBarSize={40}
                animationDuration={800}
                animationEasing="ease-out"
              />

              {/* Line: Durata */}
              <Line
                yAxisId="right"
                dataKey="durataMedia"
                stroke="url(#lineGlow)"
                strokeWidth={3}
                dot={{ r: 5, fill: '#781D2D', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, fill: '#D35400', stroke: '#fff', strokeWidth: 3 }}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Peak Insight ──────────────────────────────────────────────── */}
      {stats.peakSlot && (
        <div className="px-6 md:px-8 pb-6">
          <div className="bg-gradient-to-r from-[#FDF1E9] to-[#FFFDFB] border border-[#F5CBA7]/40 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-[#D35400]/10 text-[#D35400] w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp size={20} />
            </div>
            <p className="text-sm text-[#781D2D] font-medium leading-relaxed">
              <strong>Fascia di picco:</strong> {stats.peakSlot.giorno !== 'Media Sett.' ? `${stats.peakSlot.giorno} alle ` : ''}{stats.peakSlot.fascia} con <strong className="text-[#D35400]">{stats.maxAff} coperti</strong> e una durata media di <strong>{stats.peakSlot.durataMedia} min</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
