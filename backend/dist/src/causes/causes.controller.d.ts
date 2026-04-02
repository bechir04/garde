import { CausesService } from './causes.service';
export declare class CausesController {
    private causesService;
    constructor(causesService: CausesService);
    findAll(): Promise<{
        id: number;
        nameAr: string;
        code: string;
    }[]>;
    create(nameAr: string): Promise<{
        id: number;
        nameAr: string;
        code: string;
    }>;
}
