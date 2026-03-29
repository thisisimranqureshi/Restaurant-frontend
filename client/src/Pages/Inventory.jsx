import { useState, useEffect } from 'react';
import API from '../Api/Axios';
import toast from 'react-hot-toast';
import './Inventory.css';

const UNITS = ['mg', 'g', 'kg', 'ml', 'litre'];


const emptyIngredient = () => ({ name: '', quantity: '', unit: 'g' });

const emptyForm = () => ({
    name: '',
    price: '',
    category: '',
    ingredients: [emptyIngredient()],
});

const Inventory = () => {
    const [viewIngredients, setViewIngredients] = useState(null); // holds item for popup
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm());
    const [submitting, setSubmitting] = useState(false);

    const fetchItems = async () => {
        try {
            const { data } = await API.get('/menu');
            setItems(data);
        } catch (err) {
            toast.error('Failed to load items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    // Form field change
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Ingredient field change
    const handleIngredientChange = (index, field, value) => {
        const updated = [...form.ingredients];
        updated[index][field] = value;
        setForm({ ...form, ingredients: updated });
    };

    // Add new ingredient row
    const addIngredient = () => {
        setForm({ ...form, ingredients: [...form.ingredients, emptyIngredient()] });
    };

    // Remove ingredient row
    const removeIngredient = (index) => {
        const updated = form.ingredients.filter((_, i) => i !== index);
        setForm({ ...form, ingredients: updated.length ? updated : [emptyIngredient()] });
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Filter empty ingredients
            const cleanIngredients = form.ingredients.filter(
                (ing) => ing.name.trim() && ing.quantity
            );

            const { data } = await API.post('/menu', {
                ...form,
                ingredients: cleanIngredients,
            });

            setItems([data, ...items]);
            toast.success(`${data.name} added!`);
            setShowModal(false);
            setForm(emptyForm());
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add item');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete item
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try {
            await API.delete(`/menu/${id}`);
            setItems(items.filter((i) => i._id !== id));
            toast.success('Item deleted');
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    return (
        <div className="inventory-page">

            {/* Top Bar */}
            <div className="inventory-topbar">
                <div>
                    <h1>Inventory</h1>
                    <p>{items.length} item{items.length !== 1 ? 's' : ''} total</p>
                </div>
                <button className="add-btn" onClick={() => setShowModal(true)}>
                    + Add Item
                </button>
            </div>

            {/* Items List */}
            {loading ? (
                <div className="inv-loading">Loading...</div>
            ) : items.length === 0 ? (
                <div className="inv-empty">
                    <span>🍽️</span>
                    <p>No items yet. Add your first menu item!</p>
                </div>
            ) : (
                <div className="inv-table-wrap">
                    <table className="inv-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Ingredients</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item._id}>
                                    <td>{index + 1}</td>
                                    <td className="item-name">{item.name}</td>
                                    <td><span className="category-tag">{item.category}</span></td>
                                    <td className="item-price">Rs. {item.price}</td>
                                    <td>
                                        {item.ingredients.length > 0 ? (
                                            <div className="ing-list">
                                                {item.ingredients.slice(0, 2).map((ing, i) => (
                                                    <span key={i} className="ing-tag">
                                                        {ing.name} {ing.quantity}{ing.unit}
                                                    </span>
                                                ))}
                                                {item.ingredients.length > 2 && (
                                                    <button
                                                        className="ing-more"
                                                        onClick={() => setViewIngredients(item)}
                                                    >
                                                        +{item.ingredients.length - 2} more
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="no-ing">—</span>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(item._id, item.name)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>

                        <div className="modal-header">
                            <h2>Add New Item</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">

                            {/* Item Info */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Item Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="e.g. Chicken Biryani"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Price (Rs.)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        placeholder="e.g. 350"
                                        value={form.price}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Category</label>
                                <input
                                    type="text"
                                    name="category"
                                    placeholder="e.g. Breakfast, Beverages, Snacks"
                                    value={form.category}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Ingredients */}
                            <div className="ingredients-section">
                                <div className="ing-header">
                                    <label>Ingredients</label>
                                    <button type="button" className="add-ing-btn" onClick={addIngredient}>
                                        + Add
                                    </button>
                                </div>

                                {form.ingredients.map((ing, index) => (
                                    <div key={index} className="ing-row">
                                        <input
                                            type="text"
                                            placeholder="Ingredient name"
                                            value={ing.name}
                                            onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={ing.quantity}
                                            onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                                            min="0"
                                        />
                                        <select
                                            value={ing.unit}
                                            onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                                        >
                                            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                        <button
                                            type="button"
                                            className="remove-ing"
                                            onClick={() => removeIngredient(index)}
                                        >✕</button>
                                    </div>
                                ))}
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn" disabled={submitting}>
                                    {submitting ? 'Adding...' : 'Add Item'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
            {/* Ingredients Viewer Popup */}
            {viewIngredients && (
                <div className="modal-overlay" onClick={() => setViewIngredients(null)}>
                    <div className="modal ing-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{viewIngredients.name} — Ingredients</h2>
                            <button className="modal-close" onClick={() => setViewIngredients(null)}>✕</button>
                        </div>
                        <div className="ing-viewer">
                            {viewIngredients.ingredients.map((ing, i) => (
                                <div key={i} className="ing-viewer-row">
                                    <span className="ing-viewer-name">{ing.name}</span>
                                    <span className="ing-viewer-qty">{ing.quantity} {ing.unit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Inventory;