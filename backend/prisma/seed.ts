import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Admin User ---
  const adminHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminHash,
      fullName: 'المدير العام',
      role: UserRole.ADMIN,
    },
  });

  const officerHash = await bcrypt.hash('officer123', 10);
  await prisma.user.upsert({
    where: { username: 'officer' },
    update: {},
    create: {
      username: 'officer',
      passwordHash: officerHash,
      fullName: 'ضابط إدخال البيانات',
      role: UserRole.OFFICER,
    },
  });

  const viewerHash = await bcrypt.hash('viewer123', 10);
  await prisma.user.upsert({
    where: { username: 'viewer' },
    update: {},
    create: {
      username: 'viewer',
      passwordHash: viewerHash,
      fullName: 'مستخدم الاطلاع',
      role: UserRole.ANALYST,
    },
  });

  // --- 24 Tunisian Governorates (ولايات تونس) ---
  const governorates = [
    { id: 1,  nameAr: 'تونس',         code: '11' },
    { id: 2,  nameAr: 'أريانة',       code: '12' },
    { id: 3,  nameAr: 'بن عروس',      code: '13' },
    { id: 4,  nameAr: 'منوبة',        code: '14' },
    { id: 5,  nameAr: 'نابل',         code: '21' },
    { id: 6,  nameAr: 'زغوان',        code: '22' },
    { id: 7,  nameAr: 'بنزرت',        code: '23' },
    { id: 8,  nameAr: 'باجة',         code: '31' },
    { id: 9,  nameAr: 'جندوبة',       code: '32' },
    { id: 10, nameAr: 'الكاف',        code: '33' },
    { id: 11, nameAr: 'سليانة',       code: '34' },
    { id: 12, nameAr: 'سوسة',         code: '41' },
    { id: 13, nameAr: 'المنستير',     code: '42' },
    { id: 14, nameAr: 'المهدية',      code: '43' },
    { id: 15, nameAr: 'صفاقس',        code: '51' },
    { id: 16, nameAr: 'القيروان',     code: '71' },
    { id: 17, nameAr: 'القصرين',      code: '72' },
    { id: 18, nameAr: 'سيدي بوزيد',  code: '53' },
    { id: 19, nameAr: 'قابس',         code: '61' },
    { id: 20, nameAr: 'مدنين',        code: '62' },
    { id: 21, nameAr: 'تطاوين',       code: '63' },
    { id: 22, nameAr: 'قفصة',         code: '81' },
    { id: 23, nameAr: 'توزر',         code: '82' },
    { id: 24, nameAr: 'قبلي',         code: '83' },
  ];

  for (const gov of governorates) {
    await prisma.governorate.upsert({
      where: { id: gov.id },
      update: { nameAr: gov.nameAr, code: gov.code },
      create: gov,
    });
  }
  console.log(`✅ Seeded ${governorates.length} Tunisian governorates`);

  // --- Sample Cities ---
  const cities = [
    // تونس
    { id: 1, nameAr: 'تونس المدينة',     governorateId: 1 },
    { id: 2, nameAr: 'حلق الوادي',       governorateId: 1 },
    { id: 3, nameAr: 'المرسى',           governorateId: 1 },
    // أريانة
    { id: 4, nameAr: 'أريانة المدينة',   governorateId: 2 },
    { id: 5, nameAr: 'سيدي ثابت',        governorateId: 2 },
    // بن عروس
    { id: 6, nameAr: 'بن عروس',          governorateId: 3 },
    { id: 7, nameAr: 'رادس',             governorateId: 3 },
    // منوبة
    { id: 8, nameAr: 'منوبة',            governorateId: 4 },
    { id: 9, nameAr: 'طبربة',            governorateId: 4 },
    // نابل
    { id: 10, nameAr: 'نابل المدينة',    governorateId: 5 },
    { id: 11, nameAr: 'الحمامات',        governorateId: 5 },
    { id: 12, nameAr: 'قرمبالية',        governorateId: 5 },
    // زغوان
    { id: 13, nameAr: 'زغوان المدينة',   governorateId: 6 },
    { id: 14, nameAr: 'الفحص',           governorateId: 6 },
    // بنزرت
    { id: 15, nameAr: 'بنزرت المدينة',   governorateId: 7 },
    { id: 16, nameAr: 'منزل بورقيبة',    governorateId: 7 },
    { id: 17, nameAr: 'ماطر',            governorateId: 7 },
    // باجة
    { id: 18, nameAr: 'باجة المدينة',    governorateId: 8 },
    { id: 19, nameAr: 'مجاز الباب',      governorateId: 8 },
    // جندوبة
    { id: 20, nameAr: 'جندوبة المدينة',  governorateId: 9 },
    { id: 21, nameAr: 'طبرقة',           governorateId: 9 },
    // الكاف
    { id: 22, nameAr: 'الكاف المدينة',   governorateId: 10 },
    { id: 23, nameAr: 'الدهماني',        governorateId: 10 },
    // سليانة
    { id: 24, nameAr: 'سليانة المدينة',  governorateId: 11 },
    { id: 25, nameAr: 'مكثر',            governorateId: 11 },
    // سوسة
    { id: 26, nameAr: 'سوسة المدينة',    governorateId: 12 },
    { id: 27, nameAr: 'القلعة الكبرى',   governorateId: 12 },
    { id: 28, nameAr: 'صفصاف',           governorateId: 12 },
    // المنستير
    { id: 29, nameAr: 'المنستير المدينة', governorateId: 13 },
    { id: 30, nameAr: 'صيادة',           governorateId: 13 },
    // المهدية
    { id: 31, nameAr: 'المهدية المدينة', governorateId: 14 },
    { id: 32, nameAr: 'قصور الساف',      governorateId: 14 },
    // صفاقس
    { id: 33, nameAr: 'صفاقس المدينة',  governorateId: 15 },
    { id: 34, nameAr: 'ساقية الزيت',     governorateId: 15 },
    { id: 35, nameAr: 'قرقنة',           governorateId: 15 },
    // القيروان
    { id: 36, nameAr: 'القيروان المدينة', governorateId: 16 },
    { id: 37, nameAr: 'حفوز',            governorateId: 16 },
    // القصرين
    { id: 38, nameAr: 'القصرين المدينة', governorateId: 17 },
    { id: 39, nameAr: 'سبيطلة',          governorateId: 17 },
    // سيدي بوزيد
    { id: 40, nameAr: 'سيدي بوزيد',     governorateId: 18 },
    { id: 41, nameAr: 'الرقاب',          governorateId: 18 },
    { id: 42, nameAr: 'اولاد حفوز',      governorateId: 18 },
    { id: 43, nameAr: 'السعيدة',         governorateId: 18 },
    { id: 44, nameAr: 'المزونة',         governorateId: 18 },
    { id: 45, nameAr: 'المكناسي',        governorateId: 18 },
    { id: 46, nameAr: 'منزل بوزيان',     governorateId: 18 },
    { id: 47, nameAr: 'سوق الجديد',      governorateId: 18 },
    // قابس
    { id: 48, nameAr: 'قابس المدينة',   governorateId: 19 },
    { id: 49, nameAr: 'مطماطة',          governorateId: 19 },
    // مدنين
    { id: 50, nameAr: 'مدنين المدينة',   governorateId: 20 },
    { id: 51, nameAr: 'جربة',            governorateId: 20 },
    { id: 52, nameAr: 'بن قردان',        governorateId: 20 },
    // تطاوين
    { id: 53, nameAr: 'تطاوين المدينة',  governorateId: 21 },
    { id: 54, nameAr: 'غمراسن',          governorateId: 21 },
    // قفصة
    { id: 55, nameAr: 'قفصة المدينة',   governorateId: 22 },
    { id: 56, nameAr: 'الرديف',          governorateId: 22 },
    // توزر
    { id: 57, nameAr: 'توزر المدينة',   governorateId: 23 },
    { id: 58, nameAr: 'نفطة',            governorateId: 23 },
    // قبلي
    { id: 59, nameAr: 'قبلي المدينة',   governorateId: 24 },
    { id: 60, nameAr: 'دوز',             governorateId: 24 },
  ];

  for (const city of cities) {
    await prisma.city.upsert({
      where: { id: city.id },
      update: { nameAr: city.nameAr },
      create: city,
    });
  }
  console.log(`✅ Seeded ${cities.length} cities`);

  // --- Accident Causes ---
  const causes = [
    'السرعة المفرطة',
    'عدم احترام أولوية المرور',
    'عدم احترام مسافة الأمان',
    'عدم احترام إشارة المرور',
    'عدم احترام علامة قف',
    'التجاوز الخطير',
    'فقدان السيطرة على المركبة',
    'السياقة في حالة سكر',
    'السياقة بدون رخصة',
    'عدم الانتباه',
    'التعب والنعاس',
    'استعمال الهاتف أثناء السياقة',
    'سوء حالة المركبة',
    'سوء حالة الطريق',
    'الظروف المناخية',
    'عطب ميكانيكي',
    'انفجار الإطار',
    'سوء الإنارة',
    'عبور المشاة بطريقة غير قانونية',
    'وجود حيوانات على الطريق',
    'أسباب أخرى',
  ];

  for (let i = 0; i < causes.length; i++) {
    await prisma.accidentCause.upsert({
      where: { id: i + 1 },
      update: { nameAr: causes[i] },
      create: { id: i + 1, nameAr: causes[i], code: `CAUSE_${i + 1}` },
    });
  }
  console.log(`✅ Seeded ${causes.length} accident causes`);

  // --- Vehicle Brands ---
  const brands = [
    { nameAr: 'تويوتا',        nameEn: 'Toyota' },
    { nameAr: 'رونو',           nameEn: 'Renault' },
    { nameAr: 'بيجو',           nameEn: 'Peugeot' },
    { nameAr: 'سيتروين',        nameEn: 'Citroën' },
    { nameAr: 'فولكسفاغن',      nameEn: 'Volkswagen' },
    { nameAr: 'هيونداي',        nameEn: 'Hyundai' },
    { nameAr: 'كيا',            nameEn: 'Kia' },
    { nameAr: 'نيسان',          nameEn: 'Nissan' },
    { nameAr: 'مرسيدس',         nameEn: 'Mercedes-Benz' },
    { nameAr: 'بي أم دبليو',    nameEn: 'BMW' },
    { nameAr: 'أودي',           nameEn: 'Audi' },
    { nameAr: 'فيات',           nameEn: 'Fiat' },
    { nameAr: 'فورد',           nameEn: 'Ford' },
    { nameAr: 'شيفروليه',       nameEn: 'Chevrolet' },
    { nameAr: 'سوزوكي',         nameEn: 'Suzuki' },
    { nameAr: 'هوندا',          nameEn: 'Honda' },
    { nameAr: 'ميتسوبيشي',      nameEn: 'Mitsubishi' },
    { nameAr: 'سكودا',          nameEn: 'Skoda' },
    { nameAr: 'سيات',           nameEn: 'SEAT' },
    { nameAr: 'داسيا',          nameEn: 'Dacia' },
    { nameAr: 'شيري',           nameEn: 'Chery' },
    { nameAr: 'جيلي',           nameEn: 'Geely' },
    { nameAr: 'هايما',          nameEn: 'Haima' },
    { nameAr: 'إم جي',          nameEn: 'MG' },
    { nameAr: 'لاند روفر',      nameEn: 'Land Rover' },
    { nameAr: 'جيب',            nameEn: 'Jeep' },
    { nameAr: 'أوبل',           nameEn: 'Opel' },
    { nameAr: 'مازدا',          nameEn: 'Mazda' },
    { nameAr: 'سوبارو',         nameEn: 'Subaru' },
    { nameAr: 'إيسوزو',         nameEn: 'Isuzu' },
    { nameAr: 'مان',            nameEn: 'MAN' },
    { nameAr: 'سكانيا',         nameEn: 'Scania' },
    { nameAr: 'إيفيكو',         nameEn: 'Iveco' },
    { nameAr: 'شاحنة أخرى',     nameEn: 'Other Truck' },
    { nameAr: 'دراجة نارية',    nameEn: 'Motorcycle' },
    { nameAr: 'حافلة',          nameEn: 'Bus' },
    { nameAr: 'جرار فلاحي',     nameEn: 'Agricultural Tractor' },
    { nameAr: 'أخرى',           nameEn: 'Other' },
  ];

  for (let i = 0; i < brands.length; i++) {
    await prisma.vehicleBrand.upsert({
      where: { id: i + 1 },
      update: { nameAr: brands[i].nameAr, nameEn: brands[i].nameEn },
      create: { id: i + 1, nameAr: brands[i].nameAr, nameEn: brands[i].nameEn },
    });
  }
  console.log(`✅ Seeded ${brands.length} vehicle brands`);

  // --- Sample Accidents (Tunisian roads & governorates) ---
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (admin) {
    const sampleAccidents = [
      // تونس - GP1
      { date: '2025-01-10', time: '08:30', govId: 1,  causeId: 1,  brand1Id: 2,  brand2Id: 4,  deaths: 2, injuries: 3, route: 'الطريق الوطني رقم 1 — تونس/صفاقس',      km: 12.5 },
      // سوسة - A1 Motorway
      { date: '2025-01-18', time: '14:00', govId: 12, causeId: 3,  brand1Id: 1,  brand2Id: 5,  deaths: 0, injuries: 4, route: 'الطريق السيار A1 — تونس/المسافة 142',     km: 142.0 },
      // صفاقس - GP1
      { date: '2025-02-03', time: '22:15', govId: 15, causeId: 8,  brand1Id: 3,  brand2Id: undefined, deaths: 1, injuries: 2, route: 'الطريق الوطني رقم 1 — صفاقس/قابس', km: 267.0 },
      // بنزرت - GP7
      { date: '2025-02-08', time: '06:45', govId: 7,  causeId: 11, brand1Id: 6,  brand2Id: 1,  deaths: 0, injuries: 1, route: 'الطريق الوطني رقم 7 — تونس/بنزرت',        km: 55.0  },
      // القيروان - GP2
      { date: '2025-02-15', time: '17:30', govId: 16, causeId: 6,  brand1Id: 20, brand2Id: 3,  deaths: 3, injuries: 5, route: 'الطريق الوطني رقم 2 — تونس/القيروان',     km: 160.0 },
      // القصرين - GP3
      { date: '2025-02-22', time: '10:00', govId: 17, causeId: 7,  brand1Id: 8,  brand2Id: undefined, deaths: 0, injuries: 2, route: 'الطريق الوطني رقم 3 — القصرين/سبيطلة', km: 22.0 },
      // المنستير - GP82
      { date: '2025-03-01', time: '13:20', govId: 13, causeId: 2,  brand1Id: 14, brand2Id: 9,  deaths: 1, injuries: 3, route: 'الطريق الوطني رقم 82 — المنستير/سوسة',    km: 18.0  },
      // أريانة - طريق حضري
      { date: '2025-03-05', time: '19:00', govId: 2,  causeId: 12, brand1Id: 21, brand2Id: undefined, deaths: 0, injuries: 1, route: 'الطريق الجهوي رقم 30 — أريانة',     km: 4.0  },
      // نابل - GP1
      { date: '2025-03-09', time: '07:15', govId: 5,  causeId: 15, brand1Id: 2,  brand2Id: 20, deaths: 2, injuries: 4, route: 'الطريق الوطني رقم 1 — نابل/بئر بورقبة',  km: 38.0  },
      // جندوبة - GP6
      { date: '2025-03-13', time: '16:45', govId: 9,  causeId: 4,  brand1Id: 3,  brand2Id: 15, deaths: 0, injuries: 2, route: 'الطريق الوطني رقم 6 — جندوبة/باجة',      km: 72.0  },
      // مدنين - GP1
      { date: '2025-03-17', time: '23:30', govId: 20, causeId: 10, brand1Id: 1,  brand2Id: undefined, deaths: 1, injuries: 0, route: 'الطريق الوطني رقم 1 — مدنين/جرجيس', km: 310.0 },
      // قابس - A1 Extension
      { date: '2025-03-20', time: '11:00', govId: 19, causeId: 1,  brand1Id: 5,  brand2Id: 12, deaths: 0, injuries: 3, route: 'الطريق الوطني رقم 1 — قابس/مدنين',       km: 285.0 },
      // سيدي بوزيد - GP13
      { date: '2025-03-22', time: '05:30', govId: 18, causeId: 16, brand1Id: 35, brand2Id: undefined, deaths: 2, injuries: 1, route: 'الطريق الوطني رقم 13 — سيدي بوزيد/صفاقس', km: 95.0 },
      // قفصة - GP3
      { date: '2025-03-25', time: '15:00', govId: 22, causeId: 19, brand1Id: 37, brand2Id: undefined, deaths: 1, injuries: 0, route: 'الطريق الوطني رقم 3 — قفصة/القصرين', km: 130.0 },
      // بن عروس - طريق حضري
      { date: '2025-03-28', time: '09:45', govId: 3,  causeId: 5,  brand1Id: 2,  brand2Id: 6,  deaths: 0, injuries: 2, route: 'الطريق الجهوي رقم 43 — بن عروس/رادس',   km: 7.0   },
    ];

    for (const acc of sampleAccidents) {
      await prisma.accident.create({
        data: {
          accidentDate: new Date(acc.date),
          accidentTime: acc.time,
          governorateId: acc.govId,
          causeId: acc.causeId,
          vehicleBrand1Id: acc.brand1Id,
          vehicleBrand2Id: acc.brand2Id ?? undefined,
          deathsCount: acc.deaths,
          injuriesCount: acc.injuries,
          route: acc.route,
          kilometrePoint: acc.km,
          createdById: admin.id,
        },
      });
    }
    console.log(`✅ Seeded ${sampleAccidents.length} sample accidents`);
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
