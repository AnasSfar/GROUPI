import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { ApiError } from '../api/client';
import * as pushApi from '../api/pushApi';
import * as notificationPreferencesApi from '../api/notificationPreferencesApi';
import type { NotificationPreference, PushCategory } from '../api/notificationPreferencesApi';

const CATEGORY_LABELS: Record<PushCategory, string> = {
  SESSION_REMINDER: 'Rappel de séance',
  GROUP_ANNOUNCEMENT: 'Annonce de groupe',
  STUDENT_ASSIGNED: 'Élève affecté à un groupe',
  STUDENT_ABSENT: 'Élève absent',
  SESSION_BILLED: 'Séance facturée',
  PAYMENT_REMINDER: 'Rappel de paiement',
};

const LEAD_MINUTES_OPTIONS: { value: number; label: string }[] = [
  { value: 60, label: '1h avant' },
  { value: 180, label: '3h avant' },
  { value: 360, label: '6h avant' },
  { value: 720, label: '12h avant' },
  { value: 1440, label: '24h avant' },
  { value: 2880, label: '48h avant' },
];

const LAST_TOKEN_KEY = 'groupi.pushToken';

/**
 * Section "Notifications push" des réglages de compte. Masquée sur le web (navigateur) : le web
 * push (service worker + clé VAPID) est un chantier séparé, volontairement hors scope pour l'instant
 * — cohérent avec le cadrage "Android d'abord" déjà posé pour l'app mobile.
 */
export function PushNotificationSettings() {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference[] | null>(null);

  const supported = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!supported) return;
    PushNotifications.checkPermissions()
      .then((status) => setEnabled(status.receive === 'granted'))
      .catch(() => setEnabled(false));
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    const token = getAccessToken();
    if (!token) return;
    notificationPreferencesApi
      .getMine(token)
      .then(setPreferences)
      .catch(() => setPreferences(null));
  }, [supported, getAccessToken]);

  async function handleEnable() {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    setBusy(true);
    try {
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== 'granted') {
        showToast('Permission refusée — active les notifications dans les réglages du téléphone.', 'error');
        return;
      }
      await new Promise<void>((resolve, reject) => {
        PushNotifications.addListener('registration', (token) => {
          localStorage.setItem(LAST_TOKEN_KEY, token.value);
          pushApi
            .registerToken(accessToken, token.value, Capacitor.getPlatform() === 'ios' ? 'IOS' : 'ANDROID')
            .then(() => resolve())
            .catch(reject);
        });
        PushNotifications.addListener('registrationError', () => reject(new Error('registration-error')));
        PushNotifications.register();
      });
      setEnabled(true);
      showToast('Notifications push activées.');
    } catch {
      showToast("Impossible d'activer les notifications push.", 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    const accessToken = getAccessToken();
    setBusy(true);
    try {
      const lastToken = localStorage.getItem(LAST_TOKEN_KEY);
      if (accessToken && lastToken) {
        await pushApi.unregisterToken(accessToken, lastToken).catch(() => {});
      }
      await PushNotifications.removeAllListeners();
      localStorage.removeItem(LAST_TOKEN_KEY);
      setEnabled(false);
      showToast('Notifications push désactivées sur cet appareil.');
    } finally {
      setBusy(false);
    }
  }

  async function updateCategory(category: PushCategory, patch: Partial<NotificationPreference>) {
    const accessToken = getAccessToken();
    if (!accessToken || !preferences) return;
    const current = preferences.find((p) => p.category === category);
    if (!current) return;
    const updated = { ...current, ...patch };
    setPreferences(preferences.map((p) => (p.category === category ? updated : p)));
    try {
      await notificationPreferencesApi.updateMine(accessToken, [updated]);
    } catch (err) {
      setPreferences(preferences);
      showToast(err instanceof ApiError ? err.message : "Impossible d'enregistrer ce réglage.", 'error');
    }
  }

  if (!supported) return null;

  return (
    <section className="card-section">
      <h2>Notifications push</h2>
      <p className="table-hint">
        Reçois des notifications sur cet appareil même quand l'app est fermée (rappel de séance,
        annonces, paiements...).
      </p>

      <div className="page-actions" style={{ marginTop: 12 }}>
        {!enabled ? (
          <button type="button" onClick={handleEnable} disabled={busy}>
            {busy ? 'Activation...' : 'Activer les notifications push sur cet appareil'}
          </button>
        ) : (
          <button type="button" className="ghost" onClick={handleDisable} disabled={busy}>
            {busy ? 'Désactivation...' : 'Désactiver sur cet appareil'}
          </button>
        )}
      </div>

      {enabled && preferences && (
        <div className="field-group" style={{ marginTop: 16 }}>
          <span className="field-group-label">Catégories</span>
          <div className="checkbox-grid">
            {preferences.map((pref) => (
              <label key={pref.category} className="checkbox-option">
                <input
                  type="checkbox"
                  checked={pref.enabled}
                  onChange={(e) => updateCategory(pref.category, { enabled: e.target.checked })}
                />
                {CATEGORY_LABELS[pref.category]}
              </label>
            ))}
          </div>

          {preferences.find((p) => p.category === 'SESSION_REMINDER')?.enabled && (
            <label style={{ marginTop: 12, display: 'block' }}>
              Rappel de séance
              <select
                value={preferences.find((p) => p.category === 'SESSION_REMINDER')?.leadMinutes ?? 1440}
                onChange={(e) => updateCategory('SESSION_REMINDER', { leadMinutes: Number(e.target.value) })}
              >
                {LEAD_MINUTES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </section>
  );
}
