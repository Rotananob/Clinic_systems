// Module declaration for Pediatric & Neonatal Pharmacotherapy Engine
import { PediatricService } from './pediatric.service.ts';
import { PediatricController } from './pediatric.controller.ts';

export class PediatricModule {
  public static readonly service = PediatricService.getInstance();
  public static readonly controller = new PediatricController();
}
