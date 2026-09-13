import type { SVGProps } from 'react';

/** Icônes minimalistes (trait, currentColor) — évite une dépendance externe. */
function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}

export function IconBookOpen(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H9a3 3 0 0 1 3 3v15a2.5 2.5 0 0 0-2.5-2.5H2z" />
      <path d="M22 4.5A2.5 2.5 0 0 0 19.5 2H15a3 3 0 0 0-3 3v15a2.5 2.5 0 0 1 2.5-2.5H22z" />
    </Icon>
  );
}

export function IconChildren(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="6" r="3" />
      <circle cx="16" cy="6" r="3" />
      <path d="M2 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M14 15h2a4 4 0 0 1 4 4v2" />
    </Icon>
  );
}

export function IconCalendarCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </Icon>
  );
}

export function IconLayers(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </Icon>
  );
}

export function IconSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </Icon>
  );
}

export function IconClipboardCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="6" y="3" width="12" height="4" rx="1" />
      <path d="M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3" />
      <path d="m9 14 2 2 4-4" />
    </Icon>
  );
}

export function IconUserPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
      <path d="M19 8v6M22 11h-6" />
    </Icon>
  );
}

export function IconUserCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
      <path d="m16 11 2 2 4-4" />
    </Icon>
  );
}

export function IconBell(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Icon>
  );
}

export function IconLogOut(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </Icon>
  );
}

export function IconCreditCard(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </Icon>
  );
}

export function IconWallet(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M20 7H5a2 2 0 0 1 0-4h13v4" />
      <path d="M4 7h16v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7Z" />
      <path d="M16 14h.01" />
    </Icon>
  );
}

export function IconAlertTriangle(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

export function IconGauge(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 20a8 8 0 1 0-8-8" />
      <path d="M12 12 8.5 8.5" />
      <path d="M2 12h2" />
      <path d="M12 2v2" />
      <path d="M22 12h-2" />
    </Icon>
  );
}

export function IconDownload(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 19h16" />
    </Icon>
  );
}

export function IconDotsHorizontal(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </Icon>
  );
}

export function IconSun(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </Icon>
  );
}

export function IconMoon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Icon>
  );
}

export function IconChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

export function IconChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

export function IconPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function IconMegaphone(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m3 11 18-5v12L3 13v-2Z" />
      <path d="M11.6 16.8 13 21h-2l-1.9-4.3" />
    </Icon>
  );
}

export function IconMessageCircle(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-4.5 7.5 8.5 8.5 0 0 1-9-.5L3 21l2.5-4.5a8.38 8.38 0 0 1-.5-9 8.5 8.5 0 0 1 7.5-4.5h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </Icon>
  );
}

export function IconCopy(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Icon>
  );
}

export function IconRefreshCw(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
      <path d="M8 21H3v-5" />
    </Icon>
  );
}

export function IconPower(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 2v8" />
      <path d="M18.4 6.6a9 9 0 1 1-12.77 0" />
    </Icon>
  );
}

/** Logo WhatsApp (couleur de marque) — seule icône colorée hors palette sémantique de l'appli,
 * réservée à ce cas précis (identifier le service externe), jamais réutilisée comme statut. */
export function IconWhatsApp(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.47 14.38c-.29-.15-1.7-.84-1.96-.93-.26-.1-.46-.15-.65.15-.2.29-.75.93-.92 1.12-.17.2-.34.22-.63.08-.29-.15-1.23-.45-2.34-1.44-.86-.77-1.45-1.72-1.62-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.08-.15-.65-1.56-.89-2.14-.23-.56-.47-.48-.65-.49h-.56c-.2 0-.51.07-.78.37s-1.03 1-1.03 2.45 1.06 2.85 1.2 3.05c.15.2 2.09 3.19 5.07 4.47.71.31 1.26.49 1.69.62.71.23 1.36.19 1.87.12.57-.09 1.7-.7 1.94-1.37.24-.68.24-1.26.17-1.38-.07-.12-.26-.2-.55-.34Z" />
      <path d="M12.01 2C6.5 2 2 6.48 2 11.98c0 1.77.47 3.5 1.35 5.02L2 22l5.14-1.33a10 10 0 0 0 4.87 1.24h.01c5.51 0 10-4.48 10-9.98C22 6.48 17.52 2 12.01 2Zm0 18.2h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.05.79.82-2.97-.2-.31a8.18 8.18 0 0 1-1.26-4.4c0-4.52 3.68-8.2 8.2-8.2 2.19 0 4.25.86 5.8 2.41a8.14 8.14 0 0 1 2.4 5.8c0 4.52-3.68 8.21-8.21 8.21Z" />
    </svg>
  );
}
