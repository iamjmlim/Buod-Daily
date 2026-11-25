import type { Locale } from './i18n';

// Text of the Privacy Policy and Contact pages. Everything here describes what the site actually does
// (see app/[lang]/layout.tsx, lib/theme.ts, components/site/digest-signup.tsx).

export const FB_PAGE_URL = 'https://www.facebook.com/profile.php?id=61596932667073';
export const POLICY_UPDATED = '2026-11-26';

export type LegalSection = { heading: string; points?: string[]; text?: string };
export type LegalPage = { title: string; description: string; intro: string; sections: LegalSection[] };

export const PRIVACY: Record<Locale, LegalPage> = {
  en: {
    title: 'Privacy Policy',
    description: 'What Buod Daily collects (very little), how the email digest works, and how ads and cookies may be used.',
    intro: 'Buod Daily is a free news summary site. We have no user accounts and keep the data we collect to a minimum. This page explains exactly what that is.',
    sections: [
      {
        heading: 'What we collect',
        points: [
          'Anonymous visit counts: we use Vercel Web Analytics to count page views. It does not use cookies and does not identify you.',
          'Standard server logs: our hosting provider (Vercel) may keep technical logs, such as IP addresses, for security and to keep the site running.',
        ],
      },
      {
        heading: 'Email digest',
        points: [
          'If you subscribe to the daily digest, your email address is sent straight to Buttondown, the service that sends our newsletter. It is not stored on our site.',
          'We use your email only to send the digest. We never sell or share it.',
          'Every email has an unsubscribe link, and you can unsubscribe at any time.',
        ],
      },
      {
        heading: 'Cookies and your browser',
        points: [
          'We do not use cookies for analytics.',
          'If you switch between light and dark mode, your choice is saved in your browser’s local storage so the site remembers it. It never leaves your device.',
        ],
      },
      {
        heading: 'Advertising',
        text: 'We may show ads from Google (Google AdSense) to keep the site free. Google and its partners may use cookies to show ads based on your visits to this and other websites. You can turn off personalized ads in Google’s Ads Settings (adssettings.google.com), and learn more at policies.google.com/technologies/ads.',
      },
      {
        heading: 'Links to news outlets',
        text: 'Every summary links to the original reports. Those sites have their own privacy policies; we are not responsible for how they handle your data.',
      },
      {
        heading: 'Changes and questions',
        text: 'If we change this policy, we will update this page and its date. For questions, message us through our Facebook Page (see our Contact page).',
      },
    ],
  },
  fil: {
    title: 'Privacy Policy',
    description: 'Ano ang kinokolekta ng Buod Daily (napakakaunti), paano gumagana ang email digest, at paano maaaring gamitin ang ads at cookies.',
    intro: 'Libreng site ng buod ng balita ang Buod Daily. Wala kaming user account, at pinakakaunti lang ang datos na kinokolekta namin. Ipinaliliwanag dito kung ano iyon.',
    sections: [
      {
        heading: 'Ano ang kinokolekta namin',
        points: [
          'Bilang ng bisita na walang pagkakakilanlan: gumagamit kami ng Vercel Web Analytics para bilangin ang page views. Hindi ito gumagamit ng cookies at hindi ka nito nakikilala.',
          'Karaniwang server logs: maaaring magtago ang aming hosting provider (Vercel) ng teknikal na logs, gaya ng IP address, para sa seguridad at maayos na takbo ng site.',
        ],
      },
      {
        heading: 'Email digest',
        points: [
          'Kung mag-subscribe ka sa daily digest, direktang ipinapadala ang email address mo sa Buttondown, ang serbisyong nagpapadala ng newsletter namin. Hindi ito iniimbak sa site namin.',
          'Ginagamit lang namin ang email mo para ipadala ang digest. Hindi namin ito ibinebenta o ibinabahagi kailanman.',
          'May unsubscribe link ang bawat email, at puwede kang mag-unsubscribe anumang oras.',
        ],
      },
      {
        heading: 'Cookies at ang browser mo',
        points: [
          'Hindi kami gumagamit ng cookies para sa analytics.',
          'Kung magpapalit ka sa light o dark mode, nase-save ang pinili mo sa local storage ng browser mo para matandaan ito ng site. Hindi ito umaalis sa device mo.',
        ],
      },
      {
        heading: 'Advertising',
        text: 'Maaari kaming magpakita ng ads mula sa Google (Google AdSense) para manatiling libre ang site. Maaaring gumamit ang Google at mga partner nito ng cookies para magpakita ng ads batay sa pagbisita mo rito at sa ibang website. Puwede mong i-off ang personalized ads sa Ads Settings ng Google (adssettings.google.com), at alamin pa sa policies.google.com/technologies/ads.',
      },
      {
        heading: 'Mga link sa news outlet',
        text: 'Nagli-link ang bawat buod sa mga orihinal na ulat. May sarili silang privacy policy; hindi kami responsable sa paghawak nila ng datos mo.',
      },
      {
        heading: 'Mga pagbabago at tanong',
        text: 'Kung babaguhin namin ang policy na ito, ia-update namin ang pahinang ito at ang petsa nito. Para sa mga tanong, mag-message sa amin sa aming Facebook Page (tingnan ang Contact page).',
      },
    ],
  },
};

export const CONTACT: Record<Locale, LegalPage & { button: string; responseNote: string }> = {
  en: {
    title: 'Contact us',
    description: 'How to reach Buod Daily for corrections, questions and feedback.',
    intro: 'The fastest way to reach us is a message to the Buod Daily Facebook Page. We read every message.',
    button: 'Message us on Facebook',
    responseNote: 'We usually reply within a few days.',
    sections: [
      {
        heading: 'Good reasons to message us',
        points: [
          'A summary has a mistake or leaves out something important. Tell us which story and what the original report says.',
          'A news outlet corrected or removed a report we link to.',
          'You have feedback or a suggestion for the site.',
        ],
      },
      {
        heading: 'Please note',
        points: [
          'We summarize reports from other news outlets; for questions about a report itself, contact that outlet.',
          'Never send us passwords, ID numbers or one-time PINs. We will never ask for them.',
        ],
      },
    ],
  },
  fil: {
    title: 'Makipag-ugnayan sa amin',
    description: 'Paano makipag-ugnayan sa Buod Daily para sa mga pagwawasto, tanong at feedback.',
    intro: 'Ang pinakamabilis na paraan ay mag-message sa Facebook Page ng Buod Daily. Binabasa namin ang bawat mensahe.',
    button: 'Mag-message sa Facebook',
    responseNote: 'Karaniwang sumasagot kami sa loob ng ilang araw.',
    sections: [
      {
        heading: 'Magandang dahilan para mag-message',
        points: [
          'May mali o kulang na mahalagang detalye ang isang buod. Sabihin kung aling balita at ano ang sinasabi ng orihinal na ulat.',
          'Nagwasto o nagtanggal ng ulat ang isang news outlet na nili-link namin.',
          'May feedback o mungkahi ka para sa site.',
        ],
      },
      {
        heading: 'Paalala',
        points: [
          'Binubuod namin ang mga ulat ng ibang news outlet; para sa tanong tungkol sa mismong ulat, makipag-ugnayan sa outlet na iyon.',
          'Huwag kailanman magpadala sa amin ng password, ID number o one-time PIN. Hindi namin ito hihingin kailanman.',
        ],
      },
    ],
  },
};
