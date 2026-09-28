import { Bell, BookText, Home, LogOut, Users, Wallet } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAppData, useCurrentUser } from "../../state/AppDataContext";
import { hasUserPaidCurrentRound } from "../../lib/selectors";
import { Avatar } from "../ui/Avatar";
import { formatDateFull } from "../../lib/date";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  const { state, actions } = useAppData();
  const currentUser = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const onGroupsSection = location.pathname.startsWith("/groups") || location.pathname === "/home";

  async function handleLogout() {
    await actions.logout();
    navigate("/login", { replace: true });
  }

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
            currentUser.id,
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
            {currentUser.mykadVerifiedDate
              ? `MyKad checked ${formatDateFull(currentUser.mykadVerifiedDate)}. Payouts enabled.`
              : "MyKad not verified yet."}
          </span>
        </div>
        <div className={styles.userRow}>
          <Avatar initials={currentUser.initials} size={22} />
          <span className={styles.userName}>{currentUser.name}</span>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
