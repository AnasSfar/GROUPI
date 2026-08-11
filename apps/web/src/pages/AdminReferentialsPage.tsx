import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import type { AdminReferentialEntry, City, SchoolLevel, Subject } from '../api/referentialsApi';

type AdminSubject = Subject & AdminReferentialEntry;
type AdminSchoolLevel = SchoolLevel & AdminReferentialEntry;
type AdminCity = City & AdminReferentialEntry;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-FR');
}

/** Prompt de renommage inline, sur le modèle de `ReasonPrompt` (AdminSchoolRequestsPage). */
function RenamePrompt({
  initialValue,
  onConfirm,
  onCancel,
}: {
  initialValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <div className="reason-prompt">
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
      <button type="button" disabled={value.trim().length < 1} onClick={() => onConfirm(value.trim())}>
        Enregistrer
      </button>
      <button type="button" className="ghost" onClick={onCancel}>
        Annuler
      </button>
    </div>
  );
}

/**
 * RM-REF-011 : création/modification directe des référentiels Matières / Niveaux scolaires / Villes
 * par un Administrateur habilité (REF_CREATE) — contrairement aux Établissements (Ch.6.7), aucun
 * workflow de demande Parent ici. Jamais de suppression physique (RM-REF-007/008) : seule
 * l'activation/désactivation via `isActive` est possible.
 */
