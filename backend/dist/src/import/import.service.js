"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ExcelJS = require("exceljs");
const client_1 = require("@prisma/client");
let ImportService = class ImportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async parseExcel(buffer, fileName, userId, defaultGovernorateId) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const sheet = workbook.worksheets[0];
        if (!sheet || sheet.rowCount < 2) {
            throw new common_1.BadRequestException('الملف فارغ أو لا يحتوي على بيانات');
        }
        const importJob = await this.prisma.importJob.create({
            data: {
                fileName,
                status: client_1.ImportJobStatus.PENDING,
                createdById: userId,
            },
        });
        const governorates = await this.prisma.governorate.findMany();
        const cities = await this.prisma.city.findMany();
        const causes = await this.prisma.accidentCause.findMany();
        const brands = await this.prisma.vehicleBrand.findMany();
        const normalize = (s) => s.trim().replace(/\s+/g, ' ').replace(/ة$/, 'ه').replace(/[أإآ]/g, 'ا');
        const govByName = new Map(governorates.map((g) => [normalize(g.nameAr), g.id]));
        const cityByName = new Map(cities.map((c) => [`${c.governorateId}-${c.nameAr.trim()}`, c.id]));
        const causeByName = new Map(causes.map((c) => [normalize(c.nameAr), c.id]));
        const brandByName = new Map(brands.map((b) => [b.nameAr.trim(), b.id]));
        const findGov = (val) => {
            const n = normalize(val);
            if (govByName.has(n))
                return govByName.get(n);
            for (const [k, id] of govByName) {
                if (k.includes(n) || n.includes(k))
                    return id;
            }
            return undefined;
        };
        const rows = [];
        const headerRow = sheet.getRow(1);
        const headers = headerRow.values;
        console.log('[Import] Detected headers:', headers.filter(Boolean));
        for (let i = 2; i <= sheet.rowCount; i++) {
            const row = sheet.getRow(i);
            const rawData = {};
            const errors = [];
            headers.forEach((h, idx) => {
                if (h && idx > 0)
                    rawData[String(h).trim()] = row.getCell(idx).value;
            });
            const pick = (...keys) => {
                for (const k of keys) {
                    const v = rawData[k];
                    if (v != null && v !== '')
                        return v;
                }
                return undefined;
            };
            const pickStr = (...keys) => {
                for (const k of keys) {
                    const v = rawData[k];
                    if (v != null && !(v instanceof Date) && String(v).trim() !== '')
                        return v;
                }
                return undefined;
            };
            const dateVal = pick('تاريخ الحادث', ' التاريخ', 'التاريخ', 'date', 'Date', 'تاريخ');
            const timeVal = pick('الساعة', 'الوقت', 'وقت الحادث', 'time', 'Time');
            const govVal = pickStr('الولاية', 'المحافظة', 'governorate', 'الولايه', 'ولاية', 'محافظة', 'Governorate');
            const cityVal = pickStr('البلدية', 'المدينة', 'city', 'City', 'بلدية', 'مدينة');
            const routeVal = pickStr('الطريق', 'المحور', 'المسلك', 'route', 'Route', 'طريق');
            const kmVal = pick('النقطة الكيلومترية', 'كلم', 'pk', 'PK', 'نقطة كيلومترية', 'المسافة الكيلومترية');
            const causeVal = pickStr('السبب', 'سبب الحادث', 'الأسباب', 'cause', 'Cause');
            const brand1Val = pickStr(' الوسيلة 1', 'الوسيلة 1', 'مركبة 1', 'العلامة 1', 'brand1', 'علامة المركبة 1');
            const brand2Val = pickStr(' الوسيلة 2', 'الوسيلة 2', 'مركبة 2', 'العلامة 2', 'brand2', 'علامة المركبة 2');
            const deathsVal = pick('عدد الوفيات', 'الوفيات', 'القتلى', 'deaths', 'Deaths');
            const injuriesVal = pick('عدد الجرحى', 'الجرحى', 'الإصابات', 'injuries', 'Injuries', 'الجرحى والمصابين');
            const descVal = pickStr('الملاحظات', 'الوصف', 'ملاحظات', 'description', 'Description', 'تفاصيل');
            const knownKeys = new Set([
                'تاريخ الحادث', ' التاريخ', 'التاريخ', 'date', 'Date', 'تاريخ',
                'الساعة', 'الوقت', 'وقت الحادث', 'time', 'Time',
                'الولاية', 'المحافظة', 'governorate', 'الولايه', 'ولاية', 'محافظة', 'Governorate',
                'البلدية', 'المدينة', 'city', 'City', 'بلدية', 'مدينة',
                'الطريق', 'المحور', 'المسلك', 'route', 'Route', 'طريق',
                'النقطة الكيلومترية', 'كلم', 'pk', 'PK', 'نقطة كيلومترية', 'المسافة الكيلومترية',
                'السبب', 'سبب الحادث', 'الأسباب', 'cause', 'Cause',
                ' الوسيلة 1', 'الوسيلة 1', 'مركبة 1', 'العلامة 1', 'brand1', 'علامة المركبة 1',
                ' الوسيلة 2', 'الوسيلة 2', 'مركبة 2', 'العلامة 2', 'brand2', 'علامة المركبة 2',
                'عدد الوفيات', 'الوفيات', 'القتلى', 'deaths', 'Deaths',
                'عدد الجرحى', 'الجرحى', 'الإصابات', 'injuries', 'Injuries', 'الجرحى والمصابين',
                'الملاحظات', 'الوصف', 'ملاحظات', 'description', 'Description', 'تفاصيل',
                'رقم الحادث',
            ]);
            const extraMetadata = {};
            for (const [k, v] of Object.entries(rawData)) {
                if (!k.startsWith('__') && !knownKeys.has(k) && v != null && String(v).trim() !== '') {
                    extraMetadata[k.trim()] = v instanceof Date ? v.toISOString() : v;
                }
            }
            let accidentDate;
            if (dateVal instanceof Date) {
                accidentDate = dateVal.toISOString().split('T')[0];
            }
            else if (typeof dateVal === 'string' && dateVal.trim()) {
                accidentDate = dateVal.trim();
            }
            if (!accidentDate)
                errors.push('تاريخ الحادث مطلوب');
            let accidentTime;
            if (typeof timeVal === 'string')
                accidentTime = timeVal.trim().substring(0, 5);
            else if (timeVal instanceof Date) {
                accidentTime = `${String(timeVal.getHours()).padStart(2, '0')}:${String(timeVal.getMinutes()).padStart(2, '0')}`;
            }
            if (!accidentTime)
                accidentTime = '00:00';
            let governorateId;
            const govStr = govVal != null ? String(govVal).trim() : '';
            if (govStr) {
                governorateId = findGov(govStr);
                if (!governorateId)
                    errors.push(`ولاية غير معروفة: ${govStr}`);
            }
            else if (defaultGovernorateId) {
                governorateId = defaultGovernorateId;
            }
            else {
                errors.push('الولاية مطلوبة');
            }
            let cityId;
            if (typeof cityVal === 'string' && governorateId) {
                cityId = cityByName.get(`${governorateId}-${cityVal.trim()}`);
            }
            let causeId;
            const causeStr = causeVal != null ? String(causeVal).trim() : '';
            if (causeStr) {
                causeId = causeByName.get(normalize(causeStr));
                if (!causeId) {
                    const existing = await this.prisma.accidentCause.findFirst({
                        where: { nameAr: { equals: causeStr, mode: 'insensitive' } },
                    });
                    if (existing) {
                        causeId = existing.id;
                    }
                    else {
                        try {
                            const newCause = await this.prisma.accidentCause.create({
                                data: { code: `IMPORT_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, nameAr: causeStr },
                            });
                            causeId = newCause.id;
                        }
                        catch {
                            const fallback = await this.prisma.accidentCause.findFirst({
                                where: { nameAr: { equals: causeStr, mode: 'insensitive' } },
                            });
                            if (fallback)
                                causeId = fallback.id;
                        }
                    }
                    if (causeId)
                        causeByName.set(normalize(causeStr), causeId);
                }
            }
            else {
                errors.push('سبب الحادث مطلوب');
            }
            let vehicleBrand1Id;
            let vehicleBrand2Id;
            if (typeof brand1Val === 'string')
                vehicleBrand1Id = brandByName.get(brand1Val.trim());
            if (typeof brand2Val === 'string')
                vehicleBrand2Id = brandByName.get(brand2Val.trim());
            if (brand1Val && !vehicleBrand1Id)
                extraMetadata['ماركة السيارة 1'] = brand1Val;
            if (brand2Val && !vehicleBrand2Id)
                extraMetadata['ماركة السيارة 2'] = brand2Val;
            const deathsCount = typeof deathsVal === 'number' ? deathsVal : parseInt(String(deathsVal), 10) || 0;
            const injuriesCount = typeof injuriesVal === 'number' ? injuriesVal : parseInt(String(injuriesVal), 10) || 0;
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
        await this.prisma.importJobRow.createMany({
            data: rows.map((r) => ({
                importJobId: importJob.id,
                rowNumber: r.rowNumber,
                rawData: r.rawData,
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
    async commitJob(importJobId, userId) {
        const job = await this.prisma.importJob.findUnique({
            where: { id: importJobId },
            include: { rows: { where: { isValid: true, accidentId: null } } },
        });
        if (!job)
            throw new common_1.BadRequestException('عملية الاستيراد غير موجودة');
        if (job.status === client_1.ImportJobStatus.COMPLETED)
            throw new common_1.BadRequestException('تم تأكيد هذا الملف بالفعل');
        let committed = 0;
        for (const row of job.rows) {
            const raw = row.rawData;
            try {
                const governorateId = raw['__governorateId'];
                const causeId = raw['__causeId'];
                if (!governorateId || !causeId)
                    continue;
                const accidentDate = raw['__accidentDate'] ? new Date(String(raw['__accidentDate'])) : new Date();
                const accidentTime = raw['__accidentTime'] || '00:00';
                const cityId = raw['__cityId'];
                const vehicleBrand1Id = raw['__vehicleBrand1Id'];
                const vehicleBrand2Id = raw['__vehicleBrand2Id'];
                const accident = await this.prisma.accident.create({
                    data: {
                        accidentDate,
                        accidentTime,
                        governorateId,
                        cityId,
                        route: raw['__route'] || undefined,
                        kilometrePoint: raw['__km'] != null ? Number(raw['__km']) : undefined,
                        causeId,
                        vehicleBrand1Id,
                        vehicleBrand2Id,
                        deathsCount: Number(raw['__deathsCount']) || 0,
                        injuriesCount: Number(raw['__injuriesCount']) || 0,
                        description: raw['__description'] || undefined,
                        metadata: raw['__metadata'] || undefined,
                        importJobId,
                        createdById: userId,
                    },
                });
                await this.prisma.importJobRow.update({
                    where: { id: row.id },
                    data: { accidentId: accident.id },
                });
                committed++;
            }
            catch (e) {
                console.error('[Import] Row commit failed:', e?.message || e);
            }
        }
        await this.prisma.importJob.update({
            where: { id: importJobId },
            data: { status: client_1.ImportJobStatus.COMPLETED },
        });
        return { committed, total: job.rows.length };
    }
    async getJobs() {
        return this.prisma.importJob.findMany({
            include: { createdBy: { select: { fullName: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getJobRows(jobId, page = 1, limit = 50) {
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
    async generateTemplate() {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('نموذج الحوادث');
        sheet.columns = [
            { header: 'تاريخ الحادث', key: 'date', width: 15 },
            { header: 'الساعة', key: 'time', width: 10 },
            { header: 'الولاية', key: 'gov', width: 20 },
            { header: 'البلدية', key: 'city', width: 20 },
            { header: 'الطريق', key: 'route', width: 25 },
            { header: 'النقطة الكيلومترية', key: 'km', width: 15 },
            { header: 'السبب', key: 'cause', width: 25 },
            { header: 'مركبة 1', key: 'brand1', width: 15 },
            { header: 'مركبة 2', key: 'brand2', width: 15 },
            { header: 'الوفيات', key: 'deaths', width: 10 },
            { header: 'الجرحى', key: 'injuries', width: 10 },
            { header: 'الملاحظات', key: 'desc', width: 30 },
        ];
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4332' } };
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.views = [{ rightToLeft: true }];
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
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ImportService);
//# sourceMappingURL=import.service.js.map