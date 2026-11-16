// QRIB demo data. Facility names follow the design file; coordinates are
// approximate and doctors are fictional. Replace with live MOH / SCFHS
// directory APIs in production.

export const CITIES = [
  { id: 'riyadh',  en: 'Riyadh',  ar: 'الرياض',        area: { en: 'Al Olaya, Riyadh', ar: 'العليا، الرياض' }, lat: 24.6995, lng: 46.6850 },
  { id: 'jeddah',  en: 'Jeddah',  ar: 'جدة',            area: { en: 'Al Rawdah, Jeddah', ar: 'الروضة، جدة' }, lat: 21.5433, lng: 39.1728 },
  { id: 'makkah',  en: 'Makkah',  ar: 'مكة المكرمة',    area: { en: 'Central Makkah', ar: 'وسط مكة المكرمة' }, lat: 21.4225, lng: 39.8262 },
  { id: 'madinah', en: 'Madinah', ar: 'المدينة المنورة', area: { en: 'Central Madinah', ar: 'وسط المدينة المنورة' }, lat: 24.4672, lng: 39.6111 },
  { id: 'dammam',  en: 'Dammam',  ar: 'الدمام',         area: { en: 'Central Dammam', ar: 'وسط الدمام' }, lat: 26.4207, lng: 50.0888 },
  { id: 'alula',   en: 'AlUla',   ar: 'العُلا',          area: { en: 'AlUla Old Town', ar: 'البلدة القديمة، العُلا' }, lat: 26.6086, lng: 37.9232 },
];

export const INSURERS = {
  bupa:     { en: 'Bupa',     ar: 'بوبا' },
  tawuniya: { en: 'Tawuniya', ar: 'التعاونية' },
  medgulf:  { en: 'MedGulf',  ar: 'ميدغلف' },
  axa:      { en: 'GIG / AXA', ar: 'جي آي جي / أكسا' },
  malath:   { en: 'Malath',   ar: 'ملاذ' },
  visit:    { en: 'Visit-visa insurance', ar: 'تأمين تأشيرة الزيارة' },
  travel:   { en: 'International travel insurance', ar: 'تأمين السفر الدولي' },
};
export const RESIDENT_INSURERS = ['bupa', 'tawuniya', 'medgulf', 'axa', 'malath'];
export const TRAVELER_INSURERS = ['visit', 'travel'];

export const LANGS = {
  ar: { en: 'Arabic',  ar: 'العربية',     short: { en: 'AR', ar: 'عربي' } },
  en: { en: 'English', ar: 'الإنجليزية',  short: { en: 'EN', ar: 'إنجليزي' } },
  ur: { en: 'Urdu',    ar: 'الأردية',      short: { en: 'UR', ar: 'أردو' } },
  tl: { en: 'Tagalog', ar: 'التاغالوغية', short: { en: 'TL', ar: 'تاغالوغ' } },
  hi: { en: 'Hindi',   ar: 'الهندية',      short: { en: 'HI', ar: 'هندي' } },
  fr: { en: 'French',  ar: 'الفرنسية',     short: { en: 'FR', ar: 'فرنسي' } },
  id: { en: 'Indonesian', ar: 'الإندونيسية', short: { en: 'ID', ar: 'إندونيسي' } },
};

