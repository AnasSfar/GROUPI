import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as notificationsApi from '../api/notificationsApi';
import {
  IconGauge,
  IconBell,
  IconLogOut,
  IconBookOpen,
  IconLayers,
  IconClipboardCheck,
  IconUserPlus,
  IconWallet,
  IconDownload,
  IconCreditCard,
  IconChildren,
  IconSearch,
  IconUsers,
  IconCalendarCheck,
  IconUserCheck,
} from './icons';

const UNREAD_POLL_INTERVAL_MS = 30_000;

interface NavItem {
  to: string;
  icon: ReactNode;
  label: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function compactRoles(roles: string[] | undefined): string {
  if (!roles?.length) return 'Compte';
  if (roles.includes('SUPER_ADMIN')) return 'Super Admin';
  if (roles.includes('ADMIN')) return 'Admin';
  if (roles.includes('TEACHER')) return 'Professeur';
  if (roles.includes('PARENT')) return 'Parent';
  return roles.join(', ');
}

/**
 * Ossature commune aux pages authentifiées : nav latérale par rôle (DA "Atelier Clair", skill
 * groupi-design). Les liens sont regroupés par domaine pour garder l'app lisible même avec 25+ écrans.
 */
export function AppLayout() {
  const { currentUser, logout, getAccessToken } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const { count } = await notificationsApi.getUnreadCount(token);
        if (!cancelled) setUnreadCount(count);
      } catch {
        // Ch.18 : le centre d'activités n'est jamais bloquant ; un échec de sondage reste silencieux.
      }
    }
    poll();
    const interval = setInterval(poll, UNREAD_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [getAccessToken]);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const isAdmin = currentUser?.roles.includes('SUPER_ADMIN') || currentUser?.roles.includes('ADMIN');
  const isTeacher = currentUser?.roles.includes('TEACHER');
  const isParent = currentUser?.roles.includes('PARENT');
  const workspaceLabel = compactRoles(currentUser?.roles);

  const sections = useMemo<NavSection[]>(() => {
    const result: NavSection[] = [
      {
        title: 'Accueil',
        items: [{ to: '/dashboard', icon: <IconGauge />, label: 'Tableau de bord' }],
      },
    ];

    if (isTeacher) {
      result.push({
        title: 'Professeur',
        items: [
          { to: '/teacher/profile', icon: <IconBookOpen />, label: 'Mon profil' },
          { to: '/teacher/groups', icon: <IconLayers />, label: 'Mes groupes' },
          { to: '/teacher/enrollments', icon: <IconClipboardCheck />, label: 'Inscriptions' },
          { to: '/teacher/pre-enrollments', icon: <IconUserPlus />, label: 'Préinscriptions' },
          { to: '/teacher/accounting', icon: <IconWallet />, label: 'Comptabilité' },
          { to: '/teacher/exports', icon: <IconDownload />, label: 'Exports' },
          { to: '/teacher/subscription', icon: <IconCreditCard />, label: 'Abonnement' },
        ],
      });
    }

    if (isParent) {
      result.push({
        title: 'Parent',
        items: [
          { to: '/parent/children', icon: <IconChildren />, label: 'Mes enfants' },
          { to: '/parent/groups', icon: <IconSearch />, label: 'Rechercher un groupe' },
          { to: '/parent/enrollments', icon: <IconClipboardCheck />, label: 'Mes inscriptions' },
          { to: '/parent/pre-enrollments', icon: <IconUserPlus />, label: 'Mes préinscriptions' },
          { to: '/parent/exports', icon: <IconDownload />, label: 'Exports' },
          { to: '/parent/school-requests', icon: <IconBookOpen />, label: 'Établissements' },
        ],
      });
    }

    if (isAdmin) {
      result.push({
        title: 'Administration',
        items: [
          { to: '/admin/users', icon: <IconUsers />, label: 'Comptes utilisateurs' },
          { to: '/admin/school-situations', icon: <IconCalendarCheck />, label: 'Situations scolaires' },
          { to: '/admin/school-requests', icon: <IconSearch />, label: "Demandes d'établissement" },
          { to: '/admin/academic-years', icon: <IconCalendarCheck />, label: 'Années académiques' },
          { to: '/admin/subscriptions', icon: <IconCreditCard />, label: 'Abonnements' },
          { to: '/admin/exports', icon: <IconDownload />, label: 'Exports' },
        ],
      });
    }

    result.push({
      title: 'Suivi',
      items: [
        { to: '/notifications', icon: <IconBell />, label: 'Notifications', badge: unreadCount },
        { to: '/account', icon: <IconUserCheck />, label: 'Mon compte' },
      ],
    });

    return result;
  }, [isAdmin, isParent, isTeacher, unreadCount]);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link to="/dashboard" className="app-sidebar-brand">
          <img src="/favicon.png" alt="" />
          <span>GROUPI</span>
        </Link>
        <nav className="app-sidebar-nav" aria-label="Navigation principale">
          {sections.map((section) => (
            <div key={section.title} className="app-sidebar-section">
              <p className="app-sidebar-section-title">{section.title}</p>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={({ isActive }) => 'app-sidebar-link' + (isActive ? ' active' : '')}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {!!item.badge && (
                    <span className="app-sidebar-link-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="app-sidebar-footer">
          <div className="app-sidebar-user">
            <span className="app-sidebar-avatar">{currentUser?.email?.[0] ?? '?'}</span>
            {currentUser && <span className="app-sidebar-email">{currentUser.email}</span>}
          </div>
          <button type="button" onClick={handleLogout} aria-label="Se déconnecter" title="Se déconnecter">
            <IconLogOut width={16} height={16} />
          </button>
        </div>
      </aside>
      <main className="app-main">
        <div className="workspace-bar">
          <div>
            <span className="workspace-eyebrow">Espace {workspaceLabel}</span>
            {currentUser && <span className="workspace-email">{currentUser.email}</span>}
          </div>
          <Link to="/notifications" className="workspace-notifications">
            <IconBell width={15} height={15} />
            <span>{unreadCount > 0 ? `${unreadCount > 99 ? '99+' : unreadCount} non lue(s)` : 'Aucune non lue'}</span>
          </Link>
        </div>
        <div className="app-main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}