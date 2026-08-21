import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as notificationsApi from '../api/notificationsApi';
import * as teacherProfileApi from '../api/teacherProfileApi';
import type { TeacherProfile } from '../api/teacherProfileApi';
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
  IconDotsHorizontal,
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
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDockMoreOpen, setIsDockMoreOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const dockMoreMenuRef = useRef<HTMLDivElement | null>(null);

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
    navigate('/', { replace: true });
  }

  const isAdmin = currentUser?.roles.includes('SUPER_ADMIN') || currentUser?.roles.includes('ADMIN');
  const isTeacher = currentUser?.roles.includes('TEACHER');
  const isParent = currentUser?.roles.includes('PARENT');
  const workspaceLabel = compactRoles(currentUser?.roles);
  const profilePath = isTeacher ? '/teacher/profile' : '/account';
  const teacherDisplayName = teacherProfile
    ? `${teacherProfile.firstName} ${teacherProfile.lastName}`.trim()
    : null;
  // RM-SEC-001 : l'identifiant du compte est l'e-mail OU le téléphone — jamais les deux à coup sûr.
  const identityLabel = currentUser?.email ?? currentUser?.phone ?? null;
  const identityInitials =
    teacherDisplayName
      ?.split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    identityLabel?.slice(0, 2).toUpperCase() ||
    '?';

  useEffect(() => {
    let cancelled = false;
    async function loadTeacherIdentity() {
      if (!isTeacher) {
        setTeacherProfile(null);
        return;
      }
      const token = getAccessToken();
      if (!token) return;
      try {
        const profile = await teacherProfileApi.getMyProfile(token);
        if (!cancelled) setTeacherProfile(profile);
      } catch {
        if (!cancelled) setTeacherProfile(null);
      }
    }
    loadTeacherIdentity();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken, isTeacher]);

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsProfileMenuOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (!isDockMoreOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!dockMoreMenuRef.current?.contains(event.target as Node)) {
        setIsDockMoreOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsDockMoreOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDockMoreOpen]);

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
          { to: '/teacher/groups', icon: <IconLayers />, label: 'Mes groupes' },
          { to: '/teacher/students', icon: <IconChildren />, label: 'Mes eleves' },
          { to: '/teacher/sessions', icon: <IconCalendarCheck />, label: 'Mes seances' },
          { to: '/teacher/enrollments', icon: <IconClipboardCheck />, label: 'Inscriptions' },
          { to: '/teacher/accounting', icon: <IconWallet />, label: 'Paiements' },
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
          { to: '/admin/referentials', icon: <IconBookOpen />, label: 'Référentiels' },
          { to: '/admin/subscriptions', icon: <IconCreditCard />, label: 'Abonnements' },
          { to: '/admin/exports', icon: <IconDownload />, label: 'Exports' },
        ],
      });
    }

    return result.filter((section) => section.items.length > 0);
  }, [isAdmin, isParent, isTeacher]);

  const dockMoreItems = useMemo<NavItem[]>(() => {
    if (!isTeacher) return [];
    return [
      { to: '/teacher/subscription', icon: <IconCreditCard />, label: 'Abonnement' },
      { to: '/teacher/pre-enrollments', icon: <IconUserPlus />, label: 'Préinscriptions' },
      { to: '/teacher/exports', icon: <IconDownload />, label: 'Exports' },
    ];
  }, [isTeacher]);

  const isDockMoreActive = dockMoreItems.some((item) => location.pathname.startsWith(item.to));

  return (
    <>
      <a className="skip-link" href="#main-content">
        Aller au contenu
      </a>
    <div className="app-shell">
      <aside className="app-dock" aria-label="Navigation principale">
        <Link to="/dashboard" className="app-dock-brand">
          <img src="/favicon.png" alt="" />
          <span>GROUPI</span>
        </Link>
        <nav className="app-dock-nav">
          {sections.map((section) => (
            <div key={section.title} className="app-dock-section">
              <p className="app-dock-section-title">{section.title}</p>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={({ isActive }) => 'app-dock-link' + (isActive ? ' active' : '')}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {!!item.badge && (
                    <span className="app-dock-link-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        {dockMoreItems.length > 0 && (
          <div className="app-dock-more" ref={dockMoreMenuRef}>
            <button
              type="button"
              className={'app-dock-link app-dock-more-trigger' + (isDockMoreActive ? ' active' : '')}
              aria-haspopup="menu"
              aria-expanded={isDockMoreOpen}
              onClick={() => setIsDockMoreOpen((isOpen) => !isOpen)}
            >
              <IconDotsHorizontal />
              <span>Plus</span>
            </button>
            {isDockMoreOpen && (
              <div className="app-dock-more-menu" role="menu">
                {dockMoreItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    role="menuitem"
                    className={({ isActive }) => 'app-dock-more-item' + (isActive ? ' active' : '')}
                    onClick={() => setIsDockMoreOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="app-sidebar-footer">
          <div className="app-sidebar-user">
            <span className="app-sidebar-avatar">{identityLabel?.[0] ?? '?'}</span>
            {currentUser && <span className="app-sidebar-email">{identityLabel}</span>}
          </div>
          <button type="button" onClick={handleLogout} aria-label="Se déconnecter" title="Se déconnecter">
            <IconLogOut width={16} height={16} />
          </button>
        </div>
      </aside>
      <main id="main-content" className="app-main" tabIndex={-1}>
        <div className="workspace-bar">
          <div className="workspace-profile" ref={profileMenuRef}>
            <button
              type="button"
              className="workspace-profile-trigger"
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
              onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
            >
              {teacherProfile?.photo ? (
                <img src={teacherProfile.photo} alt="" className="workspace-avatar" />
              ) : (
                <span className="workspace-avatar workspace-avatar-fallback">{identityInitials}</span>
              )}
              <span className="workspace-identity">
                <span className="workspace-eyebrow">Espace {workspaceLabel}</span>
                {currentUser && (
                  <span className="workspace-email">
                    {teacherDisplayName ? `${teacherDisplayName} - ${identityLabel}` : identityLabel}
                  </span>
                )}
              </span>
            </button>
            {isProfileMenuOpen && (
              <div className="workspace-profile-menu" role="menu">
                <Link to={profilePath} role="menuitem" onClick={() => setIsProfileMenuOpen(false)}>
                  <IconUserCheck width={16} height={16} />
                  <span>Profil</span>
                </Link>
                <button type="button" role="menuitem" onClick={handleLogout}>
                  <IconLogOut width={16} height={16} />
                  <span>Se deconnecter</span>
                </button>
              </div>
            )}
          </div>
          <div className="workspace-actions">
            <Link to="/notifications" className="workspace-notifications">
              <IconBell width={15} height={15} />
              <span>{unreadCount > 0 ? `${unreadCount > 99 ? '99+' : unreadCount} non lue(s)` : 'Aucune non lue'}</span>
            </Link>
          </div>
        </div>
        <div className="app-main-inner">
          <Outlet />
        </div>
      </main>
    </div>
    </>
  );
}
