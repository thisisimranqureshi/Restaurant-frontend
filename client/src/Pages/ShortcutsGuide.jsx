import { useNavigate } from 'react-router-dom';
import './Shortcutsguide.css';

const sections = [
  {
    title: 'Adding Items',
    rows: [
      { keys: ['Ctrl', 'Enter'], desc: 'Add a new item row (works from anywhere on page)' },
    ],
  },
  {
    title: 'Item Dropdown',
    rows: [
      { keys: ['↑', '↓'], desc: 'Navigate through search results' },
      { keys: ['Enter'], desc: 'Select highlighted item' },
      { keys: ['Esc'], desc: 'Close dropdown without selecting' },
    ],
  },
  {
    title: 'Quantity',
    rows: [
      { keys: ['Auto'], desc: 'Cursor jumps here automatically after item is selected' },
      { keys: ['Ctrl', 'Enter'], desc: 'Done with qty — add another row instantly' },
    ],
  },
  {
    title: 'Row Management',
    rows: [
      { keys: ['Backspace'], desc: 'Remove an empty row (when focused on its qty)' },
    ],
  },
  {
    title: 'General',
    rows: [
      { keys: ['Esc'], desc: 'Close the invoice preview modal' },
    ],
  },
];

const ShortcutsGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="sg-page">
      <div className="sg-topbar">
      
        <h1 className="sg-title">⌨ Keyboard Shortcuts</h1>
        <p className="sg-sub">Bill faster — keep your hands on the keyboard</p>
      </div>

      <div className="sg-content">
        {sections.map((sec) => (
          <div className="sg-section" key={sec.title}>
            <h2 className="sg-section-title">{sec.title}</h2>
            <div className="sg-table">
              {sec.rows.map((row, i) => (
                <div className="sg-row" key={i}>
                  <div className="sg-keys">
                    {row.keys.map((k, j) => (
                      <span key={j}>
                        <kbd className="sg-kbd">{k}</kbd>
                        {j < row.keys.length - 1 && <span className="sg-plus">+</span>}
                      </span>
                    ))}
                  </div>
                  <div className="sg-desc">{row.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="sg-tip">
          💡 <b>Pro tip:</b> Full billing flow without touching the mouse —
          type customer name → <kbd className="sg-kbd">Ctrl</kbd>+<kbd className="sg-kbd">Enter</kbd> →
          search item → <kbd className="sg-kbd">Enter</kbd> → type qty →
          <kbd className="sg-kbd">Ctrl</kbd>+<kbd className="sg-kbd">Enter</kbd> → repeat
        </div>
      </div>
    </div>
  );
};

export default ShortcutsGuide;