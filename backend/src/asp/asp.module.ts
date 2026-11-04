// Module declaration for Antimicrobial Stewardship Program (ASP) Engine
import { AspService } from './asp.service';
import { AspController } from './asp.controller';

export class AspModule {
  public static readonly service = AspService.getInstance();
  public static readonly controller = new AspController();
}
