import { VehicleBrandsService } from './vehicle-brands.service';
export declare class VehicleBrandsController {
    private vehicleBrandsService;
    constructor(vehicleBrandsService: VehicleBrandsService);
    findAll(): Promise<{
        id: number;
        nameAr: string;
        nameEn: string;
    }[]>;
    create(nameAr: string): Promise<{
        id: number;
        nameAr: string;
        nameEn: string;
    }>;
}
