/// <reference lib="dom" />
import { useState, useEffect } from 'react';

// ---- Plugin identity ----
export const key   = 'condenser-plugin';
export const title = 'Condenser Plugin';
export const route = '/condenser-plugin/home';

// ---- Condenser API ----
const { navigate, back }              = condenser.nav;
const { showToast, showModal, Focusable, cls } = condenser.ui;
const { createStyleToggle, Target }   = condenser.css;

// ---- CSS examples ----
// Defined outside React so state survives navigation away and back.
//
// Cross-platform — stable IDs / aria-labels present on both desktop and SteamOS.
// SteamOS only   — [class*="module_ClassName_"] selectors from stable.orig.json.
//                  Desktop Steam obfuscates all class names, so these inject but match nothing.

const examples = [
  // ---- Cross-platform (stable IDs / aria-labels) ----
  {
    label:    'Header bar',
    color:    '#ff6b6b',
    scope:    '#header',
    platform: 'both',
    type:     'StyleProperties',
    hint:     'Targets the stable #header ID — red outline on the top status bar',
    toggle:   createStyleToggle(key,
      { outline: '3px solid #ff6b6b', outlineOffset: '-3px' },
      { window: Target.BigPicture, scope: '#header' },
    ),
  },
  {
    label:    'Main content',
    color:    '#4fc3f7',
    scope:    '#Main',
    platform: 'both',
    type:     'StyleProperties',
    hint:     'Targets the stable #Main ID — blue outline around the whole content area',
    toggle:   createStyleToggle(key,
      { outline: '3px solid #4fc3f7', outlineOffset: '-3px' },
      { window: Target.BigPicture, scope: '#Main' },
    ),
  },
  {
    label:    'Recent Games',
    color:    '#ffcc80',
    scope:    '[aria-label="Recent Games"]',
    platform: 'both',
    type:     'StyleProperties',
    hint:     'Targets [aria-label="Recent Games"] — amber outline on the game grid',
    toggle:   createStyleToggle(key,
      { outline: '3px solid #ffcc80', outlineOffset: '-3px' },
      { window: Target.BigPicture, scope: '[aria-label="Recent Games"]' },
    ),
  },
  {
    label:    "What's New feed",
    color:    '#81c784',
    scope:    '[aria-label="What\'s New"]',
    platform: 'both',
    type:     'StyleProperties',
    hint:     "Targets [aria-label=\"What's New\"] — green outline on the news feed",
    toggle:   createStyleToggle(key,
      { outline: '3px solid #81c784', outlineOffset: '-3px' },
      { window: Target.BigPicture, scope: "[aria-label=\"What's New\"]" },
    ),
  },
  {
    label:    'Global (all windows)',
    color:    '#e0e0e0',
    scope:    'Target.Global',
    platform: 'both',
    type:     'StyleSheet',
    hint:     'Targets body in BigPicture + MainMenu + QuickAccess — white outline on all BPM windows',
    toggle:   createStyleToggle(key,
      { 'body': { outline: '3px solid #e0e0e0', outlineOffset: '-3px' } },
      Target.Global,
    ),
  },
  {
    label:    'Quick Access popup',
    color:    '#80cbc4',
    scope:    'Target.QuickAccess',
    platform: 'both',
    type:     'StyleSheet',
    hint:     'Open Quick Access first then enable — teal outline on the popup body',
    toggle:   createStyleToggle(key,
      { 'body': { outline: '3px solid #80cbc4', outlineOffset: '-3px' } },
      Target.QuickAccess,
    ),
  },
  // ---- SteamOS / Steam Deck only (module class selectors) ----
  {
    label:    'Library section',
    color:    '#ce93d8',
    scope:    'Target.Library',
    platform: 'steamos',
    type:     'StyleProperties',
    hint:     'SteamOS only — purple outline scoped to [class*="gamepadlibrary_GamepadLibrary_"]',
    toggle:   createStyleToggle(key,
      { outline: '3px solid #ce93d8', outlineOffset: '-3px' },
      Target.Library,
    ),
  },
  {
    label:    'Settings dialog',
    color:    '#ef9a9a',
    scope:    'Target.Settings',
    platform: 'steamos',
    type:     'StyleSheet',
    hint:     'SteamOS only — purple dashed outlines on child elements inside Settings',
    toggle:   createStyleToggle(key,
      {
        '> *':     { outline: '1px dashed rgba(206,147,216,0.9)', outlineOffset: '-1px' },
        '> * > *': { backgroundColor: 'rgba(206,147,216,0.07)' },
      },
      Target.Settings,
    ),
  },
];

// ---- Lifecycle ----
export function onMount(): void {}

