import { CommunityDecision, InvitationToken, NoticeItem, PropertyResident, TenantBroadcastNotice, User } from '../types';

export const INITIAL_PROPERTIES: PropertyResident[] = [
  // --- 7 Residential Apartments ---
  {
    id: 'prop-1',
    propertyNumber: 1,
    type: 'residential',
    title: 'דירה 1',
    residents: 'עופר ודליה מי-טל',
    residentRole: 'owner',
    floor: 1,
    monthlyDue: 270,
    isPaidCurrentMonth: true,
    isSpecialProjectPaid: true,
    paymentMethod: 'העברה בנקאית',
    recurringDayText: 'ה-10 בחודש',
    currentBalance: 0,
    balanceNote: 'מוסדר במלואו',
    notes: 'בעלי נכס • העברה בנקאית חודשית ישירה (מעודכן ל-270 ₪)'
  },
  {
    id: 'prop-2',
    propertyNumber: 2,
    type: 'residential',
    title: 'דירה 2',
    residents: 'אבי קוזי',
    residentRole: 'admin',
    floor: 1,
    monthlyDue: 270,
    isPaidCurrentMonth: true,
    isSpecialProjectPaid: true,
    paymentMethod: 'העברה בנקאית (הוראת קבע)',
    recurringDayText: 'ה-5 בחודש',
    currentBalance: 0,
    balanceNote: 'מוסדר במלואו',
    notes: 'ועד הבית (ניהול הבניין) • העברה בנקאית בהוראת קבע'
  },
  {
    id: 'prop-3',
    propertyNumber: 3,
    type: 'residential',
    title: 'דירה 3',
    residents: 'אמיר ומירי חנוכה',
    residentRole: 'tenant',
    ownerName: 'יניב (בעל הדירה)',
    floor: 2,
    monthlyDue: 270,
    isPaidCurrentMonth: false,
    isSpecialProjectPaid: true,
    paymentMethod: 'מזומן / אפליקציה לאבי',
    recurringDayText: 'סביב ה-10 בחודש',
    currentBalance: -540,
    balanceNote: 'חוב עבור חודשים יולי ואוגוסט 2026 (-540 ₪)',
    notes: 'דיירים שוכרים • משלם במזומן או באפליקציה (ביט/פייבוקס) לאבי הוועד. יתרת חוב: 540 ₪ (יולי ואוגוסט 2026).'
  },
  {
    id: 'prop-4',
    propertyNumber: 4,
    type: 'residential',
    title: 'דירה 4',
    residents: 'פרי ודורית ארנפלד',
    residentRole: 'owner',
    floor: 2,
    monthlyDue: 270,
    isPaidCurrentMonth: true,
    isSpecialProjectPaid: true,
    paymentMethod: 'העברה בנקאית (דיגיטל)',
    recurringDayText: 'בין ה-3 ל-7 בחודש',
    currentBalance: 0,
    balanceNote: 'מוסדר במלואו',
    notes: 'בעלי נכס • העברה בנקאית דיגיטלית חודשית (מעודכן ל-270 ₪)'
  },
  {
    id: 'prop-5',
    propertyNumber: 5,
    type: 'residential',
    title: 'דירה 5',
    residents: 'אילנה',
    residentRole: 'owner',
    floor: 3,
    monthlyDue: 270,
    isPaidCurrentMonth: false,
    isSpecialProjectPaid: true,
    paymentMethod: 'העברה בנקאית (הוראת קבע על 250 ₪)',
    recurringDayText: 'ה-20 בחודש',
    currentBalance: -120,
    retroactiveShortfall: 120,
    balanceNote: 'חוב הפרשי רטרו ממרץ: -120 ₪ (20 ₪ × 6 חודשים)',
    notes: 'בעלת נכס • הוראת הקבע מוגדרת על 250 ₪ במקום 270 ₪. נדרשת השלמת רטרו של 120 ₪ (מרץ עד אוגוסט) ועדכון הוראת הקבע.'
  },
  {
    id: 'prop-6',
    propertyNumber: 6,
    type: 'residential',
    title: 'דירה 6',
    residents: 'גולן שרון ומשפחתו',
    residentRole: 'owner',
    floor: 3,
    monthlyDue: 270,
    isPaidCurrentMonth: true,
    isSpecialProjectPaid: true,
    paymentMethod: 'העברה בנקאית (הוראת קבע)',
    recurringDayText: 'ה-18 בחודש',
    currentBalance: 0,
    balanceNote: 'מוסדר במלואו',
    notes: 'בעלי נכס • העברה בנקאית בהוראת קבע חודשית (מעודכן ל-270 ₪)'
  },
  {
    id: 'prop-7',
    propertyNumber: 7,
    type: 'residential',
    title: 'דירה 7 (פנטהאוז)',
    residents: 'צחי ועיינה',
    residentRole: 'owner',
    floor: 4,
    monthlyDue: 405, // 375 base + 30 NIS for 1.5 unit
    isPaidCurrentMonth: true,
    isSpecialProjectPaid: true,
    paymentMethod: 'העברה בנקאית (אוצר החיל)',
    recurringDayText: 'ה-10 בחודש',
    currentBalance: 0,
    retroactiveShortfall: 0,
    balanceNote: 'הפרשי הרטרו שולמו במלואם ב-30/08/2026 (180 ₪)',
    notes: 'פנטהאוז + יחידת דיור פנימית (דירה וחצי). תעריף מעודכן: 405 ₪. הפרש הרטרו בסך 180 ₪ (מרץ-אוגוסט) שולם במלואו ב-30/08/2026 בהעברה מבנק אוצר החיל.'
  },

  // --- 2 Commercial Assets ---
  {
    id: 'prop-8',
    propertyNumber: 8,
    type: 'commercial',
    title: 'נכס 8 (קרקע)',
    businessName: 'סופר הכיכר',
    residents: 'הנהלת סופר הכיכר (מכולת הבניין)',
    residentRole: 'business',
    floor: 0,
    monthlyDue: 0,
    isPaidCurrentMonth: true,
    isSpecialProjectPaid: true,
    paymentMethod: 'צ\'ק שנתי (1,000 ₪)',
    recurringDayText: 'תשלום שנתי מראש (מאי)',
    currentBalance: 0,
    balanceNote: 'מוסדר לשנה שלמה מראש',
    notes: 'המכולת של הבניין • שולם 1,000 ₪ תשלום שנתי מראש בצ\'ק (נפרע בהצלחה בבנק) • שותפים מלאים בתחזוקה'
  },
  {
    id: 'prop-9',
    propertyNumber: 9,
    type: 'commercial',
    title: 'נכס 9 (קרקע)',
    businessName: 'מאפיית לחם בכפר',
    residents: 'הנהלת מאפיית לחם בכפר (המאפייה)',
    residentRole: 'business',
    floor: 0,
    monthlyDue: 0,
    isPaidCurrentMonth: true,
    isSpecialProjectPaid: true,
    paymentMethod: 'צ\'ק שנתי (1,000 ₪)',
    recurringDayText: 'תשלום שנתי מראש (פברואר)',
    currentBalance: 0,
    balanceNote: 'מוסדר לשנה שלמה מראש',
    notes: 'המאפייה של הבניין • שולם 1,000 ₪ תשלום שנתי מראש בצ\'ק (נפרע בהצלחה בבנק) • שותפים מלאים בתחזוקה'
  }
];

