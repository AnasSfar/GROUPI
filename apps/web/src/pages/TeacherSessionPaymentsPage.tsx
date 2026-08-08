import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as accountingApi from '../api/accountingApi';
import type { Group } from '../api/groupsApi';
import type { SessionPaymentEntry, SessionPaymentsView } from '../api/accountingApi';

const SESSION_STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planifiée',
  COMPLETED: 'Terminée',
  LOCKED: 'Verrouillée',
  CANCELLED: 'Annulée',
  POSTPONED: 'Reportée',
};

function formatAmount(n: number): string {
  return `${n.toFixed(3)} TND`;
}

/** Formulaire de saisie inline pour une ligne élève — même logique que AttendanceRow (Ch.14). */
function PaymentRow({
  entry,
  onSave,
}: {
  entry: SessionPaymentEntry;
  onSave: (studentId: string, amount: number, paymentMethod: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState(String(entry.invoicedAmount ?? entry.rate));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const value = Number(amount);
    if (!value || value <= 0) return;
    setSaving(true);
    try {
      await onSave(entry.student.id, value, paymentMethod);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td data-label="Élève">
        {entry.student.firstName} {entry.student.lastName}
      </td>
      <td data-label="Tarif">{formatAmount(entry.rate)}</td>
      <td data-label="Facturée">
        <span className={`badge ${entry.invoiced ? 'badge-info' : 'badge-neutral'}`}>
          {entry.invoiced ? 'Facturée' : 'Non facturée'}
        </span>
      </td>
      <td data-label="Montant">
        {entry.payment ? (
          formatAmount(entry.payment.amount)
        ) : (
          <input
            type="number"
            min={0}
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!entry.invoiced}
            style={{ width: '110px' }}
          />
        )}
      </td>
      <td data-label="Mode">
        {entry.payment ? (
          entry.payment.paymentMethod ?? '-'
        ) : (
          <input
            type="text"
            placeholder="Optionnel"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            disabled={!entry.invoiced}
            style={{ width: '120px' }}
          />
        )}
      </td>
      <td data-label="État">
        {entry.payment ? (
          <span className="badge badge-success">Réglée</span>
        ) : (
          <span className="badge badge-neutral">Non réglée</span>
        )}
      </td>
      <td className="admin-actions">
        {!entry.payment && (
          <button type="button" onClick={handleSave} disabled={!entry.invoiced || saving || !amount}>
            Enregistrer
          </button>
        )}
      </td>
    </tr>
  );
}

/** Ch.16 : document "Paiements" d'une séance — pendant de TeacherAttendancePage pour l'appel. */
export function TeacherSessionPaymentsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const [view, setView] = useState<SessionPaymentsView | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const payments = await accountingApi.getSessionPayments(token, sessionId);
      setView(payments);
      const groups = await groupsApi.listMine(token);
      setGroup(groups.find((g) => g.id === payments.session.groupId) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les paiements.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(studentId: string, amount: number, paymentMethod: string) {
    const token = getAccessToken();
    if (!token || !sessionId) return;
    setError(null);
    try {
      await accountingApi.recordSessionPayment(token, sessionId, studentId, {
        amount,
        paymentMethod: paymentMethod.trim() || undefined,
      });
      showToast('Paiement enregistré');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'enregistrement du paiement a échoué.");
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (!view) {
    return <p className="form-error">{error ?? 'Séance introuvable.'}</p>;
  }

  const { session, entries } = view;
  const paidCount = entries.filter((e) => e.payment !== null).length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Paiements — {group?.name ?? 'Groupe'}</h1>
          <p>
            Séance du {new Date(session.date).toLocaleDateString('fr-FR')} à {session.startTime} ·{' '}
            <span className={`badge ${session.status === 'LOCKED' ? 'badge-neutral' : session.status === 'COMPLETED' ? 'badge-success' : 'badge-info'}`}>
              {SESSION_STATUS_LABELS[session.status] ?? session.status}
            </span>
          </p>
        </div>
        <div className="page-actions">
          <Link to={`/teacher/groups/${session.groupId}/sessions`}>← Retour aux séances</Link>
          <Link to={`/teacher/sessions/${session.id}/attendance`}>Présences de la séance</Link>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card-section">
        <h2>
          Élèves ({paidCount}/{entries.length} réglés)
        </h2>
        {entries.length === 0 && <p>Aucun élève inscrit activement dans ce groupe.</p>}
        {entries.length > 0 && (
          <>
            <p className="table-hint">
              Un paiement ne peut être saisi que pour une présence facturée (séance validée et facturable).
            </p>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Élève</th>
                    <th>Tarif</th>
                    <th>Facturée</th>
                    <th>Montant</th>
                    <th>Mode</th>
                    <th>État</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <PaymentRow key={entry.enrollmentId} entry={entry} onSave={handleSave} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