export function AdminReferentialsPage() {
  const { getAccessToken } = useAuth();

  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<AdminSchoolLevel[]>([]);
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [renamingSubject, setRenamingSubject] = useState<string | null>(null);
  const [renamingLevel, setRenamingLevel] = useState<string | null>(null);
  const [renamingCity, setRenamingCity] = useState<string | null>(null);

  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [levelName, setLevelName] = useState('');
  const [levelCode, setLevelCode] = useState('');
  const [levelOrder, setLevelOrder] = useState('');
  const [cityName, setCityName] = useState('');

  // RM-REF-009 : `listAllSubjects`/`listAllSchoolLevels`/`listAllCities` (vue Administrateur,
  // `GET /admin/referentials/*`) renvoient toutes les entrées actives ou non, contrairement aux
  // sélecteurs publics utilisés ailleurs dans l'app — sans quoi une entrée désactivée depuis cet
  // écran disparaissait de la liste sans aucun moyen de la réactiver.
  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [subjectsResult, levelsResult, citiesResult] = await Promise.all([
        referentialsApi.listAllSubjects(token),
        referentialsApi.listAllSchoolLevels(token),
        referentialsApi.listAllCities(token),
      ]);
      setSubjects(subjectsResult);
      setSchoolLevels(levelsResult);
      setCities(citiesResult);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les référentiels.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(action: () => Promise<unknown>, successMessage?: string) {
    setError(null);
    setNotice(null);
    try {
      await action();
      if (successMessage) setNotice(successMessage);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'opération a échoué.");
    }
  }

  async function handleExport() {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      await referentialsApi.downloadReferentialsCsv(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'export a échoué.");
    }
  }

  async function handleCreateSubject(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    await runAction(
      () => referentialsApi.createSubject(token, { name: subjectName, code: subjectCode }),
      `Matière "${subjectName}" créée.`,
    );
    setSubjectName('');
    setSubjectCode('');
  }

  async function handleCreateSchoolLevel(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    await runAction(
      () =>
        referentialsApi.createSchoolLevel(token, {
          name: levelName,
          code: levelCode,
          order: Number(levelOrder),
        }),
      `Niveau scolaire "${levelName}" créé.`,
    );
    setLevelName('');
    setLevelCode('');
    setLevelOrder('');
  }

  async function handleCreateCity(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    await runAction(() => referentialsApi.createCity(token, { name: cityName }), `Ville "${cityName}" créée.`);
    setCityName('');
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Référentiels métier</h1>
          <p>Matières, niveaux scolaires et villes — données de référence communes à toute la plateforme (Ch.23).</p>
        </div>
        <button type="button" onClick={handleExport}>
          Exporter en CSV
        </button>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}

      <section className="card-section">
        <h2>Matières ({subjects.length})</h2>
        {subjects.length === 0 ? (
          <p>Aucune matière pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Code</th>
                  <th>Statut</th>
                  <th>Créée le</th>
                  <th>Modifiée le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id} className={subject.isActive ? undefined : 'row-inactive'}>
                    <td data-label="Nom">{subject.name}</td>
                    <td data-label="Code">{subject.code}</td>
                    <td data-label="Statut">
                      <span className={`badge ${subject.isActive ? 'badge-success' : 'badge-warning'}`}>
                        {subject.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td data-label="Créée le">{formatDate(subject.createdAt)}</td>
                    <td data-label="Modifiée le">{formatDate(subject.updatedAt)}</td>
                    <td className="admin-actions">
                      {renamingSubject === subject.id ? (
                        <RenamePrompt
                          initialValue={subject.name}
                          onCancel={() => setRenamingSubject(null)}
                          onConfirm={(name) => {
                            setRenamingSubject(null);
                            const token = getAccessToken();
                            if (!token) return;
                            runAction(() => referentialsApi.updateSubject(token, subject.id, { name }));
                          }}
                        />
                      ) : (
                        <>
                          <button type="button" onClick={() => setRenamingSubject(subject.id)}>
                            Renommer
                          </button>
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => {
                              const token = getAccessToken();
                              if (!token) return;
                              runAction(
                                () => referentialsApi.updateSubject(token, subject.id, { isActive: !subject.isActive }),
                                `Matière "${subject.name}" ${subject.isActive ? 'désactivée' : 'réactivée'}.`,
                              );
                            }}
                          >
                            {subject.isActive ? 'Désactiver' : 'Réactiver'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3>Créer une matière</h3>
        <form onSubmit={handleCreateSubject}>
          <div className="field-row">
            <label>
              Nom
              <input type="text" required value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
            </label>
            <label>
              Code
              <input type="text" required value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} />
            </label>
          </div>
          <button type="submit" disabled={!subjectName || !subjectCode}>
            Créer la matière
          </button>
        </form>
      </section>

      <section className="card-section">
        <h2>Niveaux scolaires ({schoolLevels.length})</h2>
        {schoolLevels.length === 0 ? (
          <p>Aucun niveau scolaire pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Code</th>
                  <th>Ordre</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                  <th>Modifié le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schoolLevels.map((level) => (
                  <tr key={level.id} className={level.isActive ? undefined : 'row-inactive'}>
                    <td data-label="Nom">{level.name}</td>
                    <td data-label="Code">{level.code}</td>
                    <td data-label="Ordre">{level.order}</td>
                    <td data-label="Statut">
                      <span className={`badge ${level.isActive ? 'badge-success' : 'badge-warning'}`}>
                        {level.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td data-label="Créé le">{formatDate(level.createdAt)}</td>
                    <td data-label="Modifié le">{formatDate(level.updatedAt)}</td>
                    <td className="admin-actions">
                      {renamingLevel === level.id ? (
                        <RenamePrompt
                          initialValue={level.name}
                          onCancel={() => setRenamingLevel(null)}
                          onConfirm={(name) => {
                            setRenamingLevel(null);
                            const token = getAccessToken();
                            if (!token) return;
                            // Ch.23.5 : le renommage d'un niveau (ex. changement officiel de nom) reste
                            // une modification directe de l'entrée existante — les groupes/situations
                            // historiques restent rattachés au même identifiant, jamais supprimé.
                            runAction(() => referentialsApi.updateSchoolLevel(token, level.id, { name }));
                          }}
                        />
                      ) : (
                        <>
                          <button type="button" onClick={() => setRenamingLevel(level.id)}>
                            Renommer
                          </button>
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => {
                              const token = getAccessToken();
                              if (!token) return;
                              runAction(
                                () => referentialsApi.updateSchoolLevel(token, level.id, { isActive: !level.isActive }),
                                `Niveau scolaire "${level.name}" ${level.isActive ? 'désactivé' : 'réactivé'}.`,
                              );
                            }}
                          >
                            {level.isActive ? 'Désactiver' : 'Réactiver'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3>Créer un niveau scolaire</h3>
        <form onSubmit={handleCreateSchoolLevel}>
          <div className="field-row">
            <label>
              Nom
              <input type="text" required value={levelName} onChange={(e) => setLevelName(e.target.value)} />
            </label>
            <label>
              Code
              <input type="text" required value={levelCode} onChange={(e) => setLevelCode(e.target.value)} />
            </label>
            <label>
              Ordre
              <input
                type="number"
                min={1}
                required
                value={levelOrder}
                onChange={(e) => setLevelOrder(e.target.value)}
              />
            </label>
          </div>
          <button type="submit" disabled={!levelName || !levelCode || !levelOrder}>
            Créer le niveau scolaire
          </button>
        </form>
      </section>

      <section className="card-section">
        <h2>Villes ({cities.length})</h2>
        {cities.length === 0 ? (
          <p>Aucune ville pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Statut</th>
                  <th>Créée le</th>
                  <th>Modifiée le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((city) => (
                  <tr key={city.id} className={city.isActive ? undefined : 'row-inactive'}>
                    <td data-label="Nom">{city.name}</td>
                    <td data-label="Statut">
                      <span className={`badge ${city.isActive ? 'badge-success' : 'badge-warning'}`}>
                        {city.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td data-label="Créée le">{formatDate(city.createdAt)}</td>
                    <td data-label="Modifiée le">{formatDate(city.updatedAt)}</td>
                    <td className="admin-actions">
                      {renamingCity === city.id ? (
                        <RenamePrompt
                          initialValue={city.name}
                          onCancel={() => setRenamingCity(null)}
                          onConfirm={(name) => {
                            setRenamingCity(null);
                            const token = getAccessToken();
                            if (!token) return;
                            runAction(() => referentialsApi.updateCity(token, city.id, { name }));
                          }}
                        />
                      ) : (
                        <>
                          <button type="button" onClick={() => setRenamingCity(city.id)}>
                            Renommer
                          </button>
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => {
                              const token = getAccessToken();
                              if (!token) return;
                              runAction(
                                () => referentialsApi.updateCity(token, city.id, { isActive: !city.isActive }),
                                `Ville "${city.name}" ${city.isActive ? 'désactivée' : 'réactivée'}.`,
                              );
                            }}
                          >
                            {city.isActive ? 'Désactiver' : 'Réactiver'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3>Créer une ville</h3>
        <form onSubmit={handleCreateCity}>
          <label>
            Nom
            <input type="text" required value={cityName} onChange={(e) => setCityName(e.target.value)} />
          </label>
          <button type="submit" disabled={!cityName}>
            Créer la ville
          </button>
        </form>
      </section>
    </>
  );
}
