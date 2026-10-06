import { BookText, Home, UserRound } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAppData, useCurrentUser } from "../../state/AppDataContext";
import { hasUserPaidCurrentRound } from "../../lib/selectors";
import { seriesClass } from "../../lib/series";
import { BrandMark } from "../ui/BrandMark";
import styles from "./AppShell.module.css";

const DESTINATIONS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/ledger", label: "Ledger", icon: BookText },
  { to: "/account", label: "Account", icon: UserRound },
];

export function AppShell() {
  const { state } = useAppData();
  const currentUser = useCurrentUser();
  const location = useLocation();

  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>

      <nav className={styles.rail} aria-label="Main">
        <NavLink to="/home" className={styles.brand}>
          <BrandMark />
        </NavLink>

        <ul className={styles.railList}>
          {DESTINATIONS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink to={to} className={({ isActive }) => `${styles.railItem} ${isActive ? styles.active : ""}`}>
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {state.groups.length > 0 ? (
          <div className={styles.groups}>
            <p className={styles.groupsLabel} id="rail-groups">
              Your groups
            </p>
            <ul className={styles.groupList} aria-labelledby="rail-groups">
              {state.groups.map((bundle) => {
                const { group } = bundle;
                const owes = !hasUserPaidCurrentRound(bundle, currentUser.id);
                const active = location.pathname.startsWith(`/groups/${group.id}`);
                return (
                  <li key={group.id}>
                    <NavLink
                      to={`/groups/${group.id}`}
                      className={`${styles.groupItem} ${active ? styles.active : ""} ${seriesClass(group.id)}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className={styles.swatch} aria-hidden="true" />
                      <span className={styles.groupName}>{group.name}</span>
                      {owes ? (
                        <span className={styles.owes}>
                          <span className="visually-hidden">You haven't paid this round</span>
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </nav>

      <main id="main" className={styles.main} tabIndex={-1}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>

      <nav className={styles.tabbar} aria-label="Main" data-print-hide>
        {DESTINATIONS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.tab} ${isActive || (to === "/home" && location.pathname.startsWith("/groups")) ? styles.tabActive : ""}`
            }
          >
            <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
