// Nest module declaration for Emergency Sepsis & Trauma Resuscitation Protocol Engine
// Conforms to Node.js 24 type stripping

import { ResuscitationService } from './resuscitation.service';
import { ResuscitationController } from './resuscitation.controller';

export class ResuscitationModule {
  public static getProviders() {
    return [ResuscitationService];
  }

  public static getControllers() {
    return [ResuscitationController];
  }
}
