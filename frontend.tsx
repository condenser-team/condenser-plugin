/// <reference lib="dom" />
import { useState, useEffect } from 'react';

// ---- Plugin identity ----
// key must be unique across all installed plugins and match the directory name.
export const key   = 'condenser-plugin';
export const title = 'Condenser Plugin';

// The route condenser will register for your main page inside Big Picture Mode.
export const route = '/condenser-plugin/home';

// ---- Condenser API ----
// All methods live on window.condenser, injected by condenser-app before plugins load.
const { navigate, back }                                                   = condenser.nav;
const { showToast, showModal, showContextMenu, Focusable, Menu, MenuItem } = condenser.ui;
const { createStyleToggle }                                                = condenser.css;

// ---- Module-level styling state ----
// Lives outside React so it survives Page unmount/remount when navigating away and back.
const style = createStyleToggle(key, `.Panel { border-radius: 10px; overflow: hidden; }`);

// ---- Lifecycle ----
export function onMount(): void {}

// Called by Condenser before the plugin is unloaded, disabled, or hot-reloaded.
export function onUnmount(): void {
  style.disable();
}

// ---- Page ----
// Full-screen page shown when the user opens your plugin.
export function Page(_: { websocketUrl: string }) {
  const send = condenser.plugin.useSend(key);
  const [count, setCount] = useState(0);
  const [info, setInfo] = useState<{ platform: string; uptime: number; memory: number } | null>(null);
  // Initialise from module-level var so state is correct after navigating back to this page.
  const [stylingEnabled, setStylingEnabled] = useState(() => style.enabled);

  useEffect(() => {
    send('getCount').then((r: any) => setCount(r.count));
    send('getInfo').then((r: any) => setInfo(r)).catch(() => {});
  }, []);

  const handleClick = async () => {
    const r = await send('click') as { count: number };
    setCount(r.count);
  };

  const handleToast = () => showToast({
    title,
    body: 'showToast() called from condenser.ui.',
    duration: 4000,
  });

  const handleModal = () => showModal(
    <p>Opened via showModal() from condenser.ui.</p>,
    undefined,
    { strTitle: 'Modal component' },
  );

  const handleContextMenu = (e: any) => {
    e.preventDefault();
    showContextMenu(
      <Menu label={title}>
        <MenuItem onClick={handleModal}>Show Modal</MenuItem>
        <MenuItem onClick={handleToast}>Show Toast</MenuItem>
      </Menu>,
      e.currentTarget,
    );
  };

  const handleToggleStyling = () => {
    style.enabled ? style.disable() : style.enable();
    setStylingEnabled(style.enabled);
  };

  const fmt = (s: number) => `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'white' }}>
      <button
        className="DialogButton _DialogLayout Secondary"
        style={{ margin: '8px 16px', width: 'auto', alignSelf: 'flex-start' }}
        onClick={back}
      >
        ← Back
      </button>
      <Focusable flow-children="column" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px 16px' }}>
        <button className="DialogButton _DialogLayout Secondary" onClick={handleClick} onContextMenu={handleContextMenu}>
          {count > 0 ? `Send Request (${count})` : 'Send Request'}
        </button>
        <button className="DialogButton _DialogLayout Secondary" onClick={handleModal}>Show Modal</button>
        <button className="DialogButton _DialogLayout Secondary" onClick={handleToast}>Show Toast</button>
        <button className="DialogButton _DialogLayout Secondary" onClick={handleToggleStyling}>
          {stylingEnabled ? 'Disable styling' : 'Enable styling'}
        </button>
        {info && (
          <div style={{ fontSize: 12, color: 'var(--gpSystemLighterGrey)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Platform: {info.platform}</span>
            <span>Uptime: {fmt(info.uptime)}</span>
            <span>Free memory: {Math.round(info.memory / 1024 / 1024)} MB</span>
          </div>
        )}
      </Focusable>
    </div>
  );
}

// ---- Persistent ----
// Always-visible element rendered over the Steam UI (e.g. a status badge or button).
// Remove this export if your plugin doesn't need a persistent surface.
export function Persistent(_: { websocketUrl: string }) {
  return (
    <button
      onClick={() => navigate(route)}
      title={title}
      style={{
        position: 'fixed',
        top: '60px',
        right: '32px',
        background: 'rgba(0,0,0,0.7)',
        color: '#4fc3f7',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '4px 10px',
        borderRadius: '6px',
        border: '1px solid rgba(79,195,247,0.4)',
        cursor: 'pointer',
        zIndex: 9999,
      }}
    >
      {title}
    </button>
  );
}
