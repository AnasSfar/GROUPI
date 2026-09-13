import { useState } from 'react';
import { AbsenceNoticeButton } from './ChildDetailCard';
import { EnrollmentCommentThread } from './EnrollmentCommentThread';
import { GroupAnnouncementsFeed } from './GroupAnnouncementsFeed';
import { EnrollmentAccountingPanel } from './EnrollmentAccountingPanel';
import { GroupChangeTargetPicker } from './GroupChangeTargetPicker';
import { formatDateTime } from '../utils/format';
import type { ParentChildDashboard } from '../api/dashboardApi';
import type { PendingLevelPoolAssignment } from '../api/parentProfileApi';

type SubjectOption =
  | {
      kind: 'subject';
      key: string;
      enrollmentId: string;
      group: ParentChildDashboard['groups'][number]['group'];
    }
  | {
      kind: 'pending';
      key: string;
      teacher: { firstName: string; lastName: string };
      schoolLevel: { name: string };
    };

/**
 * Avenant 01, Ch. D.3 (décision #3, RM-PAR-022) : navigation niveau 2 (matières de l'enfant, chacune
 * -> un Professeur) puis niveau 3 (Suivi : séances, présences ponctuelles/signalement d'absence,
 * commentaires, annonces, solde de CETTE inscription, changement de groupe). Une entrée spéciale
 * "En attente d'affectation" est ajoutée par rattachement actif sans inscription standard
 * correspondante (RM-POOL-010/RM-PAR-023 : jamais un nom de groupe standard non rejoint, ni un
 * autre élève). Le niveau 2 est masqué (sélection directe) s'il n'y a qu'une seule option.
 */
export function ChildSubjectsPanel({
  studentId,
  groups,
  upcomingSessions,
  cancelledOrPostponedSessions,
  pendingAssignments,
  onRefresh,
}: {
  studentId: string;
  groups: ParentChildDashboard['groups'];
  upcomingSessions: ParentChildDashboard['upcomingSessions'];
  cancelledOrPostponedSessions: ParentChildDashboard['cancelledOrPostponedSessions'];
  pendingAssignments: PendingLevelPoolAssignment[];
  onRefresh: () => void;
}) {
  const options: SubjectOption[] = [
    ...groups.map((g) => ({
      kind: 'subject' as const,
      key: `s-${g.enrollmentId}`,
      enrollmentId: g.enrollmentId,
      group: g.group,
    })),
    ...pendingAssignments.map((p) => ({
      kind: 'pending' as const,
      key: `p-${p.id}`,
      teacher: p.teacher,
      schoolLevel: p.schoolLevel,
    })),
  ];

  // RM-PAR-022 : niveau masqué (option unique) — sélection directe, pas de choix affiché.
  const [manualSelection, setManualSelection] = useState<string | null>(null);
  const selectedKey = options.length === 1 ? options[0].key : manualSelection;
  const showBackLink = options.length > 1;

  if (options.length === 0) {
    return <p>Aucune matière suivie pour le moment.</p>;
  }

  const selected = options.find((o) => o.key === selectedKey) ?? null;

  if (!selected) {
    return (
      <ul className="tag-list">
        {options.map((o) => (
          <li key={o.key}>
            <button type="button" className="ghost" onClick={() => setManualSelection(o.key)}>
              {o.kind === 'subject'
                ? `${o.group.subject} — ${o.group.teacher.firstName} ${o.group.teacher.lastName}`
                : `En attente d'affectation chez ${o.teacher.firstName} ${o.teacher.lastName} (${o.schoolLevel.name})`}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  const backLink = showBackLink && (
    <button type="button" className="ghost-link" onClick={() => setManualSelection(null)}>
      ← Toutes les matières
    </button>
  );

  // RM-POOL-010/RM-PAR-023 : rien d'autre qu'un Professeur et un niveau — jamais un groupe standard
  // non rejoint, ni un autre élève de la salle d'attente.
  if (selected.kind === 'pending') {
    return (
      <>
        {backLink}
        <div className="alert-banner">
          <p>
            En attente d'affectation chez {selected.teacher.firstName} {selected.teacher.lastName} (
            {selected.schoolLevel.name}).
          </p>
        </div>
      </>
    );
  }

  const groupUpcoming = upcomingSessions.filter((s) => s.group.id === selected.group.id);
  const groupCancelled = cancelledOrPostponedSessions.filter((s) => s.group.id === selected.group.id);

  return (
    <>
      {backLink}
      <h3>
        {selected.group.subject} ({selected.group.schoolLevel}) — {selected.group.teacher.firstName}{' '}
        {selected.group.teacher.lastName}
      </h3>

      <p className="table-hint section-spacer">Prochaines séances</p>
      {groupUpcoming.length === 0 && <p>Aucune séance à venir.</p>}
      {groupUpcoming.length > 0 && (
        <ul className="activity-list">
          {groupUpcoming.map((s) => (
            <li key={s.id} className="activity-item">
              <div className="activity-item-header">
                <span className="activity-row-dot" />
                <span>{formatDateTime(s.date, s.startTime)}</span>
              </div>
              <p>
                {s.absenceReported ? (
                  <span className="badge badge-info">Absence signalée</span>
                ) : (
                  <AbsenceNoticeButton sessionId={s.id} studentId={studentId} onReported={onRefresh} />
                )}
              </p>
            </li>
          ))}
        </ul>
      )}

      {groupCancelled.length > 0 && (
        <div className="alert-banner">
          <h3>Modifications de planning</h3>
          <ul>
            {groupCancelled.map((s) => (
              <li key={s.id}>
                {formatDateTime(s.date, s.startTime)} ({s.status === 'CANCELLED' ? 'annulée' : 'reportée'})
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="table-hint section-spacer">Commentaires pédagogiques</p>
      <EnrollmentCommentThread enrollmentId={selected.enrollmentId} />

      <p className="table-hint section-spacer">Annonces du groupe</p>
      <GroupAnnouncementsFeed groupId={selected.group.id} />

      <p className="table-hint section-spacer">Solde et relevé de cette inscription</p>
      <EnrollmentAccountingPanel enrollmentId={selected.enrollmentId} canWrite={false} />

      <p className="table-hint section-spacer">
        <GroupChangeTargetPicker enrollmentId={selected.enrollmentId} onRequested={onRefresh} />
      </p>
    </>
  );
}
