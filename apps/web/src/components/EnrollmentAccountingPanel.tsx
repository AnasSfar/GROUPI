import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from './Select';
import { ApiError } from '../api/client';
import * as accountingApi from '../api/accountingApi';
import type {
  AccountDetail,
  AccountingEntry,
  AdjustmentReason,
} from '../api/accountingApi';
import * as sessionsApi from '../api/sessionsApi';
import type { Session } from '../api/sessionsApi';

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  CREATED: 'Créé',
  ACTIVE: 'Actif',
  LOCKED: 'Verrouillé',
  CLOSED: 'Clôturé',
  ARCHIVED: 'Archivé',
};

const ACCOUNT_STATUS_BADGE: Record<string, string> = {
  CREATED: 'badge-neutral',
  ACTIVE: 'badge-success',
  LOCKED: 'badge-warning',
  CLOSED: 'badge-neutral',
  ARCHIVED: 'badge-neutral',
};

const ENTRY_TYPE_LABELS: Record<string, string> = {
  PAYMENT: 'Paiement',
  SESSION: 'Séance facturée',
  ADJUSTMENT: 'Ajustement',
  ADMIN_ADJUSTMENT: 'Ajustement administratif',
};

const ENTRY_STATUS_BADGE: Record<string, string> = {
  CREATED: 'badge-neutral',
  POSTED: 'badge-success',
  REVERSED: 'badge-neutral',
  LOCKED: 'badge-warning',
};

const ADJUSTMENT_REASON_LABELS: Record<AdjustmentReason, string> = {
  DATA_ENTRY_ERROR: 'Erreur de saisie',
  ATTENDANCE_CORRECTION: 'Correction de présence',
  EXCEPTIONAL_DISCOUNT: 'Remise exceptionnelle',
  ADMIN_CORRECTION: 'Correction administrative',
};

function formatAmount(n: number): string {
  return `${n.toFixed(3)} TND`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR');
}

/**
 * Ch.15 : compte de suivi comptable d'une inscription — intégré en ligne (même principe que
 * `EnrollmentCommentThread`). `canWrite` distingue la vue Professeur (paiements/ajustements) de la
 * vue Parent, strictement en lecture (RM-CPT-013).
 */
