import { Link } from 'react-router-dom';
import {
  IconBell,
  IconBookOpen,
  IconCalendarCheck,
  IconChildren,
  IconClipboardCheck,
  IconCreditCard,
  IconGauge,
  IconLayers,
} from '../components/icons';

const teacherFeatureCards = [
  {
    icon: IconLayers,
    title: 'Groupes structurés',
    copy: 'Créez vos groupes, définissez les horaires récurrents, les niveaux, les matières et les capacités en quelques minutes.',
  },
  {
    icon: IconCalendarCheck,
    title: 'Séances organisées',
    copy: 'Gardez une vue claire sur les séances à venir, les reports, les absences et l historique de chaque groupe.',
  },
  {
    icon: IconCreditCard,
    title: 'Suivi comptable',
    copy: 'Visualisez les paiements, les ajustements et les restes à régler pour chaque inscription, sans tableur séparé.',
  },
];

const parentFeatureCards = [
  {
    icon: IconChildren,
    title: 'Enfants suivis',
    copy: 'Retrouvez les informations de chaque enfant, ses groupes, ses inscriptions et son parcours dans un espace simple.',
  },
  {
    icon: IconClipboardCheck,
    title: 'Demandes d inscription',
    copy: 'Recherchez un groupe adapté, envoyez une préinscription et suivez la réponse du professeur sans échanges dispersés.',
  },
  {
    icon: IconGauge,
    title: 'Assiduité visible',
    copy: 'Consultez les présences, absences, retards et montants à régler avec une lecture claire et immédiate.',
  },
];

export function HomePage() {
  return (
    <main className="landing-page">
      <header className="landing-nav" aria-label="Navigation principale">
        <Link to="/" className="landing-brand">
          <img src="/logo.png" alt="GROUPI" />
        </Link>
        <nav className="landing-nav-links" aria-label="Accès rapides">
          <a href="#fonctionnalites">Fonctionnalités</a>
          <Link to="/login">Connexion</Link>
          <Link to="/register" className="landing-nav-cta">
            Créer un compte
          </Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-kicker">Gestion des cours particuliers</p>
          <h1>GROUPI simplifie le quotidien des professeurs et rassure les parents.</h1>
          <p className="landing-hero-text">
            Une plateforme claire pour organiser les groupes, suivre les séances, gérer les
            inscriptions, les présences et les comptes de suivi comptable.
          </p>
          <div className="landing-hero-actions">
            <Link to="/register" className="landing-button landing-button-primary">
              Démarrer avec GROUPI
            </Link>
            <Link to="/login" className="landing-button landing-button-secondary">
              Se connecter
            </Link>
          </div>
          <dl className="landing-metrics" aria-label="Points forts de GROUPI">
            <div>
              <dt>1 espace</dt>
              <dd>Professeur & parent</dd>
            </div>
            <div>
              <dt>GRATUIT</dt>
              <dd>Pour les parents</dd>
            </div>
            <div>
              <dt>Temps réel</dt>
              <dd>Suivi des séances</dd>
            </div>
          </dl>
        </div>

        <div className="landing-product" aria-label="Aperçu de l interface GROUPI">
          <div className="landing-product-top">
            <span />
            <span />
            <span />
          </div>
          <div className="landing-product-body">
            <aside className="landing-product-sidebar">
              <img src="/favicon.png" alt="" aria-hidden="true" />
              <span />
              <span />
              <span />
            </aside>
            <div className="landing-product-main">
              <div className="landing-product-heading">
                <div>
                  <strong>Tableau de bord</strong>
                  <p>Aujourd'hui</p>
                </div>
                <IconBell />
              </div>
              <div className="landing-product-grid">
                <div className="landing-product-tile tile-teal">
                  <IconCalendarCheck />
                  <strong>12</strong>
                  <span>Séances</span>
                </div>
                <div className="landing-product-tile tile-green">
                  <IconClipboardCheck />
                  <strong>86%</strong>
                  <span>Assiduité</span>
                </div>
                <div className="landing-product-tile tile-amber">
                  <IconCreditCard />
                  <strong>4</strong>
                  <span>À régler</span>
                </div>
              </div>
              <div className="landing-product-list">
                <div>
                  <span className="landing-list-dot" />
                  <p>Groupe BAC MATHS - Séance 1</p>
                  <strong>18:00</strong>
                </div>
                <div>
                  <span className="landing-list-dot dot-green" />
                  <p>Séance 9EME SVT reportée</p>
                  <strong>Parent</strong>
                </div>
                <div>
                  <span className="landing-list-dot dot-amber" />
                  <p>Paiement à vérifier</p>
                  <strong>30 TND</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="landing-section landing-feature-section">
        <div className="landing-section-header">
          <p className="landing-kicker">Deux espaces complémentaires et plateforme partagée</p>
          <h2>Des fonctionnalités pensées spécialement pour le professeur et pour le parent.</h2>
        </div>

        <div className="landing-feature-blocks">
          <div className="landing-feature-block">
            <div className="landing-feature-block-heading">
              <span className="landing-card-icon">
                <IconBookOpen />
              </span>
              <div>
                <p className="landing-kicker">Pour les professeurs</p>
                <h3>Gérer l activité sans perdre le fil.</h3>
              </div>
            </div>
            <div className="landing-feature-grid">
              {teacherFeatureCards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article className="landing-card" key={feature.title}>
                    <span className="landing-card-icon">
                      <Icon />
                    </span>
                    <h3>{feature.title}</h3>
                    <p>{feature.copy}</p>
                  </article>
                );
              })}
            </div>
            <div className="landing-inline-cta">
              <div>
                <p className="landing-kicker">Prêt à structurer votre activité ?</p>
                <h3>Ouvrez un compte GROUPI et organisez vos cours particuliers dès aujourd'hui.</h3>
              </div>
              <Link to="/register" className="landing-button landing-button-primary">
                PROF : Créer mon compte
              </Link>
            </div>
          </div>

          <div className="landing-feature-block landing-feature-block-parent">
            <div className="landing-feature-block-heading">
              <span className="landing-card-icon">
                <IconChildren />
              </span>
              <div>
                <p className="landing-kicker">Pour les parents</p>
                <h3>Suivre son enfant avec une vue simple.</h3>
              </div>
            </div>
            <div className="landing-feature-grid">
              {parentFeatureCards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article className="landing-card" key={feature.title}>
                    <span className="landing-card-icon">
                      <Icon />
                    </span>
                    <h3>{feature.title}</h3>
                    <p>{feature.copy}</p>
                  </article>
                );
              })}
            </div>
            <div className="landing-inline-cta">
              <div>
                <p className="landing-kicker">Prêt à suivre facilement les séances de vos enfants ?</p>
                <h3>Ouvrez un compte GROUPI et suivez leur progression en temps réel.</h3>
              </div>
              <Link to="/register?role=parent" className="landing-button landing-button-primary">
                PARENT : Créer mon compte
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}