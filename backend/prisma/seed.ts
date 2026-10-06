import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Ids must match frontend/src/data/tunisia-governorates.json (map colouring) and
// frontend/src/constants/municipalities.ts (Sidi Bouzid = 18, delegations 40–47).
const GOVERNORATES: [number, string, string][] = [
  [1, 'تونس', 'TN-11'], [2, 'أريانة', 'TN-12'], [3, 'بن عروس', 'TN-13'], [4, 'منوبة', 'TN-14'],
  [5, 'نابل', 'TN-21'], [6, 'زغوان', 'TN-22'], [7, 'بنزرت', 'TN-23'], [8, 'باجة', 'TN-31'],
  [9, 'جندوبة', 'TN-32'], [10, 'الكاف', 'TN-33'], [11, 'سليانة', 'TN-34'], [12, 'المنستير', 'TN-52'],
  [13, 'سوسة', 'TN-51'], [14, 'المهدية', 'TN-53'], [15, 'صفاقس', 'TN-61'], [16, 'القيروان', 'TN-41'],
  [17, 'القصرين', 'TN-42'], [18, 'سيدي بوزيد', 'TN-43'], [19, 'قابس', 'TN-81'], [20, 'مدنين', 'TN-82'],
  [21, 'تطاوين', 'TN-83'], [22, 'قفصة', 'TN-71'], [23, 'توزر', 'TN-72'], [24, 'قبلي', 'TN-73'],
];

const SIDI_BOUZID_CITIES: [number, string][] = [
  [40, 'سيدي بوزيد'], [41, 'الرقاب'], [42, 'اولاد حفوز'], [43, 'السعيدة'],
  [44, 'المزونة'], [45, 'المكناسي'], [46, 'منزل بوزيان'], [47, 'سوق الجديد'],
];

const CAUSES: [string, string][] = [
  ['SPEED', 'السرعة المفرطة'],
  ['PRIORITY', 'عدم احترام الأولوية'],
  ['INATTENTION', 'عدم الانتباه والسهو'],
  ['PHONE', 'استعمال الهاتف أثناء السياقة'],
  ['OVERTAKING', 'التجاوز الممنوع'],
  ['DISTANCE', 'عدم ترك مسافة الأمان'],
  ['SIGNALS', 'عدم احترام الإشارات الضوئية'],
  ['STOP', 'عدم احترام علامة قف'],
  ['WRONG_WAY', 'السياقة في الاتجاه الممنوع'],
  ['ALCOHOL', 'السياقة تحت تأثير الكحول'],
  ['FATIGUE', 'النعاس والإرهاق'],
  ['TIRE', 'انفجار عجلة'],
  ['MECHANICAL', 'عطب فني بالمركبة'],
  ['PEDESTRIAN', 'عبور مفاجئ للمترجلين'],
  ['ANIMALS', 'الحيوانات السائبة'],
  ['ROAD', 'سوء حالة الطريق'],
  ['VISIBILITY', 'انعدام الرؤية'],
];

const BRANDS: [string, string][] = [
  ['رونو', 'Renault'], ['بيجو', 'Peugeot'], ['سيتروان', 'Citroën'], ['فولكسفاغن', 'Volkswagen'],
  ['تويوتا', 'Toyota'], ['هيونداي', 'Hyundai'], ['كيا', 'Kia'], ['فيات', 'Fiat'],
  ['مرسيدس', 'Mercedes-Benz'], ['بي إم دبليو', 'BMW'], ['إيسوزو', 'Isuzu'], ['نيسان', 'Nissan'],
  ['ميتسوبيشي', 'Mitsubishi'], ['شيري', 'Chery'], ['سوزوكي', 'Suzuki'], ['فورد', 'Ford'],
  ['أوبل', 'Opel'], ['داسيا', 'Dacia'], ['ماهيندرا', 'Mahindra'], ['إيفيكو', 'Iveco'],
];

// Everything below only adds what is missing: existing rows (including ones an
// admin renamed) are never overwritten, so this is safe to run on every deploy.
async function seedLocations() {
  for (const [id, nameAr, code] of GOVERNORATES) {
    await prisma.governorate.upsert({ where: { id }, create: { id, nameAr, code }, update: {} });
  }
  for (const [id, nameAr] of SIDI_BOUZID_CITIES) {
    await prisma.city.upsert({ where: { id }, create: { id, nameAr, governorateId: 18 }, update: {} });
  }
  // Rows were inserted with explicit ids, so move the sequences past them.
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('governorates', 'id'), (SELECT MAX(id) FROM governorates))`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('cities', 'id'), (SELECT MAX(id) FROM cities))`);
}

// Causes and brands are managed by users afterwards, so they are only filled when empty.
async function seedCauses() {
  if ((await prisma.accidentCause.count()) > 0) return;
  await prisma.accidentCause.createMany({ data: CAUSES.map(([code, nameAr]) => ({ code, nameAr })) });
  console.log(`Created ${CAUSES.length} accident causes.`);
}

async function seedBrands() {
  if ((await prisma.vehicleBrand.count()) > 0) return;
  await prisma.vehicleBrand.createMany({ data: BRANDS.map(([nameAr, nameEn]) => ({ nameAr, nameEn })) });
  console.log(`Created ${BRANDS.length} vehicle brands.`);
}

async function seedAdmin() {
  const existing = await prisma.user.findUnique({ where: { username: 'mohamed' } });
  if (existing) return;

  const passwordHash = await bcrypt.hash('mohamed123', 10);
  const admin = await prisma.user.create({
    data: {
      username: 'mohamed',
      passwordHash,
      fullName: 'mohamed',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Admin user created:', admin.username);
}

async function main() {
  await seedLocations();
  await seedCauses();
  await seedBrands();
  await seedAdmin();
  console.log('Seed finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
