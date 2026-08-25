import React, { useState, useEffect } from 'react';
import { contractService } from '../services/contractService.ts';
import { EventRecord } from '../types/domain.ts';
import { CONTRACT_ADDRESS } from '../config/chain.ts';

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
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Auditor & Regulatory Observer Hub</h2>
          <p className="card-description">
            Inspect the complete append-only audit trail and operational statistics for Title 14 CFR § 71.1 applicability locks.
          </p>
        </div>

        {error && (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        )}

        {/* System Health / Summary Metrics */}
        <div className="grid-3" style={{ marginBottom: '24px' }}>
          <div style={{ background: 'var(--bg-card-alt)', padding: '16px', borderRadius: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Cases Tracked
            </span>
            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>{totalCases}</div>
          </div>

          <div style={{ background: 'var(--bg-card-alt)', padding: '16px', borderRadius: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Bound Integrations
            </span>
            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>{totalIntegrations}</div>
          </div>

          <div style={{ background: 'var(--bg-card-alt)', padding: '16px', borderRadius: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Append-Only Events
            </span>
            <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>{totalEvents}</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label htmlFor="filter-topic" style={{ fontSize: '13px', fontWeight: 600 }}>Filter Topic:</label>
            <select
              id="filter-topic"
              className="form-input"
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="ALL">All Event Topics</option>
              <option value="CASE_CREATED">CASE_CREATED</option>
              <option value="CASE_FROZEN">CASE_FROZEN</option>
              <option value="ASSESSMENT_COMPLETED">ASSESSMENT_COMPLETED</option>
              <option value="SUCCESSOR_CREATED">SUCCESSOR_CREATED</option>
              <option value="INTEGRATION_ACTIVATED">INTEGRATION_ACTIVATED</option>
              <option value="INTEGRATION_ADVANCED">INTEGRATION_ADVANCED</option>
            </select>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={loadStatsAndEvents}
            disabled={loading || !CONTRACT_ADDRESS}
          >
            {loading ? 'Refreshing...' : 'Refresh Logs'}
          </button>
        </div>

        {/* Events Table */}
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Event ID</th>
                <th style={{ width: '180px' }}>Event Type</th>
                <th style={{ width: '160px' }}>Subject ID</th>
                <th style={{ width: '220px' }}>Timestamp (UTC)</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    {loading ? 'Loading events...' : 'No audit events recorded yet.'}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt, idx) => (
                  <tr key={evt.event_id || idx}>
                    <td className="mono" style={{ fontWeight: 700 }}>{evt.event_id}</td>
                    <td>
                      <span className={`badge badge-${evt.event_type.includes('CREATED') || evt.event_type.includes('ACTIVATED') ? 'LOCKED' : evt.event_type.includes('FROZEN') ? 'FROZEN' : 'NOT_APPLICABLE'}`}>
                        {evt.event_type}
                      </span>
                    </td>
                    <td className="mono">{evt.subject_id}</td>
                    <td className="mono" style={{ fontSize: '12px' }}>{evt.timestamp}</td>
                    <td className="mono" style={{ fontSize: '11px' }}>{evt.actor}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
            >
              Previous Page
            </button>
            <span style={{ fontSize: '13px', alignSelf: 'center' }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
            >
              Next Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
