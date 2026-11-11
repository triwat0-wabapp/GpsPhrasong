/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'records.json');

// Ensure data folder and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readRecordsFromDisk(): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading records file:', err);
  }
  return [];
}

function writeRecordsToDisk(records: any[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing records file:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // REST API Routes (NO LOGIN REQUIRED)
  // 1. Get all survey records
  app.get('/api/records', (req: Request, res: Response) => {
    const records = readRecordsFromDisk();
    res.json({ success: true, count: records.length, records });
  });

  // 2. Save / Add or Update record
  app.post('/api/records', (req: Request, res: Response) => {
    try {
      const record = req.body;
      if (!record || !record.id) {
        return res.status(400).json({ error: 'รหัสอ้างอิง (ID) จำเป็นต้องมี' });
      }

      const records = readRecordsFromDisk();
      const existingIdx = records.findIndex((r: any) => r.id === record.id);

      if (existingIdx >= 0) {
        records[existingIdx] = record;
      } else {
        records.unshift(record);
      }

      writeRecordsToDisk(records);
      res.json({ success: true, message: 'บันทึกข้อมูลเรียบร้อยแล้ว', record });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'บันทึกข้อมูลไม่สำเร็จ' });
    }
  });

  // 3. Batch import or replace records
  app.post('/api/records/batch', (req: Request, res: Response) => {
    try {
      const { records, mode } = req.body; // mode: 'append' | 'replace'
      if (!Array.isArray(records)) {
        return res.status(400).json({ error: 'ข้อมูลต้องเป็นอาร์เรย์' });
      }

      let current = readRecordsFromDisk();
      if (mode === 'replace') {
        current = records;
      } else {
        // Merge without duplicates
        const map = new Map();
        records.forEach((r: any) => map.set(r.id, r));
        current.forEach((r: any) => {
          if (!map.has(r.id)) map.set(r.id, r);
        });
        current = Array.from(map.values());
      }

      writeRecordsToDisk(current);
      res.json({ success: true, count: current.length, records: current });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'นำเข้าข้อมูลไม่สำเร็จ' });
    }
  });

  // 4. Delete record
  app.delete('/api/records/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const records = readRecordsFromDisk();
      const filtered = records.filter((r: any) => r.id !== id);
      writeRecordsToDisk(filtered);
      res.json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'ลบข้อมูลไม่สำเร็จ' });
    }
  });

  // 5. Proxy relay to Google Apps Script Webhook (Zero Login Google Sheet Sync)
  app.post('/api/sync-webhook', async (req: Request, res: Response) => {
    try {
      const { webhookUrl, records } = req.body;
      if (!webhookUrl) {
        return res.status(400).json({ error: 'กรุณาระบุ Webhook URL' });
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'syncRecords',
          records,
          timestamp: new Date().toISOString(),
        }),
      });

      const text = await response.text();
      res.json({ success: true, raw: text });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'ไม่สามารถส่งข้อมูลไปยัง Webhook ได้' });
    }
  });

  // Development vs Production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