// Clean initial state: No fake users. Only users who actually register via invite will appear here!
export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    email: '',
    name: 'אבי קוזי (ועד הבית)',
    phone: '',
    role: 'admin',
    apartmentNumber: 2,
    status: 'active',
    createdAt: '2026-08-28'
  }
];

export const INITIAL_INVITATIONS: InvitationToken[] = [
  {
    id: 'inv-tzachi-test',
    token: 'test-tzachi-apt7',
    apartmentNumber: 7,
    createdAt: '2026-08-29',
    expiresAt: '2026-09-29',
    isUsed: false
  },
  {
    id: 'inv-ofer-test',
    token: 'test-ofer-apt1',
    apartmentNumber: 1,
    createdAt: '2026-08-29',
    expiresAt: '2026-09-29',
    isUsed: false
  },
  {
    id: 'inv-amir-test',
    token: 'test-amir-apt3',
    apartmentNumber: 3,
    createdAt: '2026-08-29',
    expiresAt: '2026-09-29',
    isUsed: false
  }
];

export const INITIAL_BROADCAST_NOTICES: TenantBroadcastNotice[] = [
  {
    id: 'bn-1',
    title: 'ברוכים הבאים לפורטל הדיירים האישי!',
    content: 'דיירים יקרים, השקנו את הפורטל האישי שמאפשר לכל דירה לעקוב אחר תשלומיה, יתרת החשבון המעודכנת והודעות הוועד בפרטיות ובשקיפות מלאה.',
    date: '28/08/2026',
    author: 'אבי קוזי (ועד הבית)',
    category: 'announcement'
  },
  {
    id: 'bn-2',
    title: 'הודעת ועד: השלמת הפרשי דמי ועד רטרואקטיבית ממרץ',
    content: 'תזכורת לדיירים שהתעריף עודכן ב-1 במרץ ב-20 ₪ לדירה (ל-270 ₪) וב-30 ₪ לפנטהאוז (ל-405 ₪ עקב דירה וחצי) לצורך כיסוי ביטוח המבנה המורחב. נשמח לעדכון ההעברות והסדרת ההפרשים הרטרואקטיביים.',
    date: '29/08/2026',
    author: 'אבי קוזי (ועד הבית)',
    category: 'maintenance'
  }
];

export const INITIAL_NOTICES: NoticeItem[] = [];

export const INITIAL_DECISIONS: CommunityDecision[] = [
  {
    id: 'dec-1',
    title: 'מעבר לביטוח מבנה מורחב ומלא (אופציה 3) ועדכון דמי ועד',
    date: '1 במרץ 2026',
    status: 'approved',
    summary: 'שדרוג פוליסת הביטוח של הבניין לכיסוי מקיף מלא (אש, סערה, רעידת אדמה, נזקי צנרת מורחבים, צד ג\' וחבות מעבידים). במקביל עודכנו דמי הוועד ב-20 ₪ לדירה (ל-270 ₪) וב-30 ₪ לפנטהאוז צחי ועיינה (ל-405 ₪ עקב דירה וחצי).',
    votesDetail: 'התקבל ברוב קולות (5 מתוך 9 בעלי נכסים הצביעו בעד).',
    badgeText: 'אושר ובוצע ✅',
    category: 'insurance'
  },
  {
    id: 'dec-2',
    title: 'שי לחג למנקה אור בסך 150 ₪',
    date: 'אפריל 2026',
    status: 'approved',
    summary: 'הענקת שי לחג לאור כאות תודה והערכה על מסירות יוצאת דופן ואחריות אישית, כולל דאגה למנקה מחליף בתקופת אשפוזו.',
    votesDetail: 'אושר פה אחד על ידי כל דיירי הבניין.',
    badgeText: 'הוענק בהוקרה 🎁',
    category: 'recognition'
  }
];
