"use client";
import React, { useState, useEffect } from 'react';
import { auditLogService, AuditLog } from '@/services/auditLogService';
import { ShieldAlert, RefreshCw, FileText, Search } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState<number>(20);

  const fetchLogs = async (currentLimit = limit) => {
    setLoading(true);
    try {
      const res = await auditLogService.getAll(currentLimit, 0);
      setLogs(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(limit);
  }, [limit]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
  };

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.module.toLowerCase().includes(term) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(term)) ||
      (log.ipAddress && log.ipAddress.includes(term))
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <ShieldAlert className="text-amber-500 w-8 h-8" />
            Security Audit Logs
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time immutable audit trail for sensitive administrative, pricing, and access control changes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Show</span>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm"
            >
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={500}>500 per page</option>
            </select>
          </div>
          <button
            onClick={() => fetchLogs(limit)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm transition-colors border border-gray-700 shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Logs
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by action, module, user email, or IP address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400 font-medium">
            Showing <span className="text-white font-bold">{filteredLogs.length}</span> of {total} logs
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Limit:</span>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="bg-gray-950 border border-gray-800 text-white text-xs px-2 py-1 rounded focus:outline-none focus:border-amber-500"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-950 text-gray-400 font-semibold uppercase text-xs tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">User</th>
                <th className="py-4 px-6">Action</th>
                <th className="py-4 px-6">Module</th>
                <th className="py-4 px-6">IP Address</th>
                <th className="py-4 px-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-medium text-white">
                      {log.userEmail || `User #${log.userId || 'N/A'}`}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold tracking-wide bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-300 font-mono text-xs">
                      {log.module}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-gray-400">
                      {log.ipAddress || 'unknown'}
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      {log.details ? (
                        <pre className="text-[11px] font-mono bg-black/40 p-2 rounded border border-gray-800 text-gray-300 overflow-x-auto max-h-20">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
