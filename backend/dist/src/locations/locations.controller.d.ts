import { LocationsService } from './locations.service';
export declare class LocationsController {
    private locationsService;
    constructor(locationsService: LocationsService);
    findAllGovernorates(): Promise<{
        id: number;
        nameAr: string;
        code: string;
    }[]>;
    findCities(governorateId: number): Promise<{
        id: number;
        nameAr: string;
        governorateId: number;
    }[]>;
}
