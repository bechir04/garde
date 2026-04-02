export declare class CreateAccidentDto {
    accidentDate: string;
    accidentTime: string;
    governorateId: number;
    cityId?: number;
    route?: string;
    kilometrePoint?: number;
    causeId: number;
    vehicleBrand1Id?: number;
    vehicleBrand2Id?: number;
    deathsCount: number;
    injuriesCount: number;
    description?: string;
}
export declare class UpdateAccidentDto {
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
}
export declare class AccidentQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    governorateId?: number;
    causeId?: number;
    brandId?: number;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
