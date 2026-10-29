import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as zlib from 'zlib';
import { Readable } from 'stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const dist = path.join(root, 'dist');

if (!fs.existsSync(dist)) {
  console.error('dist/ not found. Run npm run build first.');
  process.exit(1);
}

const zipPath = path.join(root, 'echoes-factory.zip');
const files = [];

const collectFiles = (dir) => {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      collectFiles(fullPath);
    } else {
      const relativePath = path.relative(dist, fullPath);
      files.push({ path: fullPath, zipPath: relativePath });
    }
  }
};

collectFiles(dist);

// Simple ZIP creation using zlib
const zip = zlib.createGzip();
const filesData = [];

for (const file of files) {
  const data = fs.readFileSync(file.path);
  filesData.push({ ...file, data });
}

// Use a simple approach with adm-zip or manual zip
// For simplicity, let's use a basic zip structure
const zipEntries = [];
for (const file of filesData) {
  zipEntries.push(createZipEntry(file.zipPath, file.data));
}

const zipData = createZipArchive(zipEntries);
fs.writeFileSync(zipPath, zipData);
console.log(`Zip created: ${zipPath} (${(zipData.length / 1024).toFixed(1)} KB)`);

function createZipEntry(name, data) {
  const nameBytes = Buffer.from(name, 'utf-8');
  const crc = crc32(data);
  const header = Buffer.alloc(30 + nameBytes.length);
  
  header.writeUInt32LE(0x02014b50, 0); // Local file header signature
  header.writeUInt16LE(20, 4); // Version needed
  header.writeUInt16LE(0, 6); // Flags
  header.writeUInt16LE(0, 8); // Compression (store)
  header.writeUInt16LE(0, 10); // Time
  header.writeUInt16LE(0, 12); // Date
  header.writeUInt32LE(crc, 14); // CRC-32
  header.writeUInt32LE(data.length, 18); // Compressed size
  header.writeUInt32LE(data.length, 22); // Uncompressed size
  header.writeUInt16LE(nameBytes.length, 26); // Name length
  header.writeUInt16LE(0, 28); // Extra length
  header.set(nameBytes, 30);
  
  return { header, data, name };
}

function createZipArchive(entries) {
  const parts = [];
  const centralDir = [];
  
  for (const entry of entries) {
    parts.push(entry.header);
    parts.push(entry.data);
    centralDir.push(createCentralDirEntry(entry));
  }
  
  const centralDirData = Buffer.concat(centralDir);
  const offset = Buffer.concat(parts).length;
  
  const endOfCentralDir = Buffer.alloc(22);
  endOfCentralDir.writeUInt32LE(0x06054b50, 0); // End of central dir signature
  endOfCentralDir.writeUInt16LE(0, 4); // Number of disks
  endOfCentralDir.writeUInt16LE(0, 6); // Disk with central dir
  endOfCentralDir.writeUInt16LE(entries.length, 8); // Entries on disk
  endOfCentralDir.writeUInt16LE(entries.length, 10); // Total entries
  endOfCentralDir.writeUInt32LE(centralDirData.length, 12); // Central dir size
  endOfCentralDir.writeUInt32LE(offset, 16); // Offset to central dir
  endOfCentralDir.writeUInt16LE(0, 20); // Comment length
  
  return Buffer.concat([...parts, centralDirData, endOfCentralDir]);
}

function createCentralDirEntry(entry) {
  const nameBytes = Buffer.from(entry.name, 'utf-8');
  const header = Buffer.alloc(46 + nameBytes.length);
  
  header.writeUInt32LE(0x02014b50, 0); // Central file header signature
  header.writeUInt16LE(20, 4); // Version made by
  header.writeUInt16LE(20, 6); // Version needed
  header.writeUInt16LE(0, 8); // Flags
  header.writeUInt16LE(0, 10); // Compression
  header.writeUInt16LE(0, 12); // Time
  header.writeUInt16LE(0, 14); // Date
  header.writeUInt32LE(entry.header.readUInt32LE(14), 16); // CRC-32
  header.writeUInt32LE(entry.data.length, 20); // Compressed size
  header.writeUInt32LE(entry.data.length, 24); // Uncompressed size
  header.writeUInt16LE(nameBytes.length, 28); // Name length
  header.writeUInt16LE(0, 30); // Extra length
  header.writeUInt16LE(0, 32); // Comment length
  header.writeUInt16LE(0, 34); // Disk start
  header.writeUInt16LE(0, 36); // Internal attr
  header.writeUInt32LE(0, 38); // External attr
  header.writeUInt32LE(0, 42); // Offset
  header.set(nameBytes, 46);
  
  return header;
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
