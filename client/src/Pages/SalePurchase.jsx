import { useState, useEffect } from 'react';
import API from '../Api/Axios';
import toast from 'react-hot-toast';
import './SalePurchase.css';

const emptyRow = () => ({ menuItemId: '', name: '', price: 0, quantity: 1, subtotal: 0 });

const SalePurchase = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [rows, setRows] = useState([emptyRow()]);
  const [tax, setTax] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState(null);

  const today = new Date().toLocaleString('en-PK', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

  // Fetch menu items
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

  // Handle item dropdown change
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

  // Handle quantity change
  const handleQtyChange = (index, qty) => {
    const updated = [...rows];
    const quantity = parseInt(qty) || 1;
    updated[index].quantity = quantity;
    updated[index].subtotal = updated[index].price * quantity;
    setRows(updated);
  };

  // Add new row
  const addRow = () => setRows([...rows, emptyRow()]);

  // Remove row
  const removeRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated.length ? updated : [emptyRow()]);
  };

  // Calculations
  const subtotal = rows.reduce((sum, r) => sum + (r.subtotal || 0), 0);
  const taxAmount = (subtotal * tax) / 100;
  const total = subtotal + taxAmount;

  // Submit
  const handleSubmit = async () => {
    if (!customerName.trim()) return toast.error('Enter customer name');
    const validRows = rows.filter((r) => r.menuItemId && r.quantity > 0);
    if (validRows.length === 0) return toast.error('Add at least one item');

    setSubmitting(true);
    try {
      const { data } = await API.post('/billing', {
        customerName,
        items: validRows,
        tax,
      });
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

      {/* Page Header */}
      <div className="sp-topbar">
        <div>
          <h1>Sale / Purchase</h1>
          <p>Create a new bill for your customer</p>
        </div>
        <span className="sp-date">{today}</span>
      </div>

      <div className="sp-body">

        {/* Customer Info */}
        <div className="sp-section">
          <label className="sp-label">Customer Name</label>
          <input
            className="sp-input"
            type="text"
            placeholder="e.g. Ahmed Khan"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        {/* Items Table */}
        <div className="sp-section">
          <div className="sp-section-header">
            <label className="sp-label">Items</label>
            <button className="sp-add-row" onClick={addRow}>+ Add Item</button>
          </div>

          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <select
                        className="sp-select"
                        value={row.menuItemId}
                        onChange={(e) => handleItemSelect(index, e.target.value)}
                      >
                        <option value="">Select item</option>
                        {menuItems.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="sp-price">
                      {row.price ? `Rs. ${row.price}` : '—'}
                    </td>
                    <td>
                      <input
                        className="sp-qty"
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => handleQtyChange(index, e.target.value)}
                      />
                    </td>
                    <td className="sp-subtotal">
                      {row.subtotal ? `Rs. ${row.subtotal}` : '—'}
                    </td>
                    <td>
                      <button className="sp-remove" onClick={() => removeRow(index)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tax + Summary */}
        <div className="sp-footer">

          {/* Tax Input */}
          <div className="sp-tax-wrap">
            <label className="sp-label">GST / Tax (%)</label>
            <div className="sp-tax-input-wrap">
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

          {/* Bill Summary */}
          <div className="sp-summary">
            <div className="sp-summary-row">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            {tax > 0 && (
              <div className="sp-summary-row tax-row">
                <span>GST ({tax}%)</span>
                <span>Rs. {taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="sp-summary-row total-row">
              <span>Total</span>
              <span>Rs. {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="sp-actions">
          <button
            className="sp-submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Creating Bill...' : 'Create Bill'}
          </button>
        </div>

      </div>

      {/* Success Invoice Preview */}
      {successInvoice && (
        <div className="modal-overlay" onClick={() => setSuccessInvoice(null)}>
          <div className="modal inv-preview" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bill Created ✓</h2>
              <button className="modal-close" onClick={() => setSuccessInvoice(null)}>✕</button>
            </div>
            <div className="inv-preview-body">
              <div className="inv-meta">
                <div>
                  <span className="inv-label">Invoice No.</span>
                  <span className="inv-value">{successInvoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="inv-label">Customer</span>
                  <span className="inv-value">{successInvoice.customerName}</span>
                </div>
                <div>
                  <span className="inv-label">Date</span>
                  <span className="inv-value">{today}</span>
                </div>
              </div>

              <table className="inv-items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {successInvoice.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>Rs. {item.price}</td>
                      <td>Rs. {item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="inv-totals">
                <div className="inv-total-row">
                  <span>Subtotal</span>
                  <span>Rs. {successInvoice.subtotal.toFixed(2)}</span>
                </div>
                {successInvoice.tax > 0 && (
                  <div className="inv-total-row">
                    <span>GST ({successInvoice.tax}%)</span>
                    <span>Rs. {(successInvoice.totalAmount - successInvoice.subtotal).toFixed(2)}</span>
                  </div>
                )}
                <div className="inv-total-row grand">
                  <span>Grand Total</span>
                  <span>Rs. {successInvoice.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SalePurchase;