// icon keys refer to js/icons.js
export const SPECIALTIES = {
  cardio:   { en: 'Cardiology',        ar: 'أمراض القلب',     role: 'Cardiologist',     icon: 'heartPulse', kw: 'heart cardiac قلب' },
  gp:       { en: 'General practice',  ar: 'طب الأسرة',       role: 'Family Physician', icon: 'stethoscope', kw: 'gp family general doctor عام اسرة' },
  paeds:    { en: 'Paediatrics',       ar: 'طب الأطفال',      role: 'Paediatrician',    icon: 'baby',       kw: 'pediatrics children child kids أطفال' },
  dental:   { en: 'Dentistry',         ar: 'طب الأسنان',      role: 'Dentist',          icon: 'tooth',      kw: 'dentist teeth tooth أسنان' },
  derm:     { en: 'Dermatology',       ar: 'الأمراض الجلدية', role: 'Dermatologist',    icon: 'sparkle',    kw: 'skin derma جلدية' },
  emerg:    { en: 'Emergency',         ar: 'الطوارئ',         role: 'Emergency Physician', icon: 'siren',   kw: 'er urgent emergency طوارئ' },
  ortho:    { en: 'Orthopaedics',      ar: 'العظام',          role: 'Orthopaedic Surgeon', icon: 'bone',    kw: 'bone orthopedics عظام' },
  obgyn:    { en: 'Women’s health',    ar: 'النساء والولادة', role: 'Obstetrician-Gynaecologist', icon: 'female', kw: 'obgyn gynecology pregnancy نساء ولادة' },
  eye:      { en: 'Ophthalmology',     ar: 'طب العيون',       role: 'Ophthalmologist',  icon: 'eye',        kw: 'eye vision عيون' },
  ent:      { en: 'ENT',               ar: 'الأنف والأذن والحنجرة', role: 'ENT Specialist', icon: 'ear',     kw: 'ear nose throat أنف أذن' },
  internal: { en: 'Internal medicine', ar: 'الباطنية',        role: 'Internist',        icon: 'clipboard',  kw: 'internal medicine باطنية' },
};

