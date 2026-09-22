import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomActionBar } from "./BottomActionBar";
import styles from "./AppShell.module.css";

export function AppShell() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
        <BottomActionBar />
      </div>
    </div>
  );
}