export function onUnmount(): void {
  examples.forEach(e => e.toggle.disable());
}

// ---- Page ----
export function Page(_: { websocketUrl: string }) {
  const send = condenser.plugin.useSend(key);
  const [_tick, setTick] = useState(0);
  const update = () => setTick(n => n + 1);

  const [count, setCount] = useState(0);
  const [info, setInfo] = useState<{ platform: string; uptime: number; memory: number } | null>(null);

  useEffect(() => {
    send('getCount').then((r: any) => setCount(r.count));
    send('getInfo').then((r: any) => setInfo(r)).catch(() => {});
  }, []);

  const anyEnabled = examples.some(e => e.toggle.enabled);

  const handleToggle = (ex: typeof examples[number]) => {
    ex.toggle.enabled ? ex.toggle.disable() : ex.toggle.enable();
    update();
  };

  const handleDisableAll = () => {
    examples.forEach(e => e.toggle.disable());
    update();
  };

  const fmt = (s: number) => `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'white', overflowY: 'auto' }}>
      <button
        className={cls.btnSecondary}
        style={{ margin: '8px 16px', width: 'auto', alignSelf: 'flex-start' }}
        onClick={back}
      >← Back</button>

      <Focusable flow-children="column" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 16px 16px' }}>

        <SectionLabel>BACKEND</SectionLabel>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={cls.btnSecondary}
            style={{ width: 'auto' }}
            onClick={async () => {
              const r = await send('click') as { count: number };
              setCount(r.count);
            }}
          >{count > 0 ? `Send Request (${count})` : 'Send Request'}</button>

          <button
            className={cls.btnSecondary}
            style={{ width: 'auto' }}
            onClick={() => showModal(
              <p>Opened via showModal() from condenser.ui.</p>,
              undefined,
              { strTitle: 'Modal example' },
            )}
          >Show Modal</button>

          <button
            className={cls.btnSecondary}
            style={{ width: 'auto' }}
            onClick={() => showToast({ title, body: 'showToast() called from condenser.ui.', duration: 4000 })}
          >Show Toast</button>
        </div>

        {info && (
          <div style={{ fontSize: 12, color: 'var(--gpSystemLighterGrey)', paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span>Platform: {info.platform}</span>
            <span>Uptime: {fmt(info.uptime)}</span>
            <span>Free memory: {Math.round(info.memory / 1024 / 1024)} MB</span>
          </div>
        )}

        <Divider />
        <SectionLabel>CSS INJECTION EXAMPLES</SectionLabel>

        {examples.map(ex => (
          <div
            key={ex.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              padding: '8px 10px',
              borderRadius: 6,
              background: ex.toggle.enabled ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${ex.toggle.enabled ? ex.color + '55' : 'transparent'}`,
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
                <span style={{
                  flexShrink: 0,
                  width: 8, height: 8,
                  borderRadius: '50%',
                  backgroundColor: ex.toggle.enabled ? ex.color : 'rgba(255,255,255,0.2)',
                  transition: 'background-color 0.15s',
                }} />
                <span style={{ fontWeight: 'bold', fontSize: 13 }}>{ex.label}</span>
                <span style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.1)',
                  color: 'var(--gpSystemLighterGrey)',
                  whiteSpace: 'nowrap',
                }}>{ex.type}</span>
                {ex.platform === 'steamos' && (
                  <span style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 3,
                    background: 'rgba(30,100,255,0.25)',
                    color: '#90caf9',
                    whiteSpace: 'nowrap',
                  }}>SteamOS only</span>
                )}
              </div>
              <button
                className={ex.toggle.enabled ? cls.btnPrimary : cls.btnSecondary}
                style={{ fontSize: 11, padding: '3px 12px', width: 'auto', minWidth: 70, flexShrink: 0 }}
                onClick={() => handleToggle(ex)}
              >{ex.toggle.enabled ? 'Disable' : 'Enable'}</button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--gpSystemLighterGrey)', paddingLeft: 16 }}>
              {ex.hint}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', paddingLeft: 16, fontFamily: 'monospace' }}>
              {ex.scope}
            </div>
          </div>
        ))}

        {anyEnabled && (
          <button
            className={cls.btnSecondary}
            style={{ marginTop: 4, width: 'auto', alignSelf: 'flex-start' }}
            onClick={handleDisableAll}
          >Disable all</button>
        )}

      </Focusable>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 'bold', letterSpacing: '0.08em', color: 'var(--gpSystemLighterGrey)', marginTop: 8, marginBottom: 2 }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />;
}

// ---- Persistent ----
// Always-visible button rendered over the Steam UI — opens the plugin page.
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
    >{title}</button>
  );
}
