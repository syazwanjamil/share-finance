import { useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import styles from "./Tabs.module.css";

export interface TabItem {
  id: string;
  label: ReactNode;
}

interface TabsProps {
  idBase: string;
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  label: string;
}

export function tabIds(idBase: string, id: string) {
  return { tab: `${idBase}-tab-${id}`, panel: `${idBase}-panel-${id}` };
}

export function Tabs({ idBase, tabs, activeId, onChange, label }: TabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div className={styles.tabs} role="tablist" aria-label={label}>
      {tabs.map((tab, i) => {
        const selected = tab.id === activeId;
        const ids = tabIds(idBase, tab.id);
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={ids.tab}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={ids.panel}
            tabIndex={selected ? 0 : -1}
            className={`${styles.tab} ${selected ? styles.active : ""}`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ idBase, id, children }: { idBase: string; id: string; children: ReactNode }) {
  const ids = tabIds(idBase, id);
  return (
    <div id={ids.panel} role="tabpanel" aria-labelledby={ids.tab} tabIndex={0} className={styles.panel}>
      {children}
    </div>
  );
}
