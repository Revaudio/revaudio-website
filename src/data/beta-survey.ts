/**
 * RevLimiter Beta — feedback survey question bank.
 *
 * SINGLE SOURCE OF TRUTH for both the public form (src/pages/beta.astro) and the
 * local analysis dashboard (~/projects/revaudio/revbeta-dashboard/). The form
 * renders these questions; the dashboard aggregates on the same value codes.
 *
 * Bilingual: every label carries `he` + `en`. Hebrew is the default (RTL); the
 * form has an HE⇄EN toggle. CRITICAL: closed answers are stored as language-
 * independent `code`s (e.g. "got_stuck"), never the displayed string, so Hebrew
 * and English responses aggregate together. Likert = integer 1..5 bound to the
 * anchor MEANING (1 = low/disagree), not screen position. Product brand terms
 * (Cruise/Sport/NOS, preset names, REVL.xxx, true-peak/PDC) stay verbatim in
 * both languages because that's how they appear in the plugin UI.
 *
 * `id` == the Supabase column name. Keep ids snake_case and STABLE forever — a
 * rename breaks the table + the dashboard. To change wording, edit he/en only.
 */

export type Lang = 'he' | 'en';
export type QType = 'shorttext' | 'text' | 'single' | 'multi' | 'likert5' | 'nps';

export interface Choice {
  code: string; // language-independent, stored verbatim
  he: string;
  en: string;
}

/** A conditional free-text follow-up revealed when the parent answer matches. */
export interface RevealField {
  id: string; // its own DB column
  type: 'text' | 'shorttext';
  he: string;
  en: string;
}

export interface Question {
  id: string; // == DB column, stable
  section: string; // section id
  type: QType;
  required: boolean;
  he: string;
  en: string;
  helpHe?: string;
  helpEn?: string;
  choices?: Choice[]; // single | multi
  /** Adds an "Other" choice with a free-text input, stored in `${id}_other`. */
  hasOther?: boolean;
  /** likert only: adds a "not applicable" option that stores null. */
  allowNa?: boolean;
  /** likert / nps endpoint labels (defaults to agree/disagree for likert). */
  scale?: { lowHe: string; lowEn: string; highHe: string; highEn: string };
  /** Conditional follow-up shown when the parent value is in `whenIn`. */
  reveal?: { whenIn: string[]; field: RevealField };
  maxLen?: number;
}

export interface Section {
  id: string;
  he: string;
  en: string;
}

export const surveyMeta = {
  version: 1,
  productName: 'RevLimiter',
  introPriceUsd: 93,
  // i18n for the shared form chrome (title, toggle, submit, statuses).
  ui: {
    titleHe: 'משוב בטא: RevLimiter',
    titleEn: 'RevLimiter Beta Feedback',
    introHe:
      'תודה שבדקת את RevLimiter. המשוב הזה הוא מה שיעצב את גרסת ה-Alpha לפני ההשקה. כל שאלה עוזרת. ~7 דקות.',
    introEn:
      'Thanks for testing RevLimiter. This feedback shapes the alpha build before launch. Every answer helps. ~7 minutes.',
    requiredHe: 'חובה',
    requiredEn: 'required',
    optionalHe: 'רשות',
    optionalEn: 'optional',
    otherHe: 'אחר',
    otherEn: 'Other',
    otherPlaceholderHe: 'פרט/י…',
    otherPlaceholderEn: 'please specify…',
    naHe: 'לא רלוונטי',
    naEn: "N/A",
    submitHe: 'שליחה',
    submitEn: 'Submit',
    sendingHe: 'שולח…',
    sendingEn: 'Sending…',
    thanksHe: 'תודה! המשוב שלך נקלט. זה ממש עוזר לנו.',
    thanksEn: "Thank you. Your feedback came through. This genuinely helps.",
    errHe: 'משהו השתבש. נסה/י שוב, או כתוב/כתבי ל-info@revaudio.net.',
    errEn: 'Something went wrong. Try again, or email info@revaudio.net.',
    softHe: 'טופס המשוב ייפתח בקרוב. התשובות שלך עדיין לא נשלחו.',
    softEn: "The feedback form opens shortly. Your answers weren't sent yet.",
    badCodeHe: 'קוד הגישה שגוי. בדוק/בדקי את מייל ההזמנה.',
    badCodeEn: 'That beta access code is incorrect. Check your invite email.',
    requiredMissingHe: 'יש שאלות חובה שטרם נענו (מסומנות).',
    requiredMissingEn: 'Some required questions are unanswered (highlighted).',
    langLabelHe: 'EN',
    langLabelEn: 'עברית',
  },
} as const;