// hours: null = 24h, else [open, close] 'HH:MM'
export const FACILITIES = [
  // ---- Riyadh
  { id: 'kfmc', city: 'riyadh', en: 'King Fahad Medical City', ar: 'مدينة الملك فهد الطبية', short: 'KF',
    type: { en: 'Multi-specialty hospital', ar: 'مستشفى متعدد التخصصات' }, kind: 'gov', er: true, hours: null,
    lat: 24.6890, lng: 46.7058, area: { en: 'Al Olaya, Riyadh', ar: 'العليا، الرياض' }, phone: '+966112889999',
    ins: ['bupa', 'tawuniya', 'medgulf', 'visit', 'travel'], tone: '' },
  { id: 'habib', city: 'riyadh', en: 'Dr. Sulaiman Al Habib', ar: 'د. سليمان الحبيب', short: 'DS',
    type: { en: 'Private hospital', ar: 'مستشفى خاص' }, kind: 'private', er: false, hours: ['07:00', '23:00'],
    lat: 24.6962, lng: 46.6806, area: { en: 'Al Olaya, Riyadh', ar: 'العليا، الرياض' }, phone: '+966920022622',
    ins: ['bupa', 'tawuniya', 'medgulf', 'axa', 'travel'], tone: 'info' },
  { id: 'mouwasat', city: 'riyadh', en: 'Al Mouwasat Hospital', ar: 'مستشفى المواساة', short: 'AM',
    type: { en: 'Private hospital', ar: 'مستشفى خاص' }, kind: 'private', er: true, hours: null,
    lat: 24.7238, lng: 46.6702, area: { en: 'Al Mursalat, Riyadh', ar: 'المرسلات، الرياض' }, phone: '+966920002224',
    ins: ['bupa', 'tawuniya', 'malath', 'visit'], tone: 'gold' },
  { id: 'kfsh', city: 'riyadh', en: 'King Faisal Specialist Hospital', ar: 'مستشفى الملك فيصل التخصصي', short: 'KS',
    type: { en: 'Specialist hospital', ar: 'مستشفى تخصصي' }, kind: 'gov', er: true, hours: null,
    lat: 24.6712, lng: 46.6768, area: { en: 'Al Maather, Riyadh', ar: 'المعذر، الرياض' }, phone: '+966114647272',
    ins: ['bupa', 'tawuniya', 'medgulf', 'axa', 'visit', 'travel'], tone: '' },
  { id: 'dallah', city: 'riyadh', en: 'Dallah Hospital', ar: 'مستشفى دله', short: 'DH',
    type: { en: 'Private hospital', ar: 'مستشفى خاص' }, kind: 'private', er: true, hours: null,
    lat: 24.7578, lng: 46.6546, area: { en: 'Al Nakheel, Riyadh', ar: 'النخيل، الرياض' }, phone: '+966920012222',
    ins: ['bupa', 'medgulf', 'malath', 'axa', 'visit', 'travel'], tone: 'info' },
  { id: 'smile', city: 'riyadh', en: 'Olaya Smile Dental Centre', ar: 'مركز ابتسامة العليا لطب الأسنان', short: 'OS',
    type: { en: 'Dental clinic', ar: 'عيادة أسنان' }, kind: 'clinic', er: false, hours: ['09:00', '22:00'],
    lat: 24.7031, lng: 46.6889, area: { en: 'Al Olaya, Riyadh', ar: 'العليا، الرياض' }, phone: '+966110000101',
    ins: ['bupa', 'tawuniya', 'travel'], tone: 'gold' },
  { id: 'tiny', city: 'riyadh', en: 'Little Steps Children’s Clinic', ar: 'عيادة الخطوات الصغيرة للأطفال', short: 'LS',
    type: { en: 'Paediatric clinic', ar: 'عيادة أطفال' }, kind: 'clinic', er: false, hours: ['08:00', '22:00'],
    lat: 24.7105, lng: 46.6772, area: { en: 'Al Wurud, Riyadh', ar: 'الورود، الرياض' }, phone: '+966110000102',
    ins: ['bupa', 'tawuniya', 'medgulf', 'visit'], tone: '' },
  { id: 'derma', city: 'riyadh', en: 'Riyadh Skin & Laser Clinic', ar: 'عيادة الرياض للجلدية والليزر', short: 'RS',
    type: { en: 'Dermatology clinic', ar: 'عيادة جلدية' }, kind: 'clinic', er: false, hours: ['10:00', '22:00'],
    lat: 24.7166, lng: 46.6928, area: { en: 'Al Murooj, Riyadh', ar: 'المروج، الرياض' }, phone: '+966110000103',
    ins: ['bupa', 'axa', 'travel'], tone: 'info' },
  { id: 'vision', city: 'riyadh', en: 'Al Noor Eye Centre', ar: 'مركز النور للعيون', short: 'AN',
    type: { en: 'Eye clinic', ar: 'مركز عيون' }, kind: 'clinic', er: false, hours: ['09:00', '21:00'],
    lat: 24.6921, lng: 46.6957, area: { en: 'Al Wizarat, Riyadh', ar: 'الوزارات، الرياض' }, phone: '+966110000104',
    ins: ['tawuniya', 'medgulf', 'malath'], tone: 'gold' },
  // ---- Jeddah
  { id: 'fakeeh', city: 'jeddah', en: 'Dr. Soliman Fakeeh Hospital', ar: 'مستشفى الدكتور سليمان فقيه', short: 'SF',
    type: { en: 'Private hospital', ar: 'مستشفى خاص' }, kind: 'private', er: true, hours: null,
    lat: 21.5112, lng: 39.1791, area: { en: 'Al Hamra, Jeddah', ar: 'الحمراء، جدة' }, phone: '+966126655000',
    ins: ['bupa', 'tawuniya', 'medgulf', 'visit', 'travel'], tone: 'info' },
  { id: 'imc', city: 'jeddah', en: 'International Medical Center', ar: 'المركز الطبي الدولي', short: 'IM',
    type: { en: 'Private hospital', ar: 'مستشفى خاص' }, kind: 'private', er: true, hours: null,
    lat: 21.5618, lng: 39.1533, area: { en: 'Al Rawdah, Jeddah', ar: 'الروضة، جدة' }, phone: '+966126509000',
    ins: ['bupa', 'axa', 'visit', 'travel'], tone: 'gold' },
  { id: 'kfshj', city: 'jeddah', en: 'King Faisal Specialist Hospital – Jeddah', ar: 'مستشفى الملك فيصل التخصصي – جدة', short: 'KJ',
    type: { en: 'Specialist hospital', ar: 'مستشفى تخصصي' }, kind: 'gov', er: true, hours: null,
    lat: 21.5561, lng: 39.1722, area: { en: 'Al Rawdah, Jeddah', ar: 'الروضة، جدة' }, phone: '+966126677777',
    ins: ['bupa', 'tawuniya', 'medgulf', 'visit'], tone: '' },
  // ---- Makkah
  { id: 'ajyad', city: 'makkah', en: 'Ajyad Emergency Hospital', ar: 'مستشفى أجياد للطوارئ', short: 'AE',
    type: { en: 'Emergency hospital', ar: 'مستشفى طوارئ' }, kind: 'gov', er: true, hours: null,
    lat: 21.4199, lng: 39.8268, area: { en: 'By Masjid al-Haram', ar: 'بجوار المسجد الحرام' }, phone: '+966125730070',
    ins: ['visit', 'travel', 'bupa', 'tawuniya'], tone: '' },
  { id: 'kamc', city: 'makkah', en: 'King Abdullah Medical City', ar: 'مدينة الملك عبدالله الطبية', short: 'KA',
    type: { en: 'Multi-specialty hospital', ar: 'مستشفى متعدد التخصصات' }, kind: 'gov', er: true, hours: null,
    lat: 21.3833, lng: 39.8690, area: { en: 'Al Awali, Makkah', ar: 'العوالي، مكة المكرمة' }, phone: '+966125549999',
    ins: ['visit', 'travel', 'bupa', 'tawuniya', 'medgulf'], tone: 'info' },
  // ---- Madinah
  { id: 'kfhm', city: 'madinah', en: 'King Fahad Hospital – Madinah', ar: 'مستشفى الملك فهد – المدينة المنورة', short: 'KM',
    type: { en: 'General hospital', ar: 'مستشفى عام' }, kind: 'gov', er: true, hours: null,
    lat: 24.4846, lng: 39.5949, area: { en: 'Al Jamiah, Madinah', ar: 'الجامعة، المدينة المنورة' }, phone: '+966148461111',
    ins: ['visit', 'travel', 'bupa', 'tawuniya'], tone: '' },
  { id: 'ansar', city: 'madinah', en: 'Al Ansar General Hospital', ar: 'مستشفى الأنصار العام', short: 'AA',
    type: { en: 'General hospital', ar: 'مستشفى عام' }, kind: 'gov', er: true, hours: null,
    lat: 24.4705, lng: 39.6118, area: { en: 'Central Madinah', ar: 'المنطقة المركزية' }, phone: '+966148272222',
    ins: ['visit', 'travel'], tone: 'gold' },
  // ---- Dammam
  { id: 'kfsd', city: 'dammam', en: 'King Fahad Specialist Hospital – Dammam', ar: 'مستشفى الملك فهد التخصصي – الدمام', short: 'KD',
    type: { en: 'Specialist hospital', ar: 'مستشفى تخصصي' }, kind: 'gov', er: true, hours: null,
    lat: 26.4291, lng: 50.0979, area: { en: 'Central Dammam', ar: 'وسط الدمام' }, phone: '+966138442222',
    ins: ['bupa', 'tawuniya', 'medgulf', 'visit', 'travel'], tone: '' },
  // ---- AlUla
  { id: 'alula', city: 'alula', en: 'Prince Abdulmohsen Hospital', ar: 'مستشفى الأمير عبدالمحسن', short: 'PA',
    type: { en: 'General hospital', ar: 'مستشفى عام' }, kind: 'gov', er: true, hours: null,
    lat: 26.6251, lng: 37.9199, area: { en: 'AlUla', ar: 'العُلا' }, phone: '+966148840000',
    ins: ['visit', 'travel', 'tawuniya'], tone: 'info' },
];

