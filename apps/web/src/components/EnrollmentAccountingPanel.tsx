import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from './Select';
import { useToast } from './Toast';
import { ApiError } from '../api/client';
import * as accountingApi from '../api/accountingApi';
import type { AccountDetail, AccountingEntry, AdjustmentReason } from '../api/accountingApi';
import * as sessionsApi from '../api/sessionsApi';
import type { Session } from '../api/sessionsApi';

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  CREATED: 'Cree',
  ACTIVE: 'Actif',
  LOCKED: 'Verrouille',
  CLOSED: 'Cloture',
  ARCHIVED: 'Archive',
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
  SESSION: 'Seance facturee',
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
  ATTENDANCE_CORRECTION: 'Correction de presence',
  EXCEPTIONAL_DISCOUNT: 'Remise exceptionnelle',
  ADMIN_CORRECTION: 'Correction administrative',
};

function formatAmount(n: number): string {
  return `${n.toFixed(3)} TND`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR');
}

export function EnrollmentAccountingPanel({ enrollmentId, canWrite, initialPaymentSessionId }: { enrollmentId: string; canWrite: boolean; initialPaymentSessionId?: string | null }) {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentSessionId, setPaymentSessionId] = useState('');
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

  useEffect(() => {
    if (canWrite && detail) {
      loadBillableSessions();
    }
  }, [canWrite, detail?.account.group.id, initialPaymentSessionId]);

  async function loadBillableSessions() {
    const token = getAccessToken();
    if (!token || !detail) return;
    try {
      const [completed, locked] = await Promise.all([
        sessionsApi.listSessions(token, detail.account.group.id, { status: 'COMPLETED' }),
        sessionsApi.listSessions(token, detail.account.group.id, { status: 'LOCKED' }),
      ]);
      const rows = [...completed, ...locked].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.startTime.localeCompare(b.startTime),
      );
      setSessions(rows);
      setPaymentSessionId((current) => {
        if (current) return current;
        if (initialPaymentSessionId && rows.some((s) => s.id === initialPaymentSessionId)) return initialPaymentSessionId;
        return rows[0]?.id || '';
      });
    } catch {
      setSessions([]);
      setPaymentSessionId('');
    }
  }

  async function handleRecordPayment() {
    const token = getAccessToken();
    const amount = Number(paymentAmount);
    if (!token || !paymentSessionId || !amount || amount <= 0) return;
    setError(null);
    try {
      await accountingApi.recordPayment(token, enrollmentId, {
        amount,
        sessionId: paymentSessionId,
        paymentMethod: paymentMethod.trim() || undefined,
      });
      setPaymentAmount('');
      setPaymentMethod('');
      showToast('Paiement enregistre');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'enregistrement du paiement a echoue.");
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
      showToast('Paiement corrige');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'La correction a echoue.');
    }
  }

  async function handleCancel(entryId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      await accountingApi.cancelPayment(token, enrollmentId, entryId);
      showToast('Paiement annule');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'annulation a echoue.");
    }
  }

  async function handleReminder() {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      await accountingApi.sendPaymentReminder(token, enrollmentId);
      showToast('Rappel de paiement envoye');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Le rappel de paiement a echoue.');
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
      showToast('Ajustement cree');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "La creation de l'ajustement a echoue.");
    }
  }

  if (loading) return <p>Chargement du compte de suivi comptable...</p>;
  if (!detail) {
    return error ? <p className="form-error" role="alert">{error}</p> : null;
  }

  const { account, entries, indicators } = detail;
  const isDebtor = indicators.currentBalance < 0;

  function sessionLabel(sessionId: string | null): string {
    if (!sessionId) return '-';
    const session = sessions.find((s) => s.id === sessionId);
    return session ? `${formatDate(session.date)} - ${session.startTime}` : sessionId.slice(0, 8);
  }
  return (
    <div className="comment-thread">
      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="accounting-summary">
        <span className={`badge ${ACCOUNT_STATUS_BADGE[account.status]}`}>{ACCOUNT_STATUS_LABELS[account.status]}</span>
        <span className={`badge ${isDebtor ? 'badge-danger' : 'badge-success'}`}>
          Solde : {formatAmount(indicators.currentBalance)}
        </span>
        <span className="table-hint">Tarif : {formatAmount(account.rate)}</span>
        <span className="table-hint">Paye : {formatAmount(indicators.paidAmount)}</span>
        <span className="table-hint">Facture : {formatAmount(indicators.invoicedAmount)}</span>
        {indicators.paymentRate !== null && (
          <span className="table-hint">Taux de paiement : {indicators.paymentRate.toFixed(1)}%</span>
        )}
      </div>

      {entries.length === 0 && <p>Aucune ecriture pour ce compte.</p>}
      {entries.length > 0 && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>N ecriture</th>
                <th>Date</th>
                <th>Seance</th>
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
                  <td data-label="N ecriture">{entry.entryNumber}</td>
                  <td data-label="Date">{formatDate(entry.effectiveDate)}</td>
                  <td data-label="Seance">{sessionLabel(entry.sessionId)}</td>
                  <td data-label="Type">{ENTRY_TYPE_LABELS[entry.type]}</td>
                  <td data-label="Montant">
                    {entry.direction === 'CREDIT' ? '+' : '-'}
                    {formatAmount(entry.amount)}
                  </td>
                  <td data-label="Statut">
                    <span className={`badge ${ENTRY_STATUS_BADGE[entry.status]}`}>{entry.status}</span>
                  </td>
                  <td data-label="Note">{entry.reasonNote ?? '-'}</td>
                  {canWrite && (
                    <td className="admin-actions">
                      {entry.type === 'PAYMENT' && entry.status === 'POSTED' && (
                        <>
                          {correctingId === entry.id ? (
                            <div className="comment-form">
                              <input type="number" min={0} step="0.001" value={correctAmount} onChange={(e) => setCorrectAmount(e.target.value)} />
                              <input type="text" placeholder="Motif de la correction" value={correctNote} onChange={(e) => setCorrectNote(e.target.value)} />
                              <button type="button" onClick={() => handleCorrect(entry.id)}>Enregistrer</button>
                              <button type="button" className="ghost" onClick={() => setCorrectingId(null)}>Annuler</button>
                            </div>
                          ) : (
                            <>
                              <button type="button" className="ghost-link" onClick={() => startCorrection(entry)}>Corriger</button>
                              <button type="button" className="ghost-link" onClick={() => handleCancel(entry.id)}>Annuler</button>
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
            <label>
              Seance reglee
              <Select value={paymentSessionId} onChange={(e) => setPaymentSessionId(e.target.value)}>
                <option value="">Selectionner...</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{formatDate(s.date)} - {s.startTime}</option>
                ))}
              </Select>
            </label>
            <input type="number" min={0} step="0.001" placeholder="Montant du paiement" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
            <input type="text" placeholder="Mode de paiement (optionnel)" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
            <button type="button" disabled={!paymentSessionId || !paymentAmount} onClick={handleRecordPayment}>Enregistrer le paiement</button>
            {isDebtor && <button type="button" className="ghost" onClick={handleReminder}>Envoyer un rappel de paiement</button>}
          </div>

          {!showAdjustmentForm ? (
            <button type="button" className="ghost-link" onClick={() => { setShowAdjustmentForm(true); loadBillableSessions(); }}>
              Creer un ajustement comptable
            </button>
          ) : (
            <div className="comment-form">
              <label>
                Seance concernee
                <Select value={adjSessionId} onChange={(e) => setAdjSessionId(e.target.value)}>
                  <option value="">Selectionner...</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{formatDate(s.date)} - {s.startTime}</option>
                  ))}
                </Select>
              </label>
              <label>
                Sens
                <Select value={adjDirection} onChange={(e) => setAdjDirection(e.target.value as 'CREDIT' | 'DEBIT')}>
                  <option value="CREDIT">Credit (reduit la dette)</option>
                  <option value="DEBIT">Debit (augmente la dette)</option>
                </Select>
              </label>
              <input type="number" min={0} step="0.001" placeholder="Montant" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} />
              <label>
                Motif
                <Select value={adjReason} onChange={(e) => setAdjReason(e.target.value as AdjustmentReason)}>
                  {(Object.keys(ADJUSTMENT_REASON_LABELS) as AdjustmentReason[]).map((reason) => (
                    <option key={reason} value={reason}>{ADJUSTMENT_REASON_LABELS[reason]}</option>
                  ))}
                </Select>
              </label>
              <textarea placeholder="Justification (obligatoire)" value={adjNote} onChange={(e) => setAdjNote(e.target.value)} />
              <button type="button" disabled={!adjSessionId || !adjAmount || !adjNote.trim()} onClick={handleCreateAdjustment}>Creer l'ajustement</button>
              <button type="button" className="ghost" onClick={() => setShowAdjustmentForm(false)}>Annuler</button>
              <p className="table-hint">Un ajustement Professeur n'est possible que dans les 48h suivant la seance (ERR-CPT-004).</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}