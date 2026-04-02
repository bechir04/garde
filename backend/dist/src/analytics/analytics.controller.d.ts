import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private analyticsService;
    constructor(analyticsService: AnalyticsService);
    getSummary(): Promise<{
        totalAccidents: number;
        totalDeaths: number;
        totalInjuries: number;
        monthlyAccidents: number;
        recentAccidents: ({
            governorate: {
                id: number;
                nameAr: string;
                code: string;
            };
            cause: {
                id: number;
                nameAr: string;
                code: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            governorateId: number;
            accidentDate: Date;
            accidentTime: string;
            cityId: number | null;
            route: string | null;
            kilometrePoint: import("@prisma/client/runtime/library").Decimal | null;
            causeId: number;
            vehicleBrand1Id: number | null;
            vehicleBrand2Id: number | null;
            deathsCount: number;
            injuriesCount: number;
            description: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            importJobId: string | null;
            createdById: string;
            deletedAt: Date | null;
        })[];
    }>;
    getByGovernorate(): Promise<{
        governorateId: number;
        governorateName: string;
        accidentCount: number;
        deathsCount: number;
        injuriesCount: number;
    }[]>;
    getByCause(): Promise<{
        causeId: number;
        causeName: string;
        accidentCount: number;
        deathsCount: number;
        injuriesCount: number;
    }[]>;
    getByBrand(): Promise<{
        brandId: number;
        brandName: string;
        accidentCount: number;
        deathsCount: number;
        injuriesCount: number;
    }[]>;
    getByMonth(): Promise<{
        month: string;
        accidentCount: number;
        deathsCount: number;
        injuriesCount: number;
    }[]>;
    getByHour(): Promise<{
        hour: number;
        count: number;
    }[]>;
    getTopRoutes(limit?: number): Promise<{
        route: string;
        accidentCount: number;
        deathsCount: number;
        injuriesCount: number;
    }[]>;
    getInsights(): Promise<{
        summary: {
            totalAccidents: number;
            totalDeaths: number;
            totalInjuries: number;
            monthlyAccidents: number;
            recentAccidents: ({
                governorate: {
                    id: number;
                    nameAr: string;
                    code: string;
                };
                cause: {
                    id: number;
                    nameAr: string;
                    code: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                governorateId: number;
                accidentDate: Date;
                accidentTime: string;
                cityId: number | null;
                route: string | null;
                kilometrePoint: import("@prisma/client/runtime/library").Decimal | null;
                causeId: number;
                vehicleBrand1Id: number | null;
                vehicleBrand2Id: number | null;
                deathsCount: number;
                injuriesCount: number;
                description: string | null;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                importJobId: string | null;
                createdById: string;
                deletedAt: Date | null;
            })[];
        };
        insights: ({
            key: string;
            title: string;
            value: string;
            count: number;
        } | {
            key: string;
            title: string;
            value: string;
            count?: undefined;
        })[];
        charts: {
            byGov: {
                governorateId: number;
                governorateName: string;
                accidentCount: number;
                deathsCount: number;
                injuriesCount: number;
            }[];
            byCause: {
                causeId: number;
                causeName: string;
                accidentCount: number;
                deathsCount: number;
                injuriesCount: number;
            }[];
            byMonth: {
                month: string;
                accidentCount: number;
                deathsCount: number;
                injuriesCount: number;
            }[];
            byHour: {
                hour: number;
                count: number;
            }[];
            topRoutes: {
                route: string;
                accidentCount: number;
                deathsCount: number;
                injuriesCount: number;
            }[];
        };
    }>;
    getIntelligence(dateFrom?: string, dateTo?: string, governorateId?: string): Promise<{
        period: {
            start: string;
            end: string;
            label: string;
        };
        comparison: {
            accidents: {
                current: number;
                previous: number;
                change: number | null;
            };
            deaths: {
                current: number;
                previous: number;
                change: number | null;
            };
            injuries: {
                current: number;
                previous: number;
                change: number | null;
            };
            lethalityRate: {
                current: number;
                previous: number;
                change: number | null;
            };
        };
        anomalies: any[];
        timeSlotAnalysis: {
            slot: string;
            label: string;
            count: number;
            deaths: number;
            deathRate: number;
            pct: number;
        }[];
        weekdayAnalysis: {
            day: string;
            count: any;
            deaths: any;
            deathRate: number;
            pct: number;
        }[];
        causeLethality: {
            causeId: number;
            causeName: string;
            count: number;
            deaths: number;
            injuries: number;
            deathRate: number;
            deathPct: number;
        }[];
        monthlyTrend: {
            month: string;
            label: string;
            count: number;
            deaths: number;
        }[];
        recommendations: any[];
        totalAnalyzed: number;
    }>;
}
