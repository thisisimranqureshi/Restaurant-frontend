import { useState, useEffect } from 'react';
import API from '../Api/Axios';
import toast from 'react-hot-toast';
import './Transaction.css';

const Transaction = () => {
  const [search, setSearch] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { data } = await API.get('/billing');
        setInvoices(data);
        setFiltered(data);
      } catch {
        toast.error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  useEffect(() => {
    let result = [...invoices];
    if (filterType === 'date' && filterDate) {
      result = result.filter((inv) => {
        const invDate = new Date(inv.createdAt).toISOString().slice(0, 10);
        return invDate === filterDate;
      });
    }
    if (filterType === 'month' && filterMonth) {
      const [year, month] = filterMonth.split('-');
      result = result.filter((inv) => {
        const d = new Date(inv.createdAt);
        return d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(month);
      });
    }
    if (search.trim()) {
      result = result.filter((inv) =>
        inv.customerName.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [filterType, filterDate, filterMonth, search, invoices]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('en-PK', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

  const totalAmount = filtered.reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="tr-page">

      {/* Top Bar */}
      <div className="tr-topbar">
        <div>
          <h1>Transactions</h1>
          <p>{filtered.length} transaction{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="tr-summary-badge">Total: Rs. {totalAmount.toFixed(2)}</div>
      </div>

      {/* Filters */}
      <div className="tr-filters">
        <div className="tr-filter-tabs">
          {['all', 'date', 'month'].map((type) => (
            <button
              key={type}
              className={`tr-tab ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type === 'all' ? 'All' : type === 'date' ? 'By Date' : 'By Month'}
            </button>
          ))}
        </div>
        {filterType === 'date' && (
          <input type="date" className="tr-filter-input"
            value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        )}
        {filterType === 'month' && (
          <input type="month" className="tr-filter-input"
            value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} />
        )}
        <input
          type="text"
          className="tr-filter-input tr-search"
          placeholder="Search by customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="tr-empty">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="tr-empty"><span>🧾</span><p>No transactions found</p></div>
      ) : (
        <div className="tr-table-wrap">
          <table className="tr-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Invoice No.</th>
                <th>Date & Time</th>
                <th>Items</th>
                <th>Tax</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, index) => (
                <tr key={inv._id} className="tr-row" onClick={() => setSelected(inv)}>
                  <td className="tr-num">{index + 1}</td>
                  <td className="tr-name">{inv.customerName}</td>
                  <td className="tr-invno">{inv.invoiceNumber}</td>
                  <td className="tr-date-cell">{formatDate(inv.createdAt)}</td>
                  <td className="tr-items-cell">{inv.items.length} item{inv.items.length !== 1 ? 's' : ''}</td>
                  <td className="tr-tax-cell">{inv.tax > 0 ? `${inv.tax}%` : '—'}</td>
                  <td className="tr-amount">Rs. {inv.totalAmount.toFixed(2)}</td>
                  <td><button className="tr-view-btn" onClick={(e) => { e.stopPropagation(); setSelected(inv); }}>View →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="tr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tr-modal-header">
              <div>
                <h2>{selected.customerName}</h2>
                <span className="tr-modal-inv">{selected.invoiceNumber}</span>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="tr-modal-body">
              <div className="tr-meta-grid">
                <div className="tr-meta-item">
                  <span className="tr-meta-label">Date & Time</span>
                  <span className="tr-meta-value">{formatDate(selected.createdAt)}</span>
                </div>
                <div className="tr-meta-item">
                  <span className="tr-meta-label">Invoice No.</span>
                  <span className="tr-meta-value">{selected.invoiceNumber}</span>
                </div>
                <div className="tr-meta-item">
                  <span className="tr-meta-label">Customer</span>
                  <span className="tr-meta-value">{selected.customerName}</span>
                </div>
                <div className="tr-meta-item">
                  <span className="tr-meta-label">Tax Applied</span>
                  <span className="tr-meta-value">{selected.tax > 0 ? `${selected.tax}%` : 'None'}</span>
                </div>
              </div>
              <div className="tr-modal-section-title">Items Ordered</div>
              <table className="tr-detail-table">
                <thead>
                  <tr><th>#</th><th>Item</th><th>Price</th><th>Qty</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {selected.items.map((item, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{item.name}</td>
                      <td>Rs. {item.price}</td>
                      <td>{item.quantity}</td>
                      <td>Rs. {item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="tr-totals">
                <div className="tr-total-row"><span>Subtotal</span><span>Rs. {selected.subtotal.toFixed(2)}</span></div>
                {selected.tax > 0 && (
                  <div className="tr-total-row muted">
                    <span>GST ({selected.tax}%)</span>
                    <span>Rs. {(selected.totalAmount - selected.subtotal).toFixed(2)}</span>
                  </div>
                )}
                <div className="tr-total-row grand">
                  <span>Grand Total</span>
                  <span>Rs. {selected.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Transaction;