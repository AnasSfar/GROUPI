import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconUsers,
  IconBookOpen,
  IconChildren,
  IconCalendarCheck,
  IconLayers,
  IconSearch,
  IconClipboardCheck,
  IconUserPlus,
} from '../components/icons';

interface DashCard {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
}

export function DashboardPage() {
  const { currentUser } = useAuth();
  const [showDebug, setShowDebug] = useState(false);

  const isAdmin = currentUser?.roles.includes('SUPER_ADMIN') || currentUser?.roles.includes('ADMIN');
  const isTeacher = currentUser?.roles.includes('TEACHER');
  const isParent = currentUser?.roles.includes('PARENT');

  const cards: DashCard[] = [
    ...(isAdmin
      ? [
          {
            to: '/admin/users',
            icon: <IconUsers />,
            title: 'Comptes utilisateurs',
            description: 'Valider, suspendre ou désactiver des comptes Professeur et Parent.',
          },
          {
            to: '/admin/school-situations',
            icon: <IconCalendarCheck />,
            title: 'Situations scolaires',
            description: "Valider les changements d'établissement, redoublements et réorientations.",
          },
        ]
      : []),
    ...(isTeacher
      ? [
          {
            to: '/teacher/profile',
            icon: <IconBookOpen />,
            title: 'Mon profil professeur',
            description: 'Matières, niveaux enseignés et score de complétude.',
          },
          {
            to: '/teacher/groups',
            icon: <IconLayers />,
            title: 'Mes groupes',
            description: 'Créer et gérer vos groupes, plannings et lieux d’enseignement.',
          },
          {
            to: '/teacher/enrollments',
            icon: <IconClipboardCheck />,
            title: "Demandes d'inscription",
            description: 'Accepter, refuser et gérer les inscriptions de vos groupes.',
          },
          {
            to: '/teacher/pre-enrollments',
            icon: <IconUserPlus />,
            title: 'Préinscriptions',
            description: "Consulter les manifestations d'intérêt et proposer un groupe.",
          },
        ]
      : []),
    ...(isParent
      ? [
          {
            to: '/parent/children',
            icon: <IconChildren />,
            title: 'Mes enfants',
            description: 'Déclarer vos enfants et suivre leur situation scolaire.',
          },
          {
            to: '/parent/groups',
            icon: <IconSearch />,
            title: 'Rechercher un groupe',
            description: 'Trouver un groupe par matière, niveau ou ville.',
          },
          {
            to: '/parent/enrollments',
            icon: <IconClipboardCheck />,
            title: "Mes demandes d'inscription",
            description: "Suivre l'état de vos demandes d'inscription en cours.",
          },
          {
            to: '/parent/pre-enrollments',
            icon: <IconUserPlus />,
            title: 'Mes préinscriptions',
            description: 'Manifester votre intérêt pour la prochaine année académique.',
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p>
            Connecté en tant que <strong>{currentUser?.email}</strong>
          </p>
        </div>
      </div>

      {currentUser?.status === 'PENDING_VALIDATION' && (
        <p className="form-notice" role="status">
          Ce compte est en attente de validation par un administrateur.
        </p>
      )}

      {cards.length > 0 ? (
        <div className="card-grid">
          {cards.map((card) => (
            <Link key={card.to} to={card.to} className="dash-card">
              <span className="dash-card-icon">{card.icon}</span>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p>Aucune action disponible pour le moment.</p>
      )}

      <p className="debug-toggle">
        <button type="button" className="ghost-link" onClick={() => setShowDebug((v) => !v)}>
          {showDebug ? 'Masquer' : 'Afficher'} les informations du compte
        </button>
      </p>
      {showDebug && <pre className="debug-panel">{JSON.stringify(currentUser, null, 2)}</pre>}
    </>
  );
}
