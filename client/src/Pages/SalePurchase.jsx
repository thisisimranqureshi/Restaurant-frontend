import { useState, useEffect, useRef } from 'react';
import API from '../Api/Axios';
import toast from 'react-hot-toast';
import './SalePurchase.css';

const emptyRow = () => ({ menuItemId: '', name: '', price: 0, quantity: 1, subtotal: 0 });

const SearchableDropdown = ({ menuItems, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef(null);
  const listRef = useRef(null);

  const selected = menuItems.find((m) => m._id === value);

  const filtered = menuItems.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
        setHighlighted(0);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Reset highlight when search changes
  useEffect(() => {
    setHighlighted(0);
  }, [search]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('.sd-item');
      if (items[highlighted]) {
        items[highlighted].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlighted]);

  const handleSelect = (item) => {
    onChange(item._id);
    setOpen(false);
    setSearch('');
    setHighlighted(0);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlighted((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlighted((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlighted]) {
          handleSelect(filtered[highlighted]);
        }
        break;
      case 'Escape':
        setOpen(false);
        setSearch('');
        setHighlighted(0);
        break;
      default:
        break;
    }
  };

  return (
    <div className="sd-wrap" ref={ref}>
      <div className="sd-trigger" onClick={() => setOpen(!open)}>
        <span className={selected ? 'sd-selected' : 'sd-placeholder'}>
          {selected ? selected.name : 'Select item'}
        </span>
        <span className="sd-arrow">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="sd-dropdown">
          <input
            className="sd-search"
            type="text"
            placeholder="Search... (↑↓ navigate, Enter select)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          <div className="sd-list" ref={listRef}>
            {filtered.length === 0 ? (
              <div className="sd-empty">No items found</div>
            ) : (
              filtered.map((item, index) => (
                <div
                  key={item._id}
                  className={`sd-item ${value === item._id ? 'active' : ''} ${highlighted === index ? 'highlighted' : ''}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlighted(index)}
                >
                  <span>{item.name}</span>
                  <span className="sd-item-price">Rs.{item.price}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SalePurchase = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [rows, setRows] = useState([emptyRow()]);
  const [tax, setTax] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState(null);

  const today = new Date().toLocaleString('en-PK', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data } = await API.get('/menu');
        setMenuItems(data);
      } catch {
        toast.error('Failed to load menu items');
      }
    };
    fetchMenu();
  }, []);

  const handleItemSelect = (index, menuItemId) => {
    const selected = menuItems.find((m) => m._id === menuItemId);
    if (!selected) return;
    const updated = [...rows];
    updated[index] = {
      menuItemId: selected._id,
      name: selected.name,
      price: selected.price,
      quantity: updated[index].quantity,
      subtotal: selected.price * updated[index].quantity,
    };
    setRows(updated);
  };

  const handleQtyChange = (index, qty) => {
    const updated = [...rows];
    const quantity = parseInt(qty) || 1;
    updated[index].quantity = quantity;
    updated[index].subtotal = updated[index].price * quantity;
    setRows(updated);
  };

  const addRow = () => setRows([...rows, emptyRow()]);
  const removeRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated.length ? updated : [emptyRow()]);
  };

  const subtotal = rows.reduce((sum, r) => sum + (r.subtotal || 0), 0);
  const taxAmount = (subtotal * tax) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = async () => {
    if (!customerName.trim()) return toast.error('Enter customer name');
    const validRows = rows.filter((r) => r.menuItemId && r.quantity > 0);
    if (validRows.length === 0) return toast.error('Add at least one item');
    setSubmitting(true);
    try {
      const { data } = await API.post('/billing', { customerName, items: validRows, tax });
      setSuccessInvoice(data);
      setCustomerName('');
      setRows([emptyRow()]);
      setTax(0);
      toast.success('Bill created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sp-page">

      {/* Top Bar */}
      <div className="sp-topbar">
        <div>
          <h1>Sale / Purchase</h1>
          
        </div>
        <span className="sp-date">{today}</span>
      </div>

      <div className="sp-body">

        {/* Customer Name */}
        <div className="sp-row-inline">
          <label className="sp-label">Customer</label>
          <input
            className="sp-input sp-customer"
            type="text"
            placeholder="Customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        {/* Items Table */}
        <div className="sp-table-wrap">
          <table className="sp-table">
            <thead>
              <tr>
                <th>
                  {/* Add button in header — right next to items */}
                  <button className="sp-add-row" onClick={addRow}>+ Add</button>
                </th>
                <th>Item</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
                {/* <th>
               
                  <button className="sp-add-row" onClick={addRow}>+ Add</button>
                </th> */}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td className="sp-num">{index + 1}</td>
                  <td>
                    <SearchableDropdown
                      menuItems={menuItems}
                      value={row.menuItemId}
                      onChange={(id) => handleItemSelect(index, id)}
                    />
                  </td>
                  <td className="sp-price">{row.price ? `Rs.${row.price}` : '—'}</td>
                  <td>
                    <input
                      className="sp-qty"
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => handleQtyChange(index, e.target.value)}
                    />
                  </td>
                  <td className="sp-subtotal">{row.subtotal ? `Rs.${row.subtotal}` : '—'}</td>
                  <td>
                    <button className="sp-remove" onClick={() => removeRow(index)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer: Tax + Summary */}
        <div className="sp-footer">
          <div className="sp-tax-wrap">
            <label className="sp-label">GST / Tax</label>
            <div className="sp-tax-row">
              <input
                className="sp-input sp-tax-input"
                type="number"
                min="0"
                max="100"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              />
              <span className="sp-percent">%</span>
            </div>
          </div>

          <div className="sp-summary">
            <div className="sp-sum-row">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            {tax > 0 && (
              <div className="sp-sum-row muted">
                <span>GST ({tax}%)</span>
                <span>Rs. {taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="sp-sum-row total">
              <span>Total</span>
              <span>Rs. {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="sp-actions">
          <button className="sp-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Bill'}
          </button>
        </div>

      </div>

      {/* Invoice Preview Modal */}
      {successInvoice && (
        <div className="modal-overlay" onClick={() => setSuccessInvoice(null)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-header">
              <div>
                <h2>Bill Created ✓</h2>
                <span className="sp-inv-no">{successInvoice.invoiceNumber}</span>
              </div>
              <button className="sp-modal-close" onClick={() => setSuccessInvoice(null)}>✕</button>
            </div>
            <div className="sp-modal-body">
              <div className="sp-inv-meta">
                <span><b>Customer:</b> {successInvoice.customerName}</span>
                <span><b>Date:</b> {today}</span>
              </div>
              <table className="sp-inv-table">
                <thead>
                  <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {successInvoice.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>Rs.{item.price}</td>
                      <td>Rs.{item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="sp-inv-totals">
                <div className="sp-inv-row"><span>Subtotal</span><span>Rs.{successInvoice.subtotal.toFixed(2)}</span></div>
                {successInvoice.tax > 0 && (
                  <div className="sp-inv-row muted"><span>GST ({successInvoice.tax}%)</span><span>Rs.{(successInvoice.totalAmount - successInvoice.subtotal).toFixed(2)}</span></div>
                )}
                <div className="sp-inv-row grand"><span>Grand Total</span><span>Rs.{successInvoice.totalAmount.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SalePurchase;