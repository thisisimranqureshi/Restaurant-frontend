import { useState, useEffect, useRef, useCallback } from 'react';
import API from '../Api/Axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import './SalePurchase.css';

const emptyRow = () => ({ menuItemId: '', name: '', price: 0, quantity: 1, subtotal: 0 });

// ─────────────────────────────────────────────
// SearchableDropdown
// ─────────────────────────────────────────────
const SearchableDropdown = ({ menuItems, value, onChange, triggerFocus, onFocusDone, onOpenChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef(null);
  const listRef = useRef(null);

  const selected = menuItems.find((m) => m._id === value);
  const filtered = menuItems.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  // Tell parent whenever open state changes
  const setOpenAndNotify = (val) => {
    setOpen(val);
    onOpenChange?.(val);
  };

  // Auto-focus this dropdown when parent asks (new row added)
  useEffect(() => {
    if (triggerFocus) {
      setOpenAndNotify(true);
      setTimeout(() => {
        const input = ref.current?.querySelector('.sd-search');
        if (input) input.focus();
      }, 30);
      onFocusDone?.();
    }
  }, [triggerFocus]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpenAndNotify(false);
        setSearch('');
        setHighlighted(0);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setHighlighted(0); }, [search]);

  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('.sd-item');
      if (items[highlighted]) items[highlighted].scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted]);

  const handleSelect = (item) => {
    onChange(item._id);
    setOpenAndNotify(false);
    setSearch('');
    setHighlighted(0);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') setOpenAndNotify(true);
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlighted((p) => Math.min(p + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlighted((p) => Math.max(p - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (filtered[highlighted]) handleSelect(filtered[highlighted]);
        break;
      case 'Escape':
        setOpenAndNotify(false);
        setSearch('');
        setHighlighted(0);
        break;
      default:
        // Block ALL Ctrl+Enter from reaching window while dropdown is open
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
        }
        break;
    }
  };

  return (
    <div className="sd-wrap" ref={ref}>
      <div className="sd-trigger" onClick={() => setOpenAndNotify(!open)}>
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

// ─────────────────────────────────────────────
// SalePurchase
// ─────────────────────────────────────────────
const SalePurchase = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [rows, setRows] = useState([emptyRow()]);
  const [tax, setTax] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState(null);
  const [focusRowIndex, setFocusRowIndex] = useState(null);
  const [focusQtyIndex, setFocusQtyIndex] = useState(null);
  const qtyRefs = useRef([]);

  // Track how many dropdowns are currently open — Ctrl+Enter blocked when > 0
  const openDropdownCount = useRef(0);

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

  // Focus + select-all on qty input when requested
  useEffect(() => {
    if (focusQtyIndex !== null) {
      setTimeout(() => {
        const input = qtyRefs.current[focusQtyIndex];
        if (input) {
          input.focus();
          input.select();
        }
        setFocusQtyIndex(null);
      }, 40);
    }
  }, [focusQtyIndex]);

  const addRow = useCallback(() => {
    setRows((prev) => {
      const lastRow = prev[prev.length - 1];
      // If the last row is still empty, just focus it — don't add another
      if (!lastRow.menuItemId) {
        setFocusRowIndex(prev.length - 1);
        return prev;
      }
      const next = [...prev, emptyRow()];
      setFocusRowIndex(next.length - 1);
      return next;
    });
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        // Block if any dropdown is open
        if (openDropdownCount.current > 0) return;
        e.preventDefault();
        addRow();
        return;
      }
      if (e.key === 'Escape' && successInvoice) {
        setSuccessInvoice(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addRow, successInvoice]);

  const handleDropdownOpenChange = (isOpen) => {
    openDropdownCount.current = Math.max(0, openDropdownCount.current + (isOpen ? 1 : -1));
  };

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
    // Auto-jump to qty after item selected
    setFocusQtyIndex(index);
  };

  const handleQtyChange = (index, qty) => {
    const updated = [...rows];
    const quantity = parseInt(qty) || 1;
    updated[index].quantity = quantity;
    updated[index].subtotal = updated[index].price * quantity;
    setRows(updated);
  };

  const handleQtyKeyDown = (e, index) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      addRow();
      return;
    }
    if ((e.key === 'Backspace' || e.key === 'Delete') && !rows[index].menuItemId) {
      e.preventDefault();
      removeRow(index);
    }
  };

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
        <h1>Sale / Purchase</h1>
        <div className="sp-topbar-right">
          <button
            className="sp-shortcuts-btn"
            onClick={() => navigate('/shortcuts')}
            title="View keyboard shortcuts"
          >
            ⌨ Shortcuts
          </button>
          <span className="sp-date">{today}</span>
        </div>
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
                  <button className="sp-add-row" onClick={addRow} title="Add row (Ctrl+Enter)">+ Add</button>
                </th>
                <th>Item</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
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
                      triggerFocus={focusRowIndex === index}
                      onFocusDone={() => setFocusRowIndex(null)}
                      onOpenChange={handleDropdownOpenChange}
                    />
                  </td>
                  <td className="sp-price">{row.price ? `Rs.${row.price}` : '—'}</td>
                  <td>
                    <input
                      className="sp-qty"
                      type="number"
                      min="1"
                      value={row.quantity}
                      ref={(el) => (qtyRefs.current[index] = el)}
                      onChange={(e) => handleQtyChange(index, e.target.value)}
                      onKeyDown={(e) => handleQtyKeyDown(e, index)}
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
                  <div className="sp-inv-row muted">
                    <span>GST ({successInvoice.tax}%)</span>
                    <span>Rs.{(successInvoice.totalAmount - successInvoice.subtotal).toFixed(2)}</span>
                  </div>
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