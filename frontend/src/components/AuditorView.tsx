import React, { useState, useEffect } from 'react';
import { contractService } from '../services/contractService.ts';
import { EventRecord } from '../types/domain.ts';
import { CONTRACT_ADDRESS } from '../config/chain.ts';
import { RoleBoundaryBanner } from './RoleBoundaryBanner.tsx';

export const AuditorView: React.FC = () => {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [totalCases, setTotalCases] = useState<number>(0);
  const [totalIntegrations, setTotalIntegrations] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterTopic, setFilterTopic] = useState<string>('ALL');

  useEffect(() => {
    if (CONTRACT_ADDRESS) {
      loadStatsAndEvents();
    }
  }, [page]);

  const loadStatsAndEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cCount, iCount, evtResult] = await Promise.all([
        contractService.getCaseCount(),
        contractService.getIntegrationCount(),
        contractService.getEvents(page * pageSize, pageSize),
      ]);

      setTotalCases(cCount);
      setTotalIntegrations(iCount);
      setTotalEvents(evtResult.total);
      setEvents(evtResult.events || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (filterTopic === 'ALL') return true;
    return e.event_type === filterTopic;
  });

  const totalPages = Math.ceil(totalEvents / pageSize);

  return (
    <div>
      <RoleBoundaryBanner
        role="auditor"
        title="Auditor & Regulatory Observer Mode"
        description="Inspect the append-only on-chain event log, monitor system health metrics, and audit incorporation locks across all cases."
      />

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Auditor & Regulatory Observer Hub</h2>
          <p className="card-description">
            Inspect the complete append-only audit trail and operational statistics for Title 14 CFR § 71.1 applicability locks.
          </p>
        </div>

        {error && (
          <div className="banner banner-error" role="alert">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* System Health / Summary Metrics */}
        <div className="grid-3" style={{ marginBottom: '24px' }}>
          <div
            style={{
              background: 'var(--rs-bg-card-alt)',
              border: '1px solid var(--rs-border)',
              padding: '18px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--rs-text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
              Total Cases Tracked
            </span>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--rs-text-heading)', marginTop: '4px', letterSpacing: '-0.02em' }}>
              {totalCases}
            </div>
          </div>

          <div
            style={{
              background: 'var(--rs-bg-card-alt)',
              border: '1px solid var(--rs-border)',
              padding: '18px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--rs-text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
              Bound Integrations
            </span>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--rs-cyan-bright)', marginTop: '4px', letterSpacing: '-0.02em' }}>
              {totalIntegrations}
            </div>
          </div>

          <div
            style={{
              background: 'var(--rs-bg-card-alt)',
              border: '1px solid var(--rs-border)',
              padding: '18px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--rs-text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
              Append-Only Events
            </span>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--rs-gold-glow)', marginTop: '4px', letterSpacing: '-0.02em' }}>
              {totalEvents}
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label htmlFor="filter-topic" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--rs-text-heading)' }}>
              Filter Current Page:
            </label>
            <select
              id="filter-topic"
              className="form-input"
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              style={{ width: 'auto', minWidth: '200px' }}
            >
              <option value="ALL">All Event Topics</option>
              <option value="CASE_CREATED">CASE_CREATED</option>
              <option value="CASE_FROZEN">CASE_FROZEN</option>
              <option value="CASE_ASSESSED">CASE_ASSESSED</option>
              <option value="CASE_RETRY_RESERVED">CASE_RETRY_RESERVED</option>
              <option value="SUCCESSOR_CREATED">SUCCESSOR_CREATED</option>
              <option value="CASE_SUPERSEDED_BY_SUCCESSOR">CASE_SUPERSEDED_BY_SUCCESSOR</option>
              <option value="INTEGRATION_BOUND">INTEGRATION_BOUND</option>
              <option value="INTEGRATION_ADVANCED">INTEGRATION_ADVANCED</option>
            </select>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={loadStatsAndEvents}
            disabled={loading || !CONTRACT_ADDRESS}
            aria-label="Refresh audit logs from chain"
          >
            {loading ? 'Refreshing...' : 'Refresh Logs'}
          </button>
        </div>

        {/* Events Table */}
        <div className="table-responsive">
          <table className="table" aria-label="Append-Only Audit Events">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Event ID</th>
                <th style={{ width: '200px' }}>Event Type</th>
                <th style={{ width: '160px' }}>Subject ID</th>
                <th style={{ width: '220px' }}>Timestamp (UTC)</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--rs-text-muted)', padding: '28px' }}>
                    {loading ? 'Loading events...' : 'No audit events recorded yet.'}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt, idx) => (
                  <tr key={evt.event_id || idx}>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--rs-text-heading)' }}>{evt.event_id}</td>
                    <td>
                      <span className="badge badge-DRAFT">
                        {evt.event_type}
                      </span>
                    </td>
                    <td className="mono" style={{ color: 'var(--rs-cyan-bright)' }}>{evt.subject_id}</td>
                    <td className="mono" style={{ fontSize: '12px' }}>{evt.timestamp}</td>
                    <td className="mono" style={{ fontSize: '11px', color: 'var(--rs-text-muted)' }}>{evt.actor}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              aria-label="Go to previous page of audit events"
            >
              Previous Page
            </button>
            <span style={{ fontSize: '13px', alignSelf: 'center', color: 'var(--rs-text-muted)' }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              aria-label="Go to next page of audit events"
            >
              Next Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
