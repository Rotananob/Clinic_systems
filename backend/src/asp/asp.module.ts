// Module declaration for Antimicrobial Stewardship Program (ASP) Engine
import { AspService } from './asp.service.ts';
import { AspController } from './asp.controller.ts';

export class AspModule {
  public static readonly service = AspService.getInstance();
  public static readonly controller = new AspController();
}
