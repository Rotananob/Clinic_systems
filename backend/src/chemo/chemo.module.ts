// Module declaration for Chemotherapy Oncology Precision Dosing Engine
import { ChemoService } from './chemo.service.ts';
import { ChemoController } from './chemo.controller.ts';

export class ChemoModule {
  public static readonly service = ChemoService.getInstance();
  public static readonly controller = new ChemoController();
}
