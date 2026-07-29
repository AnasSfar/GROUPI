import { useEffect, useState } from 'react';
import type { SchoolLevel, SchoolLevelSection } from '../api/referentialsApi';
import { SCHOOL_LEVEL_SECTIONS, SCHOOL_LEVEL_SECTION_LABELS, schoolLevelSection } from '../api/referentialsApi';

interface SchoolLevelSectionPickerProps {
  levels: SchoolLevel[];
  selectedIds: string[];
  onToggle: (levelId: string, checked: boolean) => void;
}

interface SectionGroup {
  section: SchoolLevelSection;
  levels: SchoolLevel[];
}

/**
 * Chaque section (primaire/collège/lycée) est un panneau repliable ouvert/fermé d'un seul clic
 * sur son en-tête — plutôt qu'un menu déroulant séparé qui se contentait de révéler la section
 * sans rien sélectionner (un détour à deux étapes pour une action qui n'en demande qu'une).
 */
export function SchoolLevelSectionPicker({ levels, selectedIds, onToggle }: SchoolLevelSectionPickerProps) {
  const sections: SectionGroup[] = SCHOOL_LEVEL_SECTIONS.map((section) => ({
    section,
    levels: levels.filter((level) => schoolLevelSection(level.code) === section),
  })).filter((group) => group.levels.length > 0);

  const [openSections, setOpenSections] = useState<SchoolLevelSection[]>([]);

  // Ouvre automatiquement les sections qui ont déjà une sélection (profil existant chargé après
  // le premier rendu), sans jamais refermer une section que l'utilisateur a ouverte lui-même.
  useEffect(() => {
    const sectionsWithSelection = sections
      .filter(({ levels: sectionLevels }) => sectionLevels.some((l) => selectedIds.includes(l.id)))
      .map((g) => g.section);
    setOpenSections((prev) => {
      const missing = sectionsWithSelection.filter((s) => !prev.includes(s));
      return missing.length > 0 ? [...prev, ...missing] : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels, selectedIds]);

  function toggleSectionOpen(section: SchoolLevelSection) {
    setOpenSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section],
    );
  }

  return (
    <div className="level-section-picker">
      {sections.map(({ section, levels: sectionLevels }) => {
        const open = openSections.includes(section);
        const selectedCount = sectionLevels.filter((l) => selectedIds.includes(l.id)).length;
        return (
          <div className="level-section" key={section}>
            <button
              type="button"
              className="level-section-header"
              aria-expanded={open}
              onClick={() => toggleSectionOpen(section)}
            >
              <span className={`level-section-chevron ${open ? 'is-open' : ''}`} aria-hidden="true">
                ›
              </span>
              <span className="level-section-title">{SCHOOL_LEVEL_SECTION_LABELS[section]}</span>
              <span className="level-section-count">
                {selectedCount > 0 ? `${selectedCount} sélectionné${selectedCount > 1 ? 's' : ''}` : sectionLevels.length}
              </span>
            </button>
            {open && (
              <div className="level-section-options">
                {sectionLevels.map((level) => (
                  <label key={level.id} className="level-option">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(level.id)}
                      onChange={(e) => onToggle(level.id, e.target.checked)}
                    />
                    {level.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
