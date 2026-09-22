import { Bell, BookText, Home, Users, Wallet } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAppData } from "../../state/AppDataContext";
import { hasUserPaidCurrentRound } from "../../mock/selectors";
import { Avatar } from "../ui/Avatar";
import { formatDateFull } from "../../lib/date";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  const { state } = useAppData();
  const location = useLocation();
  const onGroupsSection = location.pathname.startsWith("/groups") || location.pathname === "/home";

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logo} />
        <span className={styles.brandName}>ShareFinance</span>
      </div>

      <NavLink
        to="/home"
        end
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
      >
        <Home size={14} className={styles.icon} />
        Home
      </NavLink>

      <div className={`${styles.navItem} ${onGroupsSection && location.pathname !== "/home" ? styles.navItemActive : ""}`}>
        <Users size={14} className={styles.icon} />
        Groups
      </div>
      <div className={styles.subList}>
        {state.groups.map(({ group }) => {
          const unpaid = !hasUserPaidCurrentRound(
            state.groups.find((b) => b.group.id === group.id)!,
            state.currentUser.id,
          );
          const active = location.pathname.includes(group.id);
          return (
            <NavLink
              key={group.id}
              to={`/groups/${group.id}`}
              className={`${styles.subItem} ${active ? styles.subItemActive : ""}`}
            >
              <span>{group.name}</span>
              {unpaid ? <span className={styles.dot} /> : null}
            </NavLink>
          );
        })}
      </div>

      <div className={styles.navItem}>
        <Wallet size={14} className={styles.icon} />
        Payments
      </div>
      <div className={styles.navItem}>
        <BookText size={14} className={styles.icon} />
        Ledger
      </div>
      <div className={styles.navItem}>
        <Bell size={14} className={styles.icon} />
        Notifications
      </div>

      <div className={styles.spacer}>
        <div className={styles.verifyCard}>
          <span className={styles.verifyTitle}>Identity verified</span>
          <span className={styles.verifySub}>
            {state.currentUser.mykadVerifiedDate
              ? `MyKad checked ${formatDateFull(state.currentUser.mykadVerifiedDate)}. Payouts enabled.`
              : "MyKad not verified yet."}
          </span>
        </div>
        <div className={styles.userRow}>
          <Avatar initials={state.currentUser.initials} size={22} />
          {state.currentUser.name}
        </div>
      </div>
    </aside>
  );
}