export const sections: Section[] = [
  { id: 'gate', he: 'גישה לבטא', en: 'Beta access' },
  { id: 'about', he: 'קצת עליך', en: 'About you' },
  { id: 'onboarding', he: 'התקנה והפעלה', en: 'Install & activation' },
  { id: 'ui', he: 'ממשק וחוויית שימוש', en: 'Interface & UX' },
  { id: 'sound', he: 'סאונד והשוואה', en: 'Sound & comparison' },
  { id: 'bugs', he: 'באגים ויציבות', en: 'Bugs & stability' },
  { id: 'value', he: 'ערך, תמחור והמלצה', en: 'Value, pricing & advocacy' },
  { id: 'open', he: 'משוב חופשי', en: 'Open feedback' },
];

const AGREE_SCALE = {
  lowHe: 'כלל לא מסכים/ה',
  lowEn: 'Strongly disagree',
  highHe: 'מסכים/ה לחלוטין',
  highEn: 'Strongly agree',
};

export const questions: Question[] = [
  // ── gate ──────────────────────────────────────────────────────────────────
  {
    id: 'beta_code',
    section: 'gate',
    type: 'shorttext',
    required: true,
    he: 'קוד גישה לבטא',
    en: 'Beta access code',
    helpHe: 'מתוך מייל ההזמנה ששלחנו לך.',
    helpEn: 'From the invite email we sent you.',
    maxLen: 40,
  },

  // ── about you ─────────────────────────────────────────────────────────────
  {
    id: 'role',
    section: 'about',
    type: 'single',
    required: true,
    he: 'התפקיד העיקרי שלך',
    en: 'Your primary role',
    choices: [
      { code: 'producer', he: 'מפיק/ה', en: 'Producer' },
      { code: 'mixing_engineer', he: 'הנדסאי/ת מיקס', en: 'Mixing engineer' },
      { code: 'mastering_engineer', he: 'הנדסאי/ת מאסטרינג', en: 'Mastering engineer' },
      { code: 'artist_hobbyist', he: 'אמן/ית · חובב/ת', en: 'Artist / hobbyist' },
    ],
    hasOther: true,
  },
  {
    id: 'experience',
    section: 'about',
    type: 'single',
    required: true,
    he: 'כמה שנים את/ה עוסק/ת באודיו',
    en: 'Years working with audio',
    choices: [
      { code: 'lt2', he: 'פחות מ-2', en: 'Under 2' },
      { code: '2_5', he: '2–5', en: '2–5' },
      { code: '6_10', he: '6–10', en: '6–10' },
      { code: 'gt10', he: '10+', en: '10+' },
    ],
  },
  {
    id: 'daw',
    section: 'about',
    type: 'multi',
    required: true,
    he: 'באיזה DAW בדקת את RevLimiter?',
    en: 'Which DAW(s) did you test RevLimiter in?',
    choices: [
      { code: 'ableton', he: 'Ableton Live', en: 'Ableton Live' },
      { code: 'logic', he: 'Logic Pro', en: 'Logic Pro' },
      { code: 'fl_studio', he: 'FL Studio', en: 'FL Studio' },
      { code: 'pro_tools', he: 'Pro Tools', en: 'Pro Tools' },
      { code: 'cubase', he: 'Cubase', en: 'Cubase' },
      { code: 'studio_one', he: 'Studio One', en: 'Studio One' },
      { code: 'reaper', he: 'Reaper', en: 'Reaper' },
      { code: 'bitwig', he: 'Bitwig', en: 'Bitwig' },
    ],
    hasOther: true,
  },
  {
    id: 'os',
    section: 'about',
    type: 'single',
    required: true,
    he: 'מערכת הפעלה',
    en: 'Operating system',
    choices: [
      { code: 'macos', he: 'macOS', en: 'macOS' },
      { code: 'windows', he: 'Windows', en: 'Windows' },
    ],
  },
  {
    id: 'format',
    section: 'about',
    type: 'single',
    required: true,
    he: 'פורמט הפלאגין שהשתמשת בו',
    en: 'Plugin format you used',
    choices: [
      { code: 'vst3', he: 'VST3', en: 'VST3' },
      { code: 'au', he: 'AU (Audio Unit)', en: 'AU (Audio Unit)' },
      { code: 'aax', he: 'AAX (Pro Tools)', en: 'AAX (Pro Tools)' },
    ],
  },
  {
    id: 'current_limiter',
    section: 'about',
    type: 'multi',
    required: true,
    he: 'באיזה לימיטר/ים את/ה משתמש/ת בדרך כלל?',
    en: 'Which limiter(s) do you normally reach for?',
    choices: [
      { code: 'prol2', he: 'FabFilter Pro-L 2', en: 'FabFilter Pro-L 2' },
      { code: 'waves_l2', he: 'Waves L2', en: 'Waves L2' },
      { code: 'waves_l3', he: 'Waves L3 / L3-LL', en: 'Waves L3 / L3-LL' },
      { code: 'ozone', he: 'iZotope Ozone Maximizer', en: 'iZotope Ozone Maximizer' },
      { code: 'brainworx', he: 'Brainworx', en: 'Brainworx' },
      { code: 'dmg', he: 'DMG Limitless', en: 'DMG Limitless' },
      { code: 'god_particle', he: 'God Particle', en: 'God Particle' },
      { code: 'native', he: 'הלימיטר המובנה ב-DAW', en: 'Native DAW limiter' },
      { code: 'none', he: 'אף אחד / לא משתמש/ת', en: "None / I don't use one" },
    ],
    hasOther: true,
  },
  {
    id: 'attribution',
    section: 'about',
    type: 'single',
    required: false,
    he: 'איך שמעת לראשונה על RevLimiter?',
    en: 'How did you first hear about RevLimiter?',
    choices: [
      { code: 'team', he: 'ישירות מהצוות', en: 'Directly from the team' },
      { code: 'friend', he: 'חבר/ה או קולגה', en: 'Friend / colleague' },
      { code: 'youtube', he: 'YouTube', en: 'YouTube' },
      { code: 'instagram_tiktok', he: 'אינסטגרם / טיקטוק', en: 'Instagram / TikTok' },
      { code: 'forum_reddit', he: 'פורום / Reddit', en: 'Forum / Reddit' },
      { code: 'facebook', he: 'קבוצת פייסבוק', en: 'Facebook group' },
    ],
    hasOther: true,
  },

  // ── onboarding & activation ───────────────────────────────────────────────
  {
    id: 'activation_result',
    section: 'onboarding',
    type: 'single',
    required: true,
    he: 'הפעלת הרישיון (הדבקת המפתח → Activate) הייתה…',
    en: 'Activating your license (paste key → Activate) was…',
    choices: [
      { code: 'smooth', he: 'חלקה', en: 'Smooth' },
      { code: 'minor_confusion', he: 'עם בלבול קל', en: 'A little confusing' },
      { code: 'got_stuck', he: 'נתקעתי באמצע', en: 'I got stuck' },
      { code: 'couldnt_activate', he: 'לא הצלחתי להפעיל', en: "Couldn't activate" },
    ],
    reveal: {
      whenIn: ['got_stuck', 'couldnt_activate'],
      field: {
        id: 'activation_detail',
        type: 'text',
        he: 'מה השתבש בהפעלה?',
        en: 'What went wrong with activation?',
      },
    },
  },
  {
    id: 'onboarding_friction',
    section: 'onboarding',
    type: 'text',
    required: false,
    he: 'היה חיכוך כלשהו מההורדה ועד הסאונד המעובד הראשון?',
    en: 'Any friction from download to first processed sound?',
    maxLen: 2000,
  },

  // ── interface & UX ────────────────────────────────────────────────────────
  {
    id: 'theme_clarity',
    section: 'ui',
    type: 'single',
    required: true,
    he: 'העיצוב בהשראת רכב (Cruise/Sport/NOS, Eng. Heat, מד-הסיבובים): עזר או הפריע לך להבין את הפרמטרים?',
    en: 'The car-inspired design (Cruise/Sport/NOS, Eng. Heat, rev gauge): did it help or get in the way of understanding the parameters?',
    helpHe: 'אלה השמות והאלמנטים בהשראת עולם הרכב שמופיעים בממשק.',
    helpEn: 'These are the car-world names and elements used across the interface.',
    choices: [
      { code: 'clearer', he: 'עזר לי להבין את הפרמטרים', en: 'Helped me understand the parameters' },
      { code: 'no_effect', he: 'לא השפיע לכאן או לכאן', en: 'No real effect either way' },
      { code: 'confusing', he: 'בלבל / הפריע לי', en: 'Confused me / got in the way' },
    ],
  },
  {
    id: 'usable_no_docs',
    section: 'ui',
    type: 'likert5',
    required: true,
    he: 'יכולתי להפעיל את הפרמטרים בלי לקרוא שום מדריך.',
    en: 'I could operate the parameters without reading any manual.',
    scale: AGREE_SCALE,
  },
  {
    id: 'control_clarity',
    section: 'ui',
    type: 'multi',
    required: false,
    he: 'אילו פרמטרים היו לא ברורים או מבלבלים? (השאר/י ריק אם הכול היה ברור)',
    en: 'Which parameters were unclear or confusing? (leave empty if all were clear)',
    choices: [
      { code: 'threshold', he: 'Threshold', en: 'Threshold' },
      { code: 'clipper', he: 'Clipper (Ceiling)', en: 'Clipper (Ceiling)' },
      { code: 'eng_heat', he: 'Eng. Heat', en: 'Eng. Heat' },
      { code: 'drive_modes', he: 'Drive modes (Cruise/Sport/NOS)', en: 'Drive modes (Cruise/Sport/NOS)' },
      { code: 'gr_meters', he: 'מדי Gain-Reduction', en: 'Gain-reduction meters' },
      { code: 'bands', he: 'Low / Mid / High', en: 'Low / Mid / High' },
    ],
  },
  {
    id: 'ui_change',
    section: 'ui',
    type: 'text',
    required: false,
    he: 'מה בממשק בלבל אותך, או מה היית משנה?',
    en: 'What in the interface confused you, or what would you change?',
    maxLen: 2000,
  },

  // ── sound & comparison ────────────────────────────────────────────────────
  {
    id: 'sound_quality',
    section: 'sound',
    type: 'likert5',
    required: true,
    he: 'איכות הסאונד הכוללת של RevLimiter.',
    en: 'Overall sound quality of RevLimiter.',
    scale: { lowHe: 'חלשה', lowEn: 'Poor', highHe: 'מעולה', highEn: 'Excellent' },
  },
  {
    id: 'vs_goto',
    section: 'sound',
    type: 'single',
    required: true,
    he: 'הסאונד בהשוואה ללימיטר הקבוע שלך:',
    en: 'Sound compared to your go-to limiter:',
    choices: [
      { code: 'better', he: 'טוב יותר', en: 'Better' },
      { code: 'on_par', he: 'ברמה דומה', en: 'On par' },
      { code: 'slightly_behind', he: 'מעט מאחור', en: 'Slightly behind' },
      { code: 'much_behind', he: 'הרבה מאחור', en: 'Much behind' },
    ],
  },
  {
    id: 'switch_intent',
    section: 'sound',
    type: 'single',
    required: true,
    he: 'מה הסיכוי שתשתמש/י ב-RevLimiter במקום הלימיטר הקבוע שלך במאסטרים הבאים?',
    en: 'How likely are you to use RevLimiter instead of your go-to on future masters?',
    choices: [
      { code: 'replace', he: 'אחליף אליו', en: "I'd replace my go-to" },
      { code: 'alongside', he: 'אשתמש בו לצד הקבוע', en: "I'd use it alongside" },
      { code: 'occasional', he: 'מדי פעם', en: 'Occasional use' },
      { code: 'wouldnt', he: 'לא אחליף', en: "I wouldn't switch" },
    ],
  },
  {
    id: 'cpu_perf',
    section: 'sound',
    type: 'likert5',
    required: true,
    allowNa: true,
    he: 'צריכת ה-CPU / הביצועים הייתה סבירה לאופן העבודה שלי.',
    en: 'CPU / performance was acceptable for the way I work.',
    scale: AGREE_SCALE,
  },

  // ── bugs ──────────────────────────────────────────────────────────────────
  {
    id: 'bugs',
    section: 'bugs',
    type: 'multi',
    required: true,
    he: 'נתקלת בבאגים? (בחר/י כל מה שמתאים)',
    en: 'Did you hit any bugs? (select all that apply)',
    choices: [
      { code: 'crash', he: 'קריסה', en: 'Crash' },
      { code: 'audio_glitch', he: "גליץ' / נפילת אודיו", en: 'Audio glitch / dropout' },
      { code: 'graphics', he: 'באג גרפי', en: 'Graphical glitch' },
      { code: 'high_cpu', he: 'CPU גבוה במיוחד', en: 'Unusually high CPU' },
      { code: 'preset_issue', he: 'בעיה בפריסטים', en: 'Preset issue' },
      { code: 'param_issue', he: 'פרמטר שלא הגיב', en: "A parameter didn't respond" },
      { code: 'latency_pdc', he: 'בעיית latency / PDC', en: 'Latency / PDC issue' },
      { code: 'none', he: 'לא נתקלתי בבאגים', en: 'No bugs' },
    ],
    reveal: {
      whenIn: ['crash', 'audio_glitch', 'graphics', 'high_cpu', 'preset_issue', 'param_issue', 'latency_pdc'],
      field: {
        id: 'bug_detail',
        type: 'text',
        he: 'תאר/י את הבאג/ים, כולל ה-DAW ומערכת ההפעלה.',
        en: 'Describe the bug(s), including your DAW + OS.',
      },
    },
  },

  // ── value, pricing & advocacy ─────────────────────────────────────────────
  {
    id: 'worth_93',
    section: 'value',
    type: 'single',
    required: true,
    he: 'במחיר ההשקה $93, RevLimiter הוא…',
    en: 'At the $93 intro price, RevLimiter is…',
    choices: [
      { code: 'clear_yes', he: 'שווה בבירור', en: 'Clearly worth it' },
      { code: 'probably', he: 'כנראה שווה', en: 'Probably worth it' },
      { code: 'unsure', he: 'לא בטוח/ה', en: 'Unsure' },
      { code: 'too_expensive', he: 'יקר מדי', en: 'Too expensive' },
      { code: 'wouldnt_pay', he: 'לא הייתי משלם/ת', en: "I wouldn't pay" },
    ],
  },
  {
    id: 'trial_effect',
    section: 'value',
    type: 'single',
    required: true,
    he: 'תקופת ניסיון חינם של 30 יום (כל הפיצ׳רים) הייתה גורמת לי…',
    en: 'A free 30-day full-feature trial would make me…',
    choices: [
      { code: 'much_more', he: 'הרבה יותר נוטה לקנות', en: 'Much more likely to buy' },
      { code: 'somewhat', he: 'קצת יותר נוטה לקנות', en: 'Somewhat more likely' },
      { code: 'no_change', he: 'לא משנה לי', en: 'No change' },
      { code: 'prefer_buy', he: 'מעדיף/ה לקנות ישר', en: 'I prefer to buy outright' },
    ],
    reveal: {
      whenIn: ['much_more', 'somewhat'],
      field: {
        id: 'trial_test',
        type: 'text',
        he: 'מה היית רוצה לבדוק במהלך תקופת הניסיון?',
        en: 'What would you want to test during a trial?',
      },
    },
  },
  {
    id: 'nps',
    section: 'value',
    type: 'nps',
    required: true,
    he: 'מה הסיכוי שתמליץ/י על RevLimiter לקולגה?',
    en: 'How likely are you to recommend RevLimiter to a colleague?',
    scale: { lowHe: 'כלל לא סביר', lowEn: 'Not at all likely', highHe: 'סביר מאוד', highEn: 'Extremely likely' },
  },
  {
    id: 'testimonial',
    section: 'value',
    type: 'single',
    required: false,
    he: 'תהיה/י מוכן/ה לתת המלצה פומבית?',
    en: 'Would you give a public testimonial?',
    choices: [
      { code: 'yes_name', he: 'כן, עם השם שלי', en: 'Yes, with my name' },
      { code: 'yes_anon', he: 'כן, אנונימית', en: 'Yes, anonymously' },
      { code: 'no', he: 'לא', en: 'No' },
    ],
    reveal: {
      whenIn: ['yes_name', 'yes_anon'],
      field: {
        id: 'testimonial_name',
        type: 'shorttext',
        he: 'שם / כינוי לקרדיט (לא חובה)',
        en: 'Name / handle to credit (optional)',
      },
    },
  },
  {
    id: 'contact',
    section: 'value',
    type: 'shorttext',
    required: false,
    he: 'אימייל, אם נוח לך שניצור קשר להמשך',
    en: "Email, if you're happy to be contacted for follow-up",
    maxLen: 200,
  },

  // ── open feedback ─────────────────────────────────────────────────────────
  {
    id: 'fix_before_launch',
    section: 'open',
    type: 'text',
    required: false,
    he: 'הדבר האחד שלדעתך חייבים לתקן לפני ההשקה:',
    en: 'The ONE thing you think we must fix before launch:',
    maxLen: 2000,
  },
  {
    id: 'loved_most',
    section: 'open',
    type: 'text',
    required: false,
    he: 'מה הכי אהבת?',
    en: 'What did you love most?',
    maxLen: 2000,
  },
  {
    id: 'missing_feature',
    section: 'open',
    type: 'text',
    required: false,
    he: 'פיצ׳ר שהרגשת שחסר?',
    en: 'Any feature you felt was missing?',
    maxLen: 2000,
  },
];

/** Open-text columns the dashboard's AI synthesis treats as the feedback corpus. */
export const openTextFields = [
  'activation_detail',
  'onboarding_friction',
  'ui_change',
  'bug_detail',
  'trial_test',
  'fix_before_launch',
  'loved_most',
  'missing_feature',
] as const;