export function EnrollmentAccountingPanel({ enrollmentId, canWrite }: { enrollmentId: string; canWrite: boolean }) {
  const { getAccessToken } = useAuth();
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [correctAmount, setCorrectAmount] = useState('');
  const [correctNote, setCorrectNote] = useState('');

  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [adjSessionId, setAdjSessionId] = useState('');
  const [adjDirection, setAdjDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState<AdjustmentReason>('DATA_ENTRY_ERROR');
  const [adjNote, setAdjNote] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setDetail(await accountingApi.getAccount(token, enrollmentId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger le compte de suivi comptable.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, enrollmentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function loadSessionsForAdjustment() {
    const token = getAccessToken();
    if (!token || !detail) return;
    try {
      const [completed, locked] = await Promise.all([
        sessionsApi.listSessions(token, detail.account.group.id, { status: 'COMPLETED' }),
        sessionsApi.listSessions(token, detail.account.group.id, { status: 'LOCKED' }),
      ]);
      setSessions([...completed, ...locked]);
    } catch {
      setSessions([]);
    }
  }

  async function handleRecordPayment() {
    const token = getAccessToken();
    const amount = Number(paymentAmount);
    if (!token || !amount || amount <= 0) return;
    setError(null);
    try {
      await accountingApi.recordPayment(token, enrollmentId, {
        amount,
        paymentMethod: paymentMethod.trim() || undefined,
      });
      setPaymentAmount('');
      setPaymentMethod('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'enregistrement du paiement a échoué.");
    }
  }

  function startCorrection(entry: AccountingEntry) {
    setCorrectingId(entry.id);
    setCorrectAmount(String(entry.amount));
    setCorrectNote('');
  }

  async function handleCorrect(entryId: string) {
    const token = getAccessToken();
    const amount = Number(correctAmount);
    if (!token || !amount || amount <= 0 || !correctNote.trim()) return;
    setError(null);
    try {
      await accountingApi.correctPayment(token, enrollmentId, entryId, { amount, reasonNote: correctNote.trim() });
      setCorrectingId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'La correction a échoué.');
    }
  }

  async function handleCancel(entryId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      await accountingApi.cancelPayment(token, enrollmentId, entryId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'annulation a échoué.");
    }
  }

  async function handleReminder() {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      await accountingApi.sendPaymentReminder(token, enrollmentId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Le rappel de paiement a échoué.');
    }
  }

  async function handleCreateAdjustment() {
    const token = getAccessToken();
    const amount = Number(adjAmount);
    if (!token || !adjSessionId || !amount || amount <= 0 || !adjNote.trim()) return;
    setError(null);
    try {
      await accountingApi.createAdjustment(token, enrollmentId, {
        sessionId: adjSessionId,
        direction: adjDirection,
        amount,
        reason: adjReason,
        reasonNote: adjNote.trim(),
      });
      setShowAdjustmentForm(false);
      setAdjSessionId('');
      setAdjAmount('');
      setAdjNote('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "La création de l'ajustement a échoué.");
    }
  }

  if (loading) {
    return <p>Chargement du compte de suivi comptable...</p>;
  }
  if (!detail) {
    return error ? (
      <p className="form-error" role="alert">
        {error}
      </p>
    ) : null;
  }

  const { account, entries, indicators } = detail;
  const isDebtor = indicators.currentBalance < 0;

  return (
    <div className="comment-thread">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="accounting-summary">
        <span className={`badge ${ACCOUNT_STATUS_BADGE[account.status]}`}>{ACCOUNT_STATUS_LABELS[account.status]}</span>
        <span className={`badge ${isDebtor ? 'badge-danger' : 'badge-success'}`}>
          Solde : {formatAmount(indicators.currentBalance)}
        </span>
        <span className="table-hint">Tarif : {formatAmount(account.rate)}</span>
        <span className="table-hint">Payé : {formatAmount(indicators.paidAmount)}</span>
        <span className="table-hint">Facturé : {formatAmount(indicators.invoicedAmount)}</span>
        {indicators.paymentRate !== null && (
          <span className="table-hint">Taux de paiement : {indicators.paymentRate.toFixed(1)}%</span>
        )}
      </div>

      {entries.length === 0 && <p>Aucune écriture pour ce compte.</p>}
      {entries.length > 0 && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>N° écriture</th>
                <th>Date</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Note</th>
                {canWrite && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.entryNumber}</td>
                  <td>{formatDate(entry.effectiveDate)}</td>
                  <td>{ENTRY_TYPE_LABELS[entry.type]}</td>
                  <td>
                    {entry.direction === 'CREDIT' ? '+' : '-'}
                    {formatAmount(entry.amount)}
                  </td>
                  <td>
                    <span className={`badge ${ENTRY_STATUS_BADGE[entry.status]}`}>{entry.status}</span>
                  </td>
                  <td>{entry.reasonNote ?? '—'}</td>
                  {canWrite && (
                    <td className="admin-actions">
                      {entry.type === 'PAYMENT' && entry.status === 'POSTED' && (
                        <>
                          {correctingId === entry.id ? (
                            <div className="comment-form">
                              <input
                                type="number"
                                min={0}
                                step="0.001"
                                value={correctAmount}
                                onChange={(e) => setCorrectAmount(e.target.value)}
                              />
                              <input
                                type="text"
                                placeholder="Motif de la correction"
                                value={correctNote}
                                onChange={(e) => setCorrectNote(e.target.value)}
                              />
                              <button type="button" onClick={() => handleCorrect(entry.id)}>
                                Enregistrer
                              </button>
                              <button type="button" className="ghost" onClick={() => setCorrectingId(null)}>
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <>
                              <button type="button" className="ghost-link" onClick={() => startCorrection(entry)}>
                                Corriger
                              </button>
                              <button type="button" className="ghost-link" onClick={() => handleCancel(entry.id)}>
                                Annuler
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canWrite && (
        <>
          <div className="comment-form">
            <input
              type="number"
              min={0}
              step="0.001"
              placeholder="Montant du paiement"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
            <input
              type="text"
              placeholder="Mode de paiement (optionnel)"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <button type="button" disabled={!paymentAmount} onClick={handleRecordPayment}>
              Enregistrer le paiement
            </button>
            {isDebtor && (
              <button type="button" className="ghost" onClick={handleReminder}>
                Envoyer un rappel de paiement
              </button>
            )}
          </div>

          {!showAdjustmentForm ? (
            <button
              type="button"
              className="ghost-link"
              onClick={() => {
                setShowAdjustmentForm(true);
                loadSessionsForAdjustment();
              }}
            >
              Créer un ajustement comptable
            </button>
          ) : (
            <div className="comment-form">
              <label>
                Séance concernée
                <Select value={adjSessionId} onChange={(e) => setAdjSessionId(e.target.value)}>
                  <option value="">Sélectionner...</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatDate(s.date)} — {s.startTime}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                Sens
                <Select value={adjDirection} onChange={(e) => setAdjDirection(e.target.value as 'CREDIT' | 'DEBIT')}>
                  <option value="CREDIT">Crédit (réduit la dette)</option>
                  <option value="DEBIT">Débit (augmente la dette)</option>
                </Select>
              </label>
              <input
                type="number"
                min={0}
                step="0.001"
                placeholder="Montant"
                value={adjAmount}
                onChange={(e) => setAdjAmount(e.target.value)}
              />
              <label>
                Motif
                <Select value={adjReason} onChange={(e) => setAdjReason(e.target.value as AdjustmentReason)}>
                  {(Object.keys(ADJUSTMENT_REASON_LABELS) as AdjustmentReason[]).map((reason) => (
                    <option key={reason} value={reason}>
                      {ADJUSTMENT_REASON_LABELS[reason]}
                    </option>
                  ))}
                </Select>
              </label>
              <textarea
                placeholder="Justification (obligatoire)"
                value={adjNote}
                onChange={(e) => setAdjNote(e.target.value)}
              />
              <button
                type="button"
                disabled={!adjSessionId || !adjAmount || !adjNote.trim()}
                onClick={handleCreateAdjustment}
              >
                Créer l'ajustement
              </button>
              <button type="button" className="ghost" onClick={() => setShowAdjustmentForm(false)}>
                Annuler
              </button>
              <p className="table-hint">
                Un ajustement Professeur n'est possible que dans les 48h suivant la séance (ERR-CPT-004).
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