const UNI = [
  { en: 'MBBS, King Saud University', ar: 'بكالوريوس طب وجراحة، جامعة الملك سعود' },
  { en: 'MBBS, King Abdulaziz University', ar: 'بكالوريوس طب وجراحة، جامعة الملك عبدالعزيز' },
  { en: 'MD, Alfaisal University', ar: 'دكتوراه في الطب، جامعة الفيصل' },
  { en: 'MBBS, Imam Abdulrahman Bin Faisal University', ar: 'بكالوريوس طب وجراحة، جامعة الإمام عبدالرحمن بن فيصل' },
];
const FELLOW = [
  { en: 'Fellowship, Canada', ar: 'زمالة، كندا' },
  { en: 'Fellowship, United Kingdom', ar: 'زمالة، المملكة المتحدة' },
  { en: 'Fellowship, Germany', ar: 'زمالة، ألمانيا' },
  { en: 'Saudi Board certified', ar: 'حاصل على البورد السعودي' },
];

// [id, nameEn, nameAr, gender, spec, years, facility, langs, rating, reviews, fee[min,max], video]
const RAW = [
  ['hana', 'Dr. Hana Al Qahtani', 'د. هناء القحطاني', 'f', 'cardio', 14, 'kfmc', ['ar', 'en'], 4.8, 212, [400, 550], false],
  ['majid', 'Dr. Majid Al Rashed', 'د. ماجد الراشد', 'm', 'cardio', 9, 'habib', ['ar', 'en', 'ur'], 4.6, 158, [450, 600], false],
  ['sara', 'Dr. Sara Nasser', 'د. سارة ناصر', 'f', 'cardio', 7, 'mouwasat', ['ar', 'en'], 4.9, 96, [350, 450], true],
  ['ahmed', 'Dr. Ahmed Kamal', 'د. أحمد كمال', 'm', 'cardio', 11, 'kfsh', ['ar', 'en'], 4.4, 77, [300, 400], false],
  ['yousef', 'Dr. Yousef Barakat', 'د. يوسف بركات', 'm', 'derm', 12, 'derma', ['ar', 'en', 'fr'], 4.7, 189, [300, 450], true],
  ['noura', 'Dr. Noura Al Harbi', 'د. نورة الحربي', 'f', 'derm', 6, 'habib', ['ar', 'en'], 4.5, 64, [350, 500], true],
  ['layla', 'Dr. Layla Farouk', 'د. ليلى فاروق', 'f', 'paeds', 15, 'tiny', ['ar', 'en'], 4.9, 301, [250, 350], false],
  ['omar', 'Dr. Omar Siddiqui', 'د. عمر صديقي', 'm', 'paeds', 8, 'dallah', ['en', 'ur', 'hi', 'ar'], 4.6, 120, [300, 400], true],
  ['reem', 'Dr. Reem Al Shehri', 'د. ريم الشهري', 'f', 'dental', 10, 'smile', ['ar', 'en'], 4.8, 175, [200, 600], false],
  ['jose', 'Dr. Jose Santos', 'د. خوسيه سانتوس', 'm', 'dental', 9, 'smile', ['en', 'tl'], 4.6, 88, [200, 550], false],
  ['faisal', 'Dr. Faisal Al Otaibi', 'د. فيصل العتيبي', 'm', 'gp', 5, 'habib', ['ar', 'en'], 4.3, 54, [150, 250], true],
  ['maria', 'Dr. Maria Reyes', 'د. ماريا رييس', 'f', 'gp', 13, 'dallah', ['en', 'tl', 'ar'], 4.7, 143, [180, 280], true],
  ['khalid', 'Dr. Khalid Al Dosari', 'د. خالد الدوسري', 'm', 'ortho', 16, 'kfsh', ['ar', 'en'], 4.8, 230, [450, 650], false],
  ['amal', 'Dr. Amal Al Zahrani', 'د. أمل الزهراني', 'f', 'obgyn', 18, 'mouwasat', ['ar', 'en'], 4.9, 342, [400, 550], false],
  ['tariq', 'Dr. Tariq Hussain', 'د. طارق حسين', 'm', 'ent', 10, 'kfmc', ['ar', 'en', 'ur'], 4.5, 101, [300, 420], false],
  ['lina', 'Dr. Lina Haddad', 'د. لينا حداد', 'f', 'eye', 8, 'vision', ['ar', 'en', 'fr'], 4.7, 97, [300, 450], false],
  ['saad', 'Dr. Saad Al Mutairi', 'د. سعد المطيري', 'm', 'emerg', 12, 'kfmc', ['ar', 'en'], 4.6, 66, [0, 0], false],
  ['rania', 'Dr. Rania Bakr', 'د. رانيا بكر', 'f', 'gp', 9, 'fakeeh', ['ar', 'en'], 4.7, 133, [200, 300], true],
  ['hassan', 'Dr. Hassan Al Ghamdi', 'د. حسن الغامدي', 'm', 'cardio', 15, 'kfshj', ['ar', 'en'], 4.8, 201, [450, 600], false],
  ['priya', 'Dr. Priya Nair', 'د. بريا ناير', 'f', 'paeds', 7, 'imc', ['en', 'hi', 'ar'], 4.6, 79, [300, 400], true],
  ['ali', 'Dr. Ali Al Harthi', 'د. علي الحارثي', 'm', 'emerg', 11, 'imc', ['ar', 'en'], 4.5, 58, [0, 0], false],
  ['ibrahim', 'Dr. Ibrahim Al Lihyani', 'د. إبراهيم اللحياني', 'm', 'emerg', 14, 'ajyad', ['ar', 'en', 'ur'], 4.7, 112, [0, 0], false],
  ['fatima', 'Dr. Fatima Malik', 'د. فاطمة مالك', 'f', 'internal', 10, 'kamc', ['ar', 'en', 'ur', 'id'], 4.8, 156, [250, 350], true],
  ['yusuf', 'Dr. Yusuf Rahman', 'د. يوسف رحمن', 'm', 'gp', 6, 'ajyad', ['en', 'ar', 'id'], 4.6, 92, [150, 250], true],
  ['abdulrahman', 'Dr. Abdulrahman Al Juhani', 'د. عبدالرحمن الجهني', 'm', 'internal', 13, 'kfhm', ['ar', 'en'], 4.6, 118, [250, 350], false],
  ['aisha', 'Dr. Aisha Kurniawan', 'د. عائشة كورنياوان', 'f', 'gp', 8, 'ansar', ['en', 'id', 'ar'], 4.7, 84, [150, 250], true],
  ['mohammed', 'Dr. Mohammed Al Qahtani', 'د. محمد القحطاني', 'm', 'ortho', 12, 'kfsd', ['ar', 'en'], 4.6, 140, [400, 550], false],
  ['huda', 'Dr. Huda Al Dossary', 'د. هدى الدوسري', 'f', 'derm', 9, 'kfsd', ['ar', 'en'], 4.7, 99, [300, 450], true],
  ['sami', 'Dr. Sami Al Balawi', 'د. سامي البلوي', 'm', 'gp', 10, 'alula', ['ar', 'en'], 4.5, 47, [150, 250], true],
  ['claire', 'Dr. Claire Dubois', 'د. كلير دوبوا', 'f', 'emerg', 8, 'alula', ['en', 'fr', 'ar'], 4.8, 61, [0, 0], false],
];

