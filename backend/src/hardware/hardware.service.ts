import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';

@Injectable()
export class HardwareService {
  private readonly logger = new Logger(HardwareService.name);

  async printToNetworkPrinter(
    ip: string,
    port: number,
    data: number[],
    timeoutMs = 5000,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      client.setTimeout(timeoutMs);

      let isSettled = false;
      const finish = (err?: Error) => {
        if (isSettled) return;
        isSettled = true;
        if (err) {
          try {
            client.destroy();
          } catch {
            // ignore
          }
          reject(err);
        } else {
          resolve();
        }
      };

      client.connect(port, ip, () => {
        const buffer = Buffer.from(data);
        client.write(buffer, (err) => {
          if (err) {
            finish(err);
          } else {
            client.end();
          }
        });
      });

      client.on('close', () => {
        finish();
      });

      client.on('error', (err) => {
        this.logger.warn(`Network printer error [${ip}:${port}]: ${err.message}`);
        finish(err);
      });

      client.on('timeout', () => {
        finish(new Error(`Printer connection timeout after ${timeoutMs}ms on ${ip}:${port}`));
      });
    });
  }

  async testNetworkPrinter(
    ip: string,
    port: number,
    timeoutMs = 3000,
  ): Promise<{ success: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      // ESC/POS DLE EOT 1 (0x10, 0x04, 0x01) - real-time printer status transmission (non-printing inquiry)
      await this.printToNetworkPrinter(ip, port, [0x10, 0x04, 0x01], timeoutMs);
      return { success: true, latencyMs: Date.now() - start };
    } catch {
      return { success: false, latencyMs: Date.now() - start };
    }
  }

  buildDrawerPulse(pin: 2 | 5 = 2): number[] {
    // ESC p m t1 t2
    // m = 0 for pin 2 (connector pin 2), m = 1 for pin 5 (connector pin 5)
    // t1 = 25 (50ms pulse on), t2 = 250 (500ms pulse off)
    const m = pin === 5 ? 0x01 : 0x00;
    return [0x1b, 0x70, m, 0x19, 0xfa];
  }
}
