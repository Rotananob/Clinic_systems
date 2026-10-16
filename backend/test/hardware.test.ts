import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import * as net from 'node:net';

export class HardwareEngine {
  buildDrawerPulse(pin: 2 | 5 = 2): number[] {
    const m = pin === 5 ? 0x01 : 0x00;
    return [0x1b, 0x70, m, 0x19, 0xfa];
  }

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
        finish(err);
      });

      client.on('timeout', () => {
        finish(new Error(`Timeout after ${timeoutMs}ms`));
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
      await this.printToNetworkPrinter(ip, port, [0x10, 0x04, 0x01], timeoutMs);
      return { success: true, latencyMs: Date.now() - start };
    } catch {
      return { success: false, latencyMs: Date.now() - start };
    }
  }
}

describe('Hardware Peripherals & ESC/POS TCP Engine Test Suite', () => {
  const engine = new HardwareEngine();

  test('should construct standard ESC/POS cash drawer pulses for Pin 2 and Pin 5', () => {
    const pulsePin2 = engine.buildDrawerPulse(2);
    assert.deepStrictEqual(pulsePin2, [0x1b, 0x70, 0x00, 0x19, 0xfa]);

    const pulsePin5 = engine.buildDrawerPulse(5);
    assert.deepStrictEqual(pulsePin5, [0x1b, 0x70, 0x01, 0x19, 0xfa]);
  });

  test('should handle unreachable network printer gracefully with timeout', async () => {
    const result = await engine.testNetworkPrinter('127.0.0.1', 65432, 200);
    assert.strictEqual(result.success, false);
    assert.ok(result.latencyMs >= 0);
  });

  test('should successfully transmit ESC/POS byte streams to a real TCP socket server', async () => {
    const receivedChunks: Buffer[] = [];

    const server = net.createServer((socket) => {
      socket.on('data', (chunk) => {
        receivedChunks.push(chunk);
      });
      socket.on('end', () => {
        socket.end();
      });
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as net.AddressInfo).port;

    try {
      const mockPrintData = [0x1b, 0x40, 0x48, 0x45, 0x4c, 0x4c, 0x4f, 0x0a, 0x1d, 0x56, 0x00];
      await engine.printToNetworkPrinter('127.0.0.1', port, mockPrintData, 2000);

      const totalBuffer = Buffer.concat(receivedChunks);
      assert.deepStrictEqual(Array.from(totalBuffer), mockPrintData);

      const testResult = await engine.testNetworkPrinter('127.0.0.1', port, 2000);
      assert.strictEqual(testResult.success, true);
      assert.ok(testResult.latencyMs >= 0 && testResult.latencyMs < 2000);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  test('should withstand high-frequency burst print transmissions without socket leakage', async () => {
    let connectionCount = 0;
    const server = net.createServer((socket) => {
      connectionCount++;
      socket.on('data', () => {});
      socket.on('end', () => socket.end());
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as net.AddressInfo).port;

    try {
      const payload = [0x10, 0x04, 0x01];
      const promises = Array.from({ length: 15 }, () =>
        engine.printToNetworkPrinter('127.0.0.1', port, payload, 3000),
      );

      await Promise.all(promises);
      assert.strictEqual(connectionCount, 15);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