const TONES = ['', 'info', 'gold'];
function initials(name) {
  const parts = name.replace(/^Dr\.\s*/, '').replace(/\bAl\b\s*/g, '').split(/\s+/).filter(Boolean);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

export const DOCTORS = RAW.map((r, i) => {
  const [id, en, ar, g, spec, years, facility, langs, rating, reviews, fee, video] = r;
  const sp = SPECIALTIES[spec];
  const senior = years >= 12;
  const roleEn = (senior ? 'Consultant ' : '') + sp.role;
  const roleAr = (senior ? (g === 'f' ? 'استشارية ' : 'استشاري ') : (g === 'f' ? 'أخصائية ' : 'أخصائي ')) + sp.ar;
  const u = UNI[i % UNI.length], f = FELLOW[(i * 3) % FELLOW.length];
  const lic = `${20 + (i % 6)}-${String(100000 + ((i * 7919) % 899999)).slice(0, 6)}`;
  const credentials = id === 'hana'
    ? { en: 'MBBS, King Saud University. Saudi Board of Internal Medicine. Fellowship in Adult Cardiology, Canada. SCFHS licence 24-118902, verified March 2026.',
        ar: 'بكالوريوس طب وجراحة، جامعة الملك سعود. البورد السعودي للطب الباطني. زمالة أمراض القلب للبالغين، كندا. ترخيص الهيئة ٢٤-١١٨٩٠٢، تم التحقق في مارس ٢٠٢٦.' }
    : { en: `${u.en}. ${f.en} in ${sp.en}. SCFHS licence ${lic}, verified 2026.`,
        ar: `${u.ar}. ${f.ar} في ${sp.ar}. ترخيص الهيئة ${lic}، تم التحقق ٢٠٢٦.` };
  return {
    id, name: { en, ar }, initials: initials(en), gender: g, spec, years, facility, langs,
    rating, reviews, fee, video, role: { en: roleEn, ar: roleAr }, credentials,
    tone: TONES[i % 3], verified: id !== 'ahmed',
  };
});

export const doctorById = id => DOCTORS.find(d => d.id === id);
export const facilityById = id => FACILITIES.find(f => f.id === id);
export const cityById = id => CITIES.find(c => c.id === id) || CITIES[0];

// ---- Seed reports. Dates are offsets in days from "now" so the demo
// always looks recent.
export function seedReports(mode) {
  if (mode === 'traveler') {
    return [
      { id: 'tv1', type: 'vac', daysAgo: 21, doctor: null, facility: null,
        title: { en: 'Meningococcal ACWY vaccination', ar: 'تطعيم الحمى الشوكية (ACWY)' },
        source: { en: 'Imported certificate', ar: 'شهادة مستوردة' },
        tags: ['vaccines'],
        body: { kind: 'vac', items: [
          { name: { en: 'Meningococcal ACWY (Nimenrix)', ar: 'الحمى الشوكية الرباعي (نيمنركس)' }, note: { en: 'Required for Umrah and Hajj', ar: 'مطلوب للعمرة والحج' } },
          { name: { en: 'Seasonal influenza', ar: 'الإنفلونزا الموسمية' }, note: { en: 'Recommended', ar: 'موصى به' } },
        ] } },
    ];
  }
  return [
    { id: 'r1', type: 'visit', daysAgo: 12, doctor: 'hana', facility: 'kfmc',
      title: { en: 'Cardiology consultation', ar: 'استشارة قلب' }, tags: ['visitSummary', 'prescription'],
      body: { kind: 'visit',
        summary: { en: 'Follow-up for intermittent palpitations. ECG normal sinus rhythm. Blood pressure 128/82. Advised to reduce caffeine and repeat lipid panel in 3 months.',
                   ar: 'متابعة لخفقان متقطع. تخطيط القلب نظم جيبي طبيعي. ضغط الدم ١٢٨/٨٢. يُنصح بتقليل الكافيين وإعادة تحليل الدهون بعد ٣ أشهر.' },
        diagnosis: { en: 'Benign palpitations; borderline LDL', ar: 'خفقان حميد؛ ارتفاع طفيف في الكوليسترول الضار' },
        meds: [{ en: 'Bisoprolol 2.5 mg — once daily, 30 days', ar: 'بيسوبرولول ٢٫٥ ملغ — مرة يوميًا، ٣٠ يومًا' }] } },
    { id: 'r2', type: 'lab', daysAgo: 12, doctor: 'hana', facility: 'kfmc',
      title: { en: 'Lipid panel', ar: 'تحليل الدهون' }, tags: ['resultsReady'],
      body: { kind: 'lab', rows: [
        { n: { en: 'Total cholesterol', ar: 'الكوليسترول الكلي' }, v: '5.4', u: 'mmol/L', r: '< 5.2', f: 'h' },
        { n: { en: 'LDL', ar: 'الكوليسترول الضار' }, v: '3.5', u: 'mmol/L', r: '< 3.4', f: 'h' },
        { n: { en: 'HDL', ar: 'الكوليسترول النافع' }, v: '1.3', u: 'mmol/L', r: '> 1.0', f: 'n' },
        { n: { en: 'Triglycerides', ar: 'الدهون الثلاثية' }, v: '1.5', u: 'mmol/L', r: '< 1.7', f: 'n' },
      ] } },
    { id: 'r3', type: 'visit', daysAgo: 55, doctor: 'yousef', facility: 'derma',
      title: { en: 'Dermatology consultation', ar: 'استشارة جلدية' }, tags: ['visitSummary'],
      body: { kind: 'visit',
        summary: { en: 'Mild eczema on both forearms. Moisturiser twice daily and a short course of topical steroid.',
                   ar: 'إكزيما خفيفة على الساعدين. مرطب مرتين يوميًا ودورة قصيرة من كريم الكورتيزون الموضعي.' },
        diagnosis: { en: 'Atopic dermatitis (mild)', ar: 'التهاب الجلد التأتبي (خفيف)' },
        meds: [{ en: 'Hydrocortisone 1% cream — twice daily, 7 days', ar: 'كريم هيدروكورتيزون ١٪ — مرتين يوميًا، ٧ أيام' }] } },
    { id: 'r4', type: 'img', daysAgo: 118, doctor: 'khalid', facility: 'kfsh',
      title: { en: 'Knee X-ray (right)', ar: 'أشعة سينية للركبة (اليمنى)' }, tags: ['resultsReady'],
      body: { kind: 'img',
        findings: { en: 'No fracture or dislocation. Joint spaces preserved. Small effusion.', ar: 'لا يوجد كسر أو خلع. المسافات المفصلية سليمة. انصباب بسيط.' },
        impression: { en: 'Soft-tissue strain. Physiotherapy recommended.', ar: 'إجهاد في الأنسجة الرخوة. يُوصى بالعلاج الطبيعي.' } } },
    { id: 'r5', type: 'lab', daysAgo: 118, doctor: 'khalid', facility: 'kfsh',
      title: { en: 'Complete blood count', ar: 'صورة الدم الكاملة' }, tags: ['resultsReady'],
      body: { kind: 'lab', rows: [
        { n: { en: 'Haemoglobin', ar: 'الهيموغلوبين' }, v: '14.2', u: 'g/dL', r: '13.5–17.5', f: 'n' },
        { n: { en: 'White cells', ar: 'كريات الدم البيضاء' }, v: '6.8', u: '×10⁹/L', r: '4.0–11.0', f: 'n' },
        { n: { en: 'Platelets', ar: 'الصفائح الدموية' }, v: '250', u: '×10⁹/L', r: '150–400', f: 'n' },
      ] } },
    { id: 'r6', type: 'visit', daysAgo: 205, doctor: 'layla', facility: 'tiny',
      title: { en: 'Paediatric check-up', ar: 'فحص أطفال دوري' }, tags: ['visitSummary'],
      body: { kind: 'visit',
        summary: { en: 'Routine 4-year check. Growth on the 60th centile. Vaccinations up to date.', ar: 'فحص روتيني لعمر ٤ سنوات. النمو عند المئين ٦٠. التطعيمات مكتملة.' },
        diagnosis: { en: 'Healthy child', ar: 'طفل سليم' }, meds: [] } },
  ];
}

export function seedConsulted(mode) {
  if (mode === 'traveler') return [];
  return [
    { doctor: 'hana', daysAgo: 12 },
    { doctor: 'yousef', daysAgo: 55 },
    { doctor: 'layla', daysAgo: 205 },
  ];
}

export const COUNTRY_CODES = [
  ['+966', 'SA'], ['+971', 'AE'], ['+965', 'KW'], ['+974', 'QA'], ['+973', 'BH'], ['+968', 'OM'],
  ['+20', 'EG'], ['+962', 'JO'], ['+92', 'PK'], ['+91', 'IN'], ['+62', 'ID'], ['+60', 'MY'],
  ['+63', 'PH'], ['+880', 'BD'], ['+90', 'TR'], ['+44', 'GB'], ['+1', 'US'], ['+33', 'FR'],
  ['+49', 'DE'], ['+234', 'NG'],
];

export const SLOT_TIMES = {
  morning: ['09:00', '09:40', '10:20', '11:00', '11:40', '12:20'],
  afternoon: ['13:50', '14:30', '15:10', '16:30', '17:10', '17:50'],
};
