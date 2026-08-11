import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as absenceNoticeApi from '../api/absenceNoticeApi';
import type { ParentChildDashboard } from '../api/dashboardApi';
import { StatGrid } from './StatGrid';
import { formatAmount, formatDateTime } from '../utils/format';
import { IconLayers, IconWallet, IconClipboardCheck } from './icons';

function AbsenceNoticeButton({
  sessionId,
  studentId,
  onReported,
}: {
  sessionId: string;
  studentId: string;
  onReported: () => void;
}) {
  const { getAccessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await absenceNoticeApi.createAbsenceNotice(token, sessionId, {
        studentId,
        reason: reason || undefined,
        comment: comment || undefined,
      });
      setOpen(false);
      onReported();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Signalement impossible.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="ghost" onClick={() => setOpen(true)}>
        Signaler une absence
      </button>
    );
  }

  return (
    <span className="add-row">
      <input placeholder="Motif (optionnel)" value={reason} onChange={(e) => setReason(e.target.value)} />
      <input placeholder="Commentaire (optionnel)" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button type="button" onClick={submit} disabled={saving}>
        Confirmer
      </button>
      <button type="button" className="ghost" onClick={() => setOpen(false)}>
        Annuler
      </button>
      {error && <span className="form-error">{error}</span>}
    </span>
  );
}

/** Vue riche d'un enfant (groupes, séances, comptabilité, remarques pédagogiques) — utilisée par
 * le tableau de bord Parent (DashboardPage, liens vers des pages dédiées) et l'onglet "Vue
 * d'ensemble" de la fiche enfant (ParentChildrenPage, `onNavigate` bascule un onglet voisin au
 * lieu de quitter la fiche — évite de perdre le contexte en pleine navigation). */
export function ChildDetailCard({
  child,
  showName,
  onRefresh,
  onNavigate,
}: {
  child: ParentChildDashboard;
  showName: boolean;
  onRefresh: () => void;
  onNavigate?: (target: 'attendance' | 'accounting') => void;
}) {
  return (
    <section className="card-section">
      {showName && (
        <h2>
          {child.student.firstName} {child.student.lastName}
        </h2>
      )}
      <StatGrid
        tiles={[
          { label: 'Groupes suivis', value: String(child.groups.length), icon: <IconLayers />, tone: 'teal' },
          { label: 'Solde global', value: formatAmount(child.globalBalance), icon: <IconWallet />, tone: child.globalBalance < 0 ? 'red' : 'green' },
          {
            label: "Taux d'assiduité",
            value: child.attendanceSummary.attendanceRate != null ? `${(child.attendanceSummary.attendanceRate * 100).toFixed(1)}%` : '—',
            icon: <IconClipboardCheck />,
            tone: 'green',
          },
        ]}
      />

      <p className="table-hint section-spacer">
        Groupes suivis
      </p>
      <ul className="tag-list">
        {child.groups.map((g) => (
          <li key={g.enrollmentId} className="tag">
            {g.group.name} — {g.group.subject} ({g.group.teacher.firstName} {g.group.teacher.lastName})
          </li>
        ))}
      </ul>

      {child.upcomingSessions.length > 0 && (
        <>
          <p className="table-hint section-spacer">
            Prochaines séances
          </p>
          <ul className="activity-list">
            {child.upcomingSessions.slice(0, 5).map((s) => (
              <li key={s.id} className="activity-item">
                <div className="activity-item-header">
                  <span className="activity-row-dot" />
                  <span>
                    {s.group.name} — {formatDateTime(s.date, s.startTime)}
                  </span>
                </div>
                <p>
                  {/* RM-ATT-016/020 : le signalement reste accepté même après le début théorique de
                      la séance (`canReportAbsence` ne reflète qu'une fenêtre d'usage recommandée,
                      jamais un blocage — seul `absenceReported` empêche un nouveau signalement une
                      fois qu'un signalement existe déjà pour cette séance). */}
                  {s.absenceReported ? (
                    <span className="badge badge-info">Absence signalée</span>
                  ) : (
                    <>
                      <AbsenceNoticeButton sessionId={s.id} studentId={child.student.id} onReported={onRefresh} />
                      {!s.canReportAbsence && (
                        <span className="table-hint" style={{ marginLeft: 8 }}>
                          Séance déjà commencée — signalement transmis à titre informatif, à la discrétion du
                          Professeur.
                        </span>
                      )}
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      {child.cancelledOrPostponedSessions.length > 0 && (
        <div className="alert-banner">
          <h3>Modifications de planning</h3>
          <ul>
            {child.cancelledOrPostponedSessions.map((s) => (
              <li key={s.id}>
                {s.group.name} — {formatDateTime(s.date, s.startTime)} ({s.status === 'CANCELLED' ? 'annulée' : 'reportée'})
              </li>
            ))}
          </ul>
        </div>
      )}

      {child.recentComments.length > 0 && (
        <>
          <p className="table-hint section-spacer">
            Derniers commentaires pédagogiques
          </p>
          <ul className="activity-list">
            {child.recentComments.map((c) => (
              <li key={c.id} className="activity-item">
                <div className="activity-item-header">
                  <strong>{c.groupName}</strong>
                  <span className="activity-item-date">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <p>{c.body}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="table-hint section-spacer">
        {onNavigate ? (
          <>
            <button type="button" className="ghost-link" onClick={() => onNavigate('attendance')}>
              Présences détaillées
            </button>
            {' · '}
            <button type="button" className="ghost-link" onClick={() => onNavigate('accounting')}>
              Comptabilité détaillée
            </button>
          </>
        ) : (
          <>
            <Link to={`/parent/children/${child.student.id}/attendance`}>Présences détaillées</Link>
            {' · '}
            <Link to={`/parent/children/${child.student.id}/accounting`}>Comptabilité détaillée</Link>
          </>
        )}
      </p>
    </section>
  );
}
