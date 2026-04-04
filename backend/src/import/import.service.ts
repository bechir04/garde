import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { ImportJobStatus } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

interface ParsedRow {
  rowNumber: number;
  rawData: Record<string, unknown>;
  isValid: boolean;
  errors: string[];
  mapped: {
    accidentDate?: string;
    accidentTime?: string;
    governorateId?: number;
    cityId?: number;
    route?: string;
    kilometrePoint?: number;
    causeId?: number;
    vehicleBrand1Id?: number;
    vehicleBrand2Id?: number;
    deathsCount?: number;
    injuriesCount?: number;
    description?: string;
  };
}

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  async parseExcel(buffer: Buffer, fileName: string, userId: string, defaultGovernorateId?: number) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.worksheets[0];

    if (!sheet || sheet.rowCount < 2) {
      throw new BadRequestException('الملف فارغ أو لا يحتوي على بيانات');
    }

    // Create import job
    const importJob = await this.prisma.importJob.create({
      data: {
        fileName,
        status: ImportJobStatus.PENDING,
        createdById: userId,
      },
    });

    // Load lookups for validation
    const governorates = await this.prisma.governorate.findMany();
    const cities = await this.prisma.city.findMany();
    const causes = await this.prisma.accidentCause.findMany();
    const brands = await this.prisma.vehicleBrand.findMany();

    // Normalize Arabic text for flexible matching
    const normalize = (s: string) => s.trim().replace(/\s+/g, ' ').replace(/ة$/, 'ه').replace(/[أإآ]/g, 'ا');
    const govByName = new Map(governorates.map((g) => [normalize(g.nameAr), g.id]));
    const cityByName = new Map(cities.map((c) => [`${c.governorateId}-${c.nameAr.trim()}`, c.id]));
    const causeByName = new Map(causes.map((c) => [normalize(c.nameAr), c.id]));
    const brandByName = new Map(brands.map((b) => [b.nameAr.trim(), b.id]));

    // Helper: find governorate with fallback to partial match
    const findGov = (val: string): number | undefined => {
      const n = normalize(val);
      if (govByName.has(n)) return govByName.get(n);
      // partial match: find gov whose name contains the search term or vice versa
      for (const [k, id] of govByName) {
        if (k.includes(n) || n.includes(k)) return id;
      }
      return undefined;
    };

    const rows: ParsedRow[] = [];
    const headerRow = sheet.getRow(1);
    const headers = headerRow.values as string[];
    console.log('[Import] Detected headers:', headers.filter(Boolean));

    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      const rawData: Record<string, unknown> = {};
      const errors: string[] = [];

      // Map column values by index (A=1, B=2, etc.)
      headers.forEach((h, idx) => {
        if (h && idx > 0) rawData[String(h).trim()] = row.getCell(idx).value;
      });

      // Helper: pick first non-null, non-Date value from candidate keys
      const pick = (...keys: string[]) => {
        for (const k of keys) {
          const v = rawData[k];
          if (v != null && v !== '') return v;
        }
        return undefined;
      };
      // Pick string only (skip Date objects which mean a wrong column was matched)
      const pickStr = (...keys: string[]) => {
        for (const k of keys) {
          const v = rawData[k];
          if (v != null && !(v instanceof Date) && String(v).trim() !== '') return v;
        }
        return undefined;
      };

      // Try to map fields — header-based only, no position fallback
      const dateVal    = pick('تاريخ الحادث', ' التاريخ', 'التاريخ', 'date', 'Date', 'تاريخ');
      const timeVal    = pick('الساعة', 'الوقت', 'وقت الحادث', 'time', 'Time');
      const govVal     = pickStr('الولاية', 'المحافظة', 'governorate', 'الولايه', 'ولاية', 'محافظة', 'Governorate');
      const cityVal    = pickStr('المعتمدية', 'البلدية', 'المدينة', 'city', 'City', 'معتمدية', 'بلدية', 'مدينة');
      const routeVal   = pickStr('الطريق', 'المحور', 'المسلك', 'route', 'Route', 'طريق');
      const kmVal      = pick('النقطة الكيلومترية', 'كلم', 'pk', 'PK', 'نقطة كيلومترية', 'المسافة الكيلومترية');
      const causeVal   = pickStr('السبب', 'سبب الحادث', 'الأسباب', 'cause', 'Cause');
      const brand1Val  = pickStr(' الوسيلة 1', 'الوسيلة 1', 'مركبة 1', 'العلامة 1', 'brand1', 'علامة المركبة 1');
      const brand2Val  = pickStr(' الوسيلة 2', 'الوسيلة 2', 'مركبة 2', 'العلامة 2', 'brand2', 'علامة المركبة 2');
      const deathsVal  = pick('عدد الوفيات', 'الوفيات', 'القتلى', 'deaths', 'Deaths');
      const injuriesVal = pick('عدد الجرحى', 'الجرحى', 'injuries', 'Injuries', 'الجرحى والمصابين');
      const descVal    = pickStr('الملاحظات', 'الوصف', 'ملاحظات', 'description', 'Description', 'تفاصيل');

      // Capture all extra columns as metadata (anything not handled above)
      const knownKeys = new Set([
        'تاريخ الحادث', ' التاريخ', 'التاريخ', 'date', 'Date', 'تاريخ',
        'الساعة', 'الوقت', 'وقت الحادث', 'time', 'Time',
        'الولاية', 'المحافظة', 'governorate', 'الولايه', 'ولاية', 'محافظة', 'Governorate',
        'المعتمدية', 'البلدية', 'المدينة', 'city', 'City', 'معتمدية', 'بلدية', 'مدينة',
        'الطريق', 'المحور', 'المسلك', 'route', 'Route', 'طريق',
        'النقطة الكيلومترية', 'كلم', 'pk', 'PK', 'نقطة كيلومترية', 'المسافة الكيلومترية',
        'السبب', 'سبب الحادث', 'الأسباب', 'cause', 'Cause',
        ' الوسيلة 1', 'الوسيلة 1', 'مركبة 1', 'العلامة 1', 'brand1', 'علامة المركبة 1',
        ' الوسيلة 2', 'الوسيلة 2', 'مركبة 2', 'العلامة 2', 'brand2', 'علامة المركبة 2',
        'عدد الوفيات', 'الوفيات', 'القتلى', 'deaths', 'Deaths',
        'عدد الجرحى', 'الجرحى', 'injuries', 'Injuries', 'الجرحى والمصابين',
        'الملاحظات', 'الوصف', 'ملاحظات', 'description', 'Description', 'تفاصيل',
        'رقم الحادث',
      ]);
      const extraMetadata: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rawData)) {
        if (!k.startsWith('__') && !knownKeys.has(k) && v != null && String(v).trim() !== '') {
          extraMetadata[k.trim()] = v instanceof Date ? v.toISOString() : v;
        }
      }

      // Parse date
      let accidentDate: string | undefined;
      if (dateVal instanceof Date) {
        accidentDate = dateVal.toISOString().split('T')[0];
      } else if (typeof dateVal === 'string' && dateVal.trim()) {
        accidentDate = dateVal.trim();
      }
      if (!accidentDate) errors.push('تاريخ الحادث مطلوب');

      // Parse time
      let accidentTime: string | undefined;
      if (typeof timeVal === 'string') accidentTime = timeVal.trim().substring(0, 5);
      else if (timeVal instanceof Date) {
        accidentTime = `${String(timeVal.getHours()).padStart(2, '0')}:${String(timeVal.getMinutes()).padStart(2, '0')}`;
      }
      if (!accidentTime) accidentTime = '00:00';

      // Match governorate — accept string or number, use flexible matching
      let governorateId: number | undefined;
      const govStr = govVal != null ? String(govVal).trim() : '';
      if (govStr) {
        governorateId = findGov(govStr);
        if (!governorateId) errors.push(`ولاية غير معروفة: ${govStr}`);
      } else if (defaultGovernorateId) {
        governorateId = defaultGovernorateId; // use the default selected by the user
      } else {
        errors.push('الولاية مطلوبة');
      }

      // Match city
      let cityId: number | undefined;
      if (typeof cityVal === 'string' && governorateId) {
        cityId = cityByName.get(`${governorateId}-${cityVal.trim()}`);
      }

      // Match cause — auto-create if not found
      let causeId: number | undefined;
      const causeStr = causeVal != null ? String(causeVal).trim() : '';
      if (causeStr) {
        causeId = causeByName.get(normalize(causeStr));
        if (!causeId) {
          // Check if a cause with this name already exists (case-insensitive)
          const existing = await this.prisma.accidentCause.findFirst({
            where: { nameAr: { equals: causeStr, mode: 'insensitive' } },
          });
          if (existing) {
            causeId = existing.id;
          } else {
            try {
              const newCause = await this.prisma.accidentCause.create({
                data: { code: `IMPORT_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, nameAr: causeStr },
              });
              causeId = newCause.id;
            } catch {
              // Sequence conflict — fetch by name as fallback
              const fallback = await this.prisma.accidentCause.findFirst({
                where: { nameAr: { equals: causeStr, mode: 'insensitive' } },
              });
              if (fallback) causeId = fallback.id;
            }
          }
          if (causeId) causeByName.set(normalize(causeStr), causeId);
        }
      } else {
        errors.push('سبب الحادث مطلوب');
      }

      // Match brands
      let vehicleBrand1Id: number | undefined;
      let vehicleBrand2Id: number | undefined;
      if (typeof brand1Val === 'string') vehicleBrand1Id = brandByName.get(brand1Val.trim());
      if (typeof brand2Val === 'string') vehicleBrand2Id = brandByName.get(brand2Val.trim());

      // Save raw brand text as metadata if it didn't match a DB entry
      if (brand1Val && !vehicleBrand1Id) extraMetadata['ماركة السيارة 1'] = brand1Val;
      if (brand2Val && !vehicleBrand2Id) extraMetadata['ماركة السيارة 2'] = brand2Val;

      const deathsCount = typeof deathsVal === 'number' ? deathsVal : parseInt(String(deathsVal), 10) || 0;
      const injuriesCount = typeof injuriesVal === 'number' ? injuriesVal : parseInt(String(injuriesVal), 10) || 0;

      // Store resolved IDs so commitJob can use them directly without re-parsing
      rawData['__metadata'] = Object.keys(extraMetadata).length > 0 ? extraMetadata : undefined;
      rawData['__governorateId'] = governorateId;
      rawData['__causeId'] = causeId;
      rawData['__cityId'] = cityId;
      rawData['__vehicleBrand1Id'] = vehicleBrand1Id;
      rawData['__vehicleBrand2Id'] = vehicleBrand2Id;
      rawData['__accidentDate'] = accidentDate;
      rawData['__accidentTime'] = accidentTime;
      rawData['__deathsCount'] = deathsCount;
      rawData['__injuriesCount'] = injuriesCount;
      rawData['__route'] = typeof routeVal === 'string' ? routeVal.trim() : undefined;
      rawData['__km'] = typeof kmVal === 'number' ? kmVal : parseFloat(String(kmVal)) || undefined;
      rawData['__description'] = typeof descVal === 'string' ? descVal.trim() : undefined;

      rows.push({
        rowNumber: i,
        rawData,
        isValid: errors.length === 0,
        errors,
        mapped: {
          accidentDate,
          accidentTime,
          governorateId,
          cityId,
          route: typeof routeVal === 'string' ? routeVal.trim() : undefined,
          kilometrePoint: typeof kmVal === 'number' ? kmVal : parseFloat(String(kmVal)) || undefined,
          causeId,
          vehicleBrand1Id,
          vehicleBrand2Id,
          deathsCount,
          injuriesCount,
          description: typeof descVal === 'string' ? descVal.trim() : undefined,
        },
      });
    }

    // Save rows to DB
    await this.prisma.importJobRow.createMany({
      data: rows.map((r) => ({
        importJobId: importJob.id,
        rowNumber: r.rowNumber,
        rawData: r.rawData as any,
        isValid: r.isValid,
        errors: r.errors.length > 0 ? r.errors : undefined,
      })),
    });

    const validCount = rows.filter((r) => r.isValid).length;
    const invalidCount = rows.filter((r) => !r.isValid).length;

    await this.prisma.importJob.update({
      where: { id: importJob.id },
      data: { totalRows: rows.length, validRows: validCount, invalidRows: invalidCount },
    });

    return {
      importJobId: importJob.id,
      totalRows: rows.length,
      validRows: validCount,
      invalidRows: invalidCount,
      preview: rows.slice(0, 20).map((r) => ({
        rowNumber: r.rowNumber,
        isValid: r.isValid,
        errors: r.errors,
        data: r.mapped,
      })),
    };
  }

  async commitJob(importJobId: string, userId: string) {
    const job = await this.prisma.importJob.findUnique({
      where: { id: importJobId },
      include: { rows: { where: { isValid: true, accidentId: null } } },
    });

    if (!job) throw new BadRequestException('عملية الاستيراد غير موجودة');
    if (job.status === ImportJobStatus.COMPLETED) throw new BadRequestException('تم تأكيد هذا الملف بالفعل');

    // All resolved IDs were stored in rawData during parseExcel — no lookup reload needed

    let committed = 0;

    for (const row of job.rows) {
      const raw = row.rawData as Record<string, unknown>;

      try {
        // Use pre-resolved IDs stored during parseExcel
        const governorateId = raw['__governorateId'] as number | undefined;
        const causeId = raw['__causeId'] as number | undefined;

        if (!governorateId || !causeId) continue;

        const accidentDate = raw['__accidentDate'] ? new Date(String(raw['__accidentDate'])) : new Date();
        const accidentTime = (raw['__accidentTime'] as string) || '00:00';
        const cityId = raw['__cityId'] as number | undefined;
        const vehicleBrand1Id = raw['__vehicleBrand1Id'] as number | undefined;
        const vehicleBrand2Id = raw['__vehicleBrand2Id'] as number | undefined;

        const accident = await this.prisma.accident.create({
          data: {
            accidentDate,
            accidentTime,
            governorateId,
            cityId,
            route: (raw['__route'] as string) || undefined,
            kilometrePoint: raw['__km'] != null ? Number(raw['__km']) : undefined,
            causeId,
            vehicleBrand1Id,
            vehicleBrand2Id,
            deathsCount: Number(raw['__deathsCount']) || 0,
            injuriesCount: Number(raw['__injuriesCount']) || 0,
            description: (raw['__description'] as string) || undefined,
            metadata: raw['__metadata'] as any || undefined,
            importJobId,
            createdById: userId,
          },
        });

        await this.prisma.importJobRow.update({
          where: { id: row.id },
          data: { accidentId: accident.id },
        });

        committed++;
      } catch (e) {
        console.error('[Import] Row commit failed:', e?.message || e);
      }
    }

    await this.prisma.importJob.update({
      where: { id: importJobId },
      data: { status: ImportJobStatus.COMPLETED },
    });

    return { committed, total: job.rows.length };
  }

  async getJobs() {
    return this.prisma.importJob.findMany({
      include: { createdBy: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJobRows(jobId: string, page = 1, limit = 50) {
    const [data, total] = await Promise.all([
      this.prisma.importJobRow.findMany({
        where: { importJobId: jobId },
        orderBy: { rowNumber: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.importJobRow.count({ where: { importJobId: jobId } }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('نموذج الحوادث');

    sheet.columns = [
      { header: 'تاريخ الحادث', key: 'date', width: 15 },
      { header: 'الساعة', key: 'time', width: 10 },
      { header: 'الولاية', key: 'gov', width: 20 },
      { header: 'المعتمدية', key: 'city', width: 20 },
      { header: 'الطريق', key: 'route', width: 25 },
      { header: 'النقطة الكيلومترية', key: 'km', width: 15 },
      { header: 'السبب', key: 'cause', width: 25 },
      { header: 'مركبة 1', key: 'brand1', width: 15 },
      { header: 'مركبة 2', key: 'brand2', width: 15 },
      { header: 'الوفيات', key: 'deaths', width: 10 },
      { header: 'الجرحى', key: 'injuries', width: 10 },
      { header: 'الملاحظات', key: 'desc', width: 30 },
    ];

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4332' } };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // RTL
    sheet.views = [{ rightToLeft: true }];

    // Add example row
    sheet.addRow({
      date: '2025-01-15',
      time: '14:30',
      gov: 'تونس',
      city: 'تونس',
      route: 'الطريق الوطني رقم 1',
      km: 45.5,
      cause: 'السرعة المفرطة',
      brand1: 'تويوتا',
      brand2: 'رونو',
      deaths: 0,
      injuries: 2,
      desc: 'حادث تصادم بين مركبتين',
    });

    // Add a second reference sheet with valid values
    const refSheet = workbook.addWorksheet('القيم المرجعية');
    refSheet.views = [{ rightToLeft: true }];

    const governorates = await this.prisma.governorate.findMany({ orderBy: { nameAr: 'asc' } });
    const causes = await this.prisma.accidentCause.findMany({ orderBy: { nameAr: 'asc' } });
    const brands = await this.prisma.vehicleBrand.findMany({ orderBy: { nameAr: 'asc' } });

    refSheet.columns = [
      { header: 'الولايات', key: 'gov', width: 30 },
      { header: 'أسباب الحوادث', key: 'cause', width: 35 },
      { header: 'العلامات التجارية', key: 'brand', width: 25 },
    ];

    const maxLen = Math.max(governorates.length, causes.length, brands.length);
    for (let i = 0; i < maxLen; i++) {
      refSheet.addRow({
        gov: governorates[i]?.nameAr || '',
        cause: causes[i]?.nameAr || '',
        brand: brands[i]?.nameAr || '',
      });
    }

    const refHeader = refSheet.getRow(1);
    refHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    refHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4332' } };

    const buf = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }
}
