import { useState, useEffect } from 'react';
import API from '../Api/Axios';
import './Usage.css';

const Usage = () => {
  const [filterType, setFilterType] = useState('month');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsage = async () => {
    setLoading(true);
    setError('');
    try {
      let params = {};
      if (filterType === 'month') params.month = month;
      else if (filterType === 'range') {
        if (from) params.from = from;
        if (to) params.to = to;
      }
      const { data: res } = await API.get('/usage', { params });
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filterType === 'month' && month) fetchUsage();
    if (filterType === 'all') fetchUsage();
  }, [filterType, month]);

  return (
    <div className="usage-page">

      {/* ── Top Bar ── */}
      <div className="usage-topbar">
        <h1 className="usage-title">Ingredient Usage</h1>

        <div className="usage-tabs">
          {['month', 'range', 'all'].map((t) => (
            <button
              key={t}
              className={`usage-tab ${filterType === t ? 'active' : ''}`}
              onClick={() => setFilterType(t)}
            >
              {t === 'month' ? 'Monthly' : t === 'range' ? 'Date Range' : 'All Time'}
            </button>
          ))}
        </div>

        <div className="usage-filter-inputs">
          {filterType === 'month' && (
            <input
              type="month"
              className="usage-input"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          )}
          {filterType === 'range' && (
            <>
              <input type="date" className="usage-input" value={from} onChange={(e) => setFrom(e.target.value)} />
              <span className="sep">→</span>
              <input type="date" className="usage-input" value={to} onChange={(e) => setTo(e.target.value)} />
              <button className="usage-apply-btn" onClick={fetchUsage}>Apply</button>
            </>
          )}
        </div>

        {data && !loading && (
          <div className="usage-meta">
            <span className="meta-pill"><b>{data.totalInvoices}</b> Invoices</span>
            <span className="meta-pill"><b>{data.ingredients.length}</b> Ingredients</span>
          </div>
        )}
      </div>

      {/* ── States ── */}
      {loading && (
        <div className="usage-loader">
          <div className="usage-spinner" />
          <span>Calculating usage...</span>
        </div>
      )}
      {error && !loading && <div className="usage-error">{error}</div>}
      {!loading && !error && data && data.ingredients.length === 0 && (
        <div className="usage-empty">
          <span>📦</span>
          <p>No sales found for this period</p>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && !error && data && data.ingredients.length > 0 && (
        <div className="usage-table-wrap">
          <table className="usage-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Ingredient</th>
                <th>Total Used</th>
                <th>Unit</th>
                <th>Used In Items</th>
              </tr>
            </thead>
            <tbody>
              {data.ingredients.map((ing, i) => (
                <tr key={`${ing.name}-${ing.unit}`}>
                  <td className="col-num">{i + 1}</td>
                  <td className="col-name">{ing.name}</td>
                  <td className="col-qty">
                    <span className="qty-badge">{ing.totalQuantity.toFixed(2)}</span>
                  </td>
                  <td className="col-unit">{ing.unit}</td>
                  <td className="col-items">
                    {ing.usedInItems.map((u, j) => (
                      <span key={j} className="chip">{u.menuItem} ×{u.qtySold}</span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default Usage;