'use client';

import React, { useState, useEffect } from 'react';
import { checkSystemHealth } from '@/lib/api';
import { HealthResponse } from '@/types';
import {
  Server,
  Database,
  Layers,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from 'lucide-react';

interface HealthStatusWidgetProps {
  onStatusChange?: (status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown') => void;
}

export function HealthStatusWidget({ onStatusChange }: HealthStatusWidgetProps) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await checkSystemHealth();
      setHealth(data);
      setLastChecked(new Date());
      if (onStatusChange) {
        onStatusChange(data.status);
      }
    } catch {
      if (onStatusChange) {
        onStatusChange('unhealthy');
      }
    } finally {
      setIsLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHealth();
    }, 0);
    const interval = setInterval(() => {
      fetchHealth();
    }, 15000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchHealth]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Healthy
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            Degraded
          </span>
        );
      case 'unhealthy':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400 ring-1 ring-rose-500/20">
            <XCircle className="h-3 w-3" />
            Offline
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-semibold text-slate-400 ring-1 ring-slate-500/20">
            <Clock className="h-3 w-3" />
            Connecting
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">System Diagnostics & Core Services</h3>
            {getStatusBadge(health?.status)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time health verification across platform infrastructure (FastAPI, PostgreSQL, Redis, Judge)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400">
            Last ping: {lastChecked ? lastChecked.toLocaleTimeString() : 'Connecting...'}
          </span>
          <button
            onClick={fetchHealth}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Ping Services</span>
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* API Card */}
        <div className="rounded-lg border border-slate-800/90 bg-slate-950/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Server className="h-4 w-4" />
            </div>
            {getStatusBadge(health?.services.api?.status)}
          </div>
          <h4 className="mt-3 font-semibold text-sm text-slate-200">FastAPI Gateway</h4>
          <p className="mt-1 text-xs text-slate-400 line-clamp-2">
            {health?.services.api?.details || 'REST API & Route Engine'}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px] font-mono text-slate-400">
            <span>Latency</span>
            <span className="text-emerald-400">
              {health?.services.api?.response_time_ms !== undefined
                ? `${health.services.api.response_time_ms} ms`
                : '—'}
            </span>
          </div>
        </div>

        {/* Database Card */}
        <div className="rounded-lg border border-slate-800/90 bg-slate-950/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <Database className="h-4 w-4" />
            </div>
            {getStatusBadge(health?.services.database?.status)}
          </div>
          <h4 className="mt-3 font-semibold text-sm text-slate-200">PostgreSQL 16</h4>
          <p className="mt-1 text-xs text-slate-400 line-clamp-2">
            {health?.services.database?.details || 'Durable relational storage'}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px] font-mono text-slate-400">
            <span>Latency</span>
            <span className="text-cyan-400">
              {health?.services.database?.response_time_ms !== undefined
                ? `${health.services.database.response_time_ms} ms`
                : '—'}
            </span>
          </div>
        </div>

        {/* Redis Card */}
        <div className="rounded-lg border border-slate-800/90 bg-slate-950/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <Layers className="h-4 w-4" />
            </div>
            {getStatusBadge(health?.services.redis?.status)}
          </div>
          <h4 className="mt-3 font-semibold text-sm text-slate-200">Redis 7 Broker</h4>
          <p className="mt-1 text-xs text-slate-400 line-clamp-2">
            {health?.services.redis?.details || 'Background job queue & cache'}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px] font-mono text-slate-400">
            <span>Latency</span>
            <span className="text-rose-400">
              {health?.services.redis?.response_time_ms !== undefined
                ? `${health.services.redis.response_time_ms} ms`
                : '—'}
            </span>
          </div>
        </div>

        {/* Judge Sandbox Card */}
        <div className="rounded-lg border border-slate-800/90 bg-slate-950/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <Cpu className="h-4 w-4" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-400 ring-1 ring-violet-500/20">
              Phase 3 Ready
            </span>
          </div>
          <h4 className="mt-3 font-semibold text-sm text-slate-200">C++ Judge Engine</h4>
          <p className="mt-1 text-xs text-slate-400 line-clamp-2">
            Isolated Docker container sandbox with resource limits & seccomp
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px] font-mono text-slate-400">
            <span>Compiler</span>
            <span className="text-violet-400">g++ 13 / C++20</span>
          </div>
        </div>
      </div>
    </div>
  );
}
