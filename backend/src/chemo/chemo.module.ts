// Module declaration for Chemotherapy Oncology Precision Dosing Engine
import { ChemoService } from './chemo.service';
import { ChemoController } from './chemo.controller';

export class ChemoModule {
  public static readonly service = ChemoService.getInstance();
  public static readonly controller = new ChemoController();
}
