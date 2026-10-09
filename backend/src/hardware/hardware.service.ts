import { Injectable } from '@nestjs/common';
import * as net from 'net';

@Injectable()
export class HardwareService {
  async printToNetworkPrinter(ip: string, port: number, data: number[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      client.setTimeout(5000);

      client.connect(port, ip, () => {
        client.write(Buffer.from(data), (err) => {
          if (err) {
            client.destroy();
            reject(err);
          } else {
            client.end();
            resolve();
          }
        });
      });

      client.on('error', (err) => {
        client.destroy();
        reject(err);
      });

      client.on('timeout', () => {
        client.destroy();
        reject(new Error('Printer connection timeout after 5000ms'));
      });
    });
  }

  async testNetworkPrinter(
    ip: string,
    port: number,
  ): Promise<{ success: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      // ESC/POS DLE EOT 1 - status inquiry (non-printing, safe probe)
      await this.printToNetworkPrinter(ip, port, [0x10, 0x04, 0x01]);
      return { success: true, latencyMs: Date.now() - start };
    } catch {
      return { success: false, latencyMs: Date.now() - start };
    }
  }

  buildDrawerPulse(): number[] {
    // ESC p 0 25 250 - open cash drawer on pin 2
    return [0x1b, 0x70, 0x00, 0x19, 0xfa];
  }
}
