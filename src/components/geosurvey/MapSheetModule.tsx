import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Map, Search, ArrowRight, HelpCircle, RefreshCw, Layers, MapPin, Minimize2, Maximize2 } from 'lucide-react';
import VN2000MapViewer from './VN2000MapViewer';

// Vietnam boundary check
const VN_LAT_MIN = 8.0;
const VN_LAT_MAX = 24.0;
const VN_LON_MIN = 102.0;
const VN_LON_MAX = 110.0;

const sortedLetters = "ABCDEFGHJKLMNOPQRSTUVXYZ"; // skips I and O

function bandLetterToNum(letter: string): number {
  const idx = sortedLetters.indexOf(letter.toUpperCase());
  return idx >= 0 ? idx : letter.toUpperCase().charCodeAt(0) - 65;
}

function numToBandLetter(num: number): string {
  return sortedLetters[num] || String.fromCharCode(65 + num);
}

interface MapCorner {
  lat: number;
  lon: number;
  label: string;
}

interface MapSheetResult {
  scale: string;
  name: string;
  utmEquivalent?: string;
  bounds: {
    latMin: number;
    latMax: number;
    lonMin: number;
    lonMax: number;
  };
  center: {
    lat: number;
    lon: number;
  };
  details: string[];
}

export default function MapSheetModule() {
  const [direction, setDirection] = useState<'coord_to_sheet' | 'sheet_to_coord'>('coord_to_sheet');
  const [latInput, setLatInput] = useState<string>('10.353427');
  const [lonInput, setLonInput] = useState<string>('106.547216');
  const [sheetNameInput, setSheetNameInput] = useState<string>('6329');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [selectedScaleIndex, setSelectedScaleIndex] = useState<number>(3); // Default 1:100.000
  const [scaleMode, setScaleMode] = useState<'true_scale' | 'fit_window'>('true_scale');
  const [activeTab, setActiveTab] = useState<'info' | 'map'>('info');

  // 1. GPS to Map Sheet converter
  const convertCoordToSheets = (latVal: number, lonVal: number) => {
    try {
      const sheets: MapSheetResult[] = [];

      // Zone & Band calculation
      const zone = Math.floor((lonVal + 180) / 6) + 1;
      const centralMeridian = zone * 6 - 183;
      const leftBoundary = zone * 6 - 186;
      const rightBoundary = zone * 6 - 180;

      const bandNum = Math.floor(latVal / 4);
      const bandLetter = numToBandLetter(bandNum);

      const baseLat1M = bandNum * 4;
      const baseLon1M = (zone - 1) * 6 - 180;

      const sheet1M_Name = `${bandLetter}-${zone}`;
      const utm1M = `N${bandLetter}-${zone}`;

      // 1. Scale 1:1.000.000
      const bounds1M = {
        latMin: baseLat1M,
        latMax: baseLat1M + 4,
        lonMin: baseLon1M,
        lonMax: baseLon1M + 6
      };
      sheets.push({
        scale: '1:1.000.000',
        name: sheet1M_Name,
        utmEquivalent: utm1M,
        bounds: bounds1M,
        center: {
          lat: baseLat1M + 2,
          lon: baseLon1M + 3
        },
        details: [
          `Múi chiếu UTM (6°): Múi ${zone} (Kinh tuyến trục ${centralMeridian}°Đ)`,
          `Vành đai vĩ độ (4°): ${bandLetter} (${baseLat1M}°N - ${baseLat1M + 4}°N)`,
          `Tọa độ biên giới hạn mảnh: B: ${bounds1M.latMin}° đến ${bounds1M.latMax}°, L: ${bounds1M.lonMin}° đến ${bounds1M.lonMax}°`
        ]
      });

      // 2. Scale 1:500.000 (Quadrant division: A, B, C, D in VN-2000, A, B, D, C in UTM)
      const latHalf1M = baseLat1M + 2;
      const lonHalf1M = baseLon1M + 3;
      let q500k_VN = '';
      let q500k_UTM = '';
      let bounds500k = { latMin: 0, latMax: 0, lonMin: 0, lonMax: 0 };
      if (latVal >= latHalf1M) {
        if (lonVal < lonHalf1M) {
          q500k_VN = 'A';
          q500k_UTM = 'A';
          bounds500k = { latMin: latHalf1M, latMax: baseLat1M + 4, lonMin: baseLon1M, lonMax: lonHalf1M };
        } else {
          q500k_VN = 'B';
          q500k_UTM = 'B';
          bounds500k = { latMin: latHalf1M, latMax: baseLat1M + 4, lonMin: lonHalf1M, lonMax: baseLon1M + 6 };
        }
      } else {
        if (lonVal < lonHalf1M) {
          q500k_VN = 'C';
          q500k_UTM = 'D';
          bounds500k = { latMin: baseLat1M, latMax: latHalf1M, lonMin: baseLon1M, lonMax: lonHalf1M };
        } else {
          q500k_VN = 'D';
          q500k_UTM = 'C';
          bounds500k = { latMin: baseLat1M, latMax: latHalf1M, lonMin: lonHalf1M, lonMax: baseLon1M + 6 };
        }
      }
      sheets.push({
        scale: '1:500.000',
        name: `${sheet1M_Name}-${q500k_VN}`,
        utmEquivalent: `N${sheet1M_Name}-${q500k_UTM}`,
        bounds: bounds500k,
        center: {
          lat: (bounds500k.latMin + bounds500k.latMax) / 2,
          lon: (bounds500k.lonMin + bounds500k.lonMax) / 2
        },
        details: [
          `Chia mảnh 1:1M thành 4 phần (kích thước 2° vĩ độ × 3° kinh độ)`,
          `Ký hiệu VN-2000: ${q500k_VN} (Chia hàng-cột)`,
          `Ký hiệu UTM quốc tế: ${q500k_UTM} (Chia theo chiều kim đồng hồ bắt đầu từ Tây Bắc)`,
          `Tọa độ giới hạn: B: ${bounds500k.latMin}° đến ${bounds500k.latMax}°, L: ${bounds500k.lonMin}° đến ${bounds500k.lonMax}°`
        ]
      });

      // 3. Scale 1:250.000
      // 1:1M sheet contains 16 sheets of 1:250k (each 1° x 1.5°), numbered row-major 1 to 16
      const row250k = 3 - Math.floor((latVal - baseLat1M) / 1);
      const col250k = Math.floor((lonVal - baseLon1M) / 1.5);
      const idx1M_16 = row250k * 4 + col250k + 1;
      
      const bounds250k = {
        latMin: baseLat1M + (3 - row250k),
        latMax: baseLat1M + (4 - row250k),
        lonMin: baseLon1M + col250k * 1.5,
        lonMax: baseLon1M + (col250k + 1) * 1.5
      };

      const qRow = Math.floor(row250k / 2);
      const qCol = Math.floor(col250k / 2);
      const q500k_VN_from_comp = qRow === 0 ? (qCol === 0 ? 'A' : 'B') : (qCol === 0 ? 'C' : 'D');

      const subRow = row250k % 2;
      const subCol = col250k % 2;
      const idx250k_sub = subRow * 2 + subCol + 1;

      sheets.push({
        scale: '1:250.000',
        name: `${sheet1M_Name}-${q500k_VN_from_comp}-${idx250k_sub}`,
        utmEquivalent: `N${sheet1M_Name}-${idx1M_16}`,
        bounds: bounds250k,
        center: {
          lat: (bounds250k.latMin + bounds250k.latMax) / 2,
          lon: (bounds250k.lonMin + bounds250k.lonMax) / 2
        },
        details: [
          `Mảnh 1:1000.000 chia làm 16 mảnh 1:250.000 (kích thước 1° vĩ độ × 1.5° kinh độ)`,
          `Mảnh VN-2000: số hiệu mảnh con ${idx250k_sub} của mảnh 1:500k mẹ ${sheet1M_Name}-${q500k_VN_from_comp}`,
          `Mảnh UTM quốc tế: mảnh con thứ ${idx1M_16} (Hàng ${row250k + 1}, Cột ${col250k + 1})`,
          `Tọa độ giới hạn: B: ${bounds250k.latMin}° đến ${bounds250k.latMax}°, L: ${bounds250k.lonMin}° đến ${bounds250k.lonMax}°`
        ]
      });

      // 4. Scale 1:100.000
      // Under VN-2000 local indexing: F-48-68
      const rowWithin1M = 7 - Math.floor((latVal - baseLat1M) / 0.5);
      const colWithin1M = Math.floor((lonVal - baseLon1M) / 0.5);
      const idx100k_local = rowWithin1M * 12 + colWithin1M + 1;

      // UTM equivalent: 6151
      const col100k = Math.floor(2 * (lonVal - 75));
      const row100k = Math.floor(2 * (latVal + 4)) + 1;
      const sheet100k_Code = `${col100k.toString().padStart(2, '0')}${row100k.toString().padStart(2, '0')}`;

      const bounds100k = {
        latMin: baseLat1M + (7 - rowWithin1M) * 0.5,
        latMax: baseLat1M + (8 - rowWithin1M) * 0.5,
        lonMin: baseLon1M + colWithin1M * 0.5,
        lonMax: baseLon1M + (colWithin1M + 1) * 0.5
      };

      const sheet100k_VN_Name = `${sheet1M_Name}-${idx100k_local}`;

      sheets.push({
        scale: '1:100.000',
        name: sheet100k_VN_Name,
        utmEquivalent: `(${sheet100k_Code})`,
        bounds: bounds100k,
        center: {
          lat: (bounds100k.latMin + bounds100k.latMax) / 2,
          lon: (bounds100k.lonMin + bounds100k.lonMax) / 2
        },
        details: [
          `Phiên hiệu VN-2000 cục bộ: ${sheet100k_VN_Name} (Mảnh số ${idx100k_local} trong mảnh mẹ 1:1M, Hàng ${rowWithin1M + 1}, Cột ${colWithin1M + 1})`,
          `Số hiệu danh pháp UTM/VN2000 quốc gia: (${sheet100k_Code})`,
          `Múi cột ĐNA = floor(2 × (L - 75)) = ${col100k}`,
          `Hàng vĩ độ ĐNA = floor(2 × (B + 4)) + 1 = ${row100k}`,
          `Kích thước mảnh địa hình tiêu chuẩn: 30' vĩ độ × 30' kinh độ`,
          `Tọa độ giới hạn biên: B: ${bounds100k.latMin.toFixed(6)}° - ${bounds100k.latMax.toFixed(6)}°, L: ${bounds100k.lonMin.toFixed(6)}° - ${bounds100k.lonMax.toFixed(6)}°`
        ]
      });

      // 5. Scale 1:50.000 (15' x 15')
      const latHalf100k = bounds100k.latMin + 0.25;
      const lonHalf100k = bounds100k.lonMin + 0.25;
      let q50k_VN = '';
      let q50k_UTM = '';
      let bounds50k = { latMin: 0, latMax: 0, lonMin: 0, lonMax: 0 };
      if (latVal >= latHalf100k) {
        if (lonVal < lonHalf100k) {
          q50k_VN = 'A';
          q50k_UTM = 'IV';
          bounds50k = { latMin: latHalf100k, latMax: bounds100k.latMax, lonMin: bounds100k.lonMin, lonMax: lonHalf100k };
        } else {
          q50k_VN = 'B';
          q50k_UTM = 'I';
          bounds50k = { latMin: latHalf100k, latMax: bounds100k.latMax, lonMin: lonHalf100k, lonMax: bounds100k.lonMax };
        }
      } else {
        if (lonVal < lonHalf100k) {
          q50k_VN = 'C';
          q50k_UTM = 'III';
          bounds50k = { latMin: bounds100k.latMin, latMax: latHalf100k, lonMin: bounds100k.lonMin, lonMax: lonHalf100k };
        } else {
          q50k_VN = 'D';
          q50k_UTM = 'II';
          bounds50k = { latMin: bounds100k.latMin, latMax: latHalf100k, lonMin: lonHalf100k, lonMax: bounds100k.lonMax };
        }
      }
      const sheet50k_Name = `${sheet100k_VN_Name}-${q50k_VN}`;
      sheets.push({
        scale: '1:50.000',
        name: sheet50k_Name,
        utmEquivalent: `${sheet100k_Code}-${q50k_UTM}`,
        bounds: bounds50k,
        center: {
          lat: (bounds50k.latMin + bounds50k.latMax) / 2,
          lon: (bounds50k.lonMin + bounds50k.lonMax) / 2
        },
        details: [
          `Mảnh 1:100k chia làm 4 phần tỷ lệ 1:50k (Kích thước 15' × 15')`,
          `Phần tư VN-2000: ${q50k_VN} (Hàng-cột: A=NW, B=NE, C=SW, D=SE)`,
          `Phần tư UTM quốc tế: ${q50k_UTM} (Chia theo chiều kim đồng hồ từ góc Đông - Bắc: I=NE, II=SE, III=SW, IV=NW)`,
          `Tọa độ giới hạn: B: ${bounds50k.latMin.toFixed(6)}° - ${bounds50k.latMax.toFixed(6)}°, L: ${bounds50k.lonMin.toFixed(6)}° - ${bounds50k.lonMax.toFixed(6)}°`
        ]
      });

      // 6. Scale 1:25.000 (7'30" x 7'30" = 0.125° x 0.125°) - divided from 1:50.000 into 4 parts: a, b, c, d
      const latHalf50k = bounds50k.latMin + 0.125;
      const lonHalf50k = bounds50k.lonMin + 0.125;
      let q25k = '';
      let bounds25k = { latMin: 0, latMax: 0, lonMin: 0, lonMax: 0 };
      if (latVal >= latHalf50k) {
        if (lonVal < lonHalf50k) {
          q25k = 'a';
          bounds25k = { latMin: latHalf50k, latMax: bounds50k.latMax, lonMin: bounds50k.lonMin, lonMax: lonHalf50k };
        } else {
          q25k = 'b';
          bounds25k = { latMin: latHalf50k, latMax: bounds50k.latMax, lonMin: lonHalf50k, lonMax: bounds50k.lonMax };
        }
      } else {
        if (lonVal < lonHalf50k) {
          q25k = 'c';
          bounds25k = { latMin: bounds50k.latMin, latMax: latHalf50k, lonMin: bounds50k.lonMin, lonMax: lonHalf50k };
        } else {
          q25k = 'd';
          bounds25k = { latMin: bounds50k.latMin, latMax: latHalf50k, lonMin: lonHalf50k, lonMax: bounds50k.lonMax };
        }
      }
      const sheet25k_Name = `${sheet50k_Name}-${q25k}`;
      sheets.push({
        scale: '1:25.000',
        name: sheet25k_Name,
        utmEquivalent: 'UTM không chia mảnh 1:25k',
        bounds: bounds25k,
        center: {
          lat: (bounds25k.latMin + bounds25k.latMax) / 2,
          lon: (bounds25k.lonMin + bounds25k.lonMax) / 2
        },
        details: [
          `Mảnh 1:50k chia làm 4 phần tỷ lệ 1:25k (Chữ cái in thường a, b, c, d)`,
          `Phần tư vị trí: ${q25k} (a=NW, b=NE, c=SW, d=SE)`,
          `Kích thước mảnh địa hình: 7'30" × 7'30"`,
          `Tọa độ giới hạn: B: ${bounds25k.latMin.toFixed(6)}° - ${bounds25k.latMax.toFixed(6)}°, L: ${bounds25k.lonMin.toFixed(6)}° - ${bounds25k.lonMax.toFixed(6)}°`
        ]
      });

      // 7. Scale 1:10.000 (3'45" x 3'45" = 0.0625° x 0.0625°) - split from 1:25.000 into 4 parts: 1, 2, 3, 4
      const latHalf25k = bounds25k.latMin + 0.0625;
      const lonHalf25k = bounds25k.lonMin + 0.0625;
      let q10k = '';
      let bounds10k = { latMin: 0, latMax: 0, lonMin: 0, lonMax: 0 };
      if (latVal >= latHalf25k) {
        if (lonVal < lonHalf25k) {
          q10k = '1';
          bounds10k = { latMin: latHalf25k, latMax: bounds25k.latMax, lonMin: bounds25k.lonMin, lonMax: lonHalf25k };
        } else {
          q10k = '2';
          bounds10k = { latMin: latHalf25k, latMax: bounds25k.latMax, lonMin: lonHalf25k, lonMax: bounds25k.lonMax };
        }
      } else {
        if (lonVal < lonHalf25k) {
          q10k = '3';
          bounds10k = { latMin: bounds25k.latMin, latMax: latHalf25k, lonMin: bounds25k.lonMin, lonMax: lonHalf25k };
        } else {
          q10k = '4';
          bounds10k = { latMin: bounds25k.latMin, latMax: latHalf25k, lonMin: lonHalf25k, lonMax: bounds25k.lonMax };
        }
      }
      const sheet10k_Name = `${sheet25k_Name}-${q10k}`;
      sheets.push({
        scale: '1:10.000',
        name: sheet10k_Name,
        utmEquivalent: 'UTM không chia mảnh 1:10k',
        bounds: bounds10k,
        center: {
          lat: (bounds10k.latMin + bounds10k.latMax) / 2,
          lon: (bounds10k.lonMin + bounds10k.lonMax) / 2
        },
        details: [
          `Mảnh 1:25k chia làm 4 phần tỷ lệ 1:10k (Chữ số 1, 2, 3, 4)`,
          `Phần tư vị trí mảnh: ${q10k} (1=NW, 2=NE, 3=SW, 4=SE)`,
          `Kích thước mảnh địa hình: 3'45" × 3'45"`,
          `Tọa độ giới hạn: B: ${bounds10k.latMin.toFixed(6)}° - ${bounds10k.latMax.toFixed(6)}°, L: ${bounds10k.lonMin.toFixed(6)}° - ${bounds10k.lonMax.toFixed(6)}°`
        ]
      });

      // 8. Scale 1:5.000 (1'52.5" x 1'52.5" = 0.03125° x 0.03125°) - directly divided from 1:100.000 into 256 parts
      // Labeled (1) to (256) inside parenthesis
      const row5k = 15 - Math.floor((latVal - bounds100k.latMin) / 0.03125);
      const col5k = Math.floor((lonVal - bounds100k.lonMin) / 0.03125);
      const idx5k = row5k * 16 + col5k + 1;
      const bounds5k = {
        latMin: bounds100k.latMin + (15 - row5k) * 0.03125,
        latMax: bounds100k.latMin + (16 - row5k) * 0.03125,
        lonMin: bounds100k.lonMin + col5k * 0.03125,
        lonMax: bounds100k.lonMin + (col5k + 1) * 0.03125
      };
      const sheet5k_Name = `${sheet100k_VN_Name}-(${idx5k})`;
      sheets.push({
        scale: '1:5.000',
        name: sheet5k_Name,
        utmEquivalent: 'UTM không chia mảnh 1:5k',
        bounds: bounds5k,
        center: {
          lat: (bounds5k.latMin + bounds5k.latMax) / 2,
          lon: (bounds5k.lonMin + bounds5k.lonMax) / 2
        },
        details: [
          `Mảnh 1:100k được chia trực tiếp thành 256 phần tỷ lệ 1:5.000`,
          `Sắp xếp kiểu hàng-cột từ trái sang phải, từ trên xuống dưới`,
          `Số hiệu mảnh con: (${idx5k}) (Hàng ${row5k + 1}, Cột ${col5k + 1})`,
          `Kích thước mảnh: 1'52.5" × 1'52.5" (0.03125° × 0.03125°)`,
          `Tọa độ giới hạn: B: ${bounds5k.latMin.toFixed(6)}° - ${bounds5k.latMax.toFixed(6)}°, L: ${bounds5k.lonMin.toFixed(6)}° - ${bounds5k.lonMax.toFixed(6)}°`
        ]
      });

      // 9. Scale 1:2.000 (37.5" x 37.5" = 0.010416667° x 0.010416667°) - divided from 1:5.000 into 9 parts: a, b, c, d, e, f, g, h, k
      const row2k = 2 - Math.floor((latVal - bounds5k.latMin) / 0.010416667);
      const col2k = Math.floor((lonVal - bounds5k.lonMin) / 0.010416667);
      const idx2k = row2k * 3 + col2k;
      const alphabet2k = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'k'];
      const q2k = alphabet2k[idx2k] || 'a';
      const bounds2k = {
        latMin: bounds5k.latMin + (2 - row2k) * 0.010416667,
        latMax: bounds5k.latMin + (3 - row2k) * 0.010416667,
        lonMin: bounds5k.lonMin + col2k * 0.010416667,
        lonMax: bounds5k.lonMin + (col2k + 1) * 0.010416667
      };
      
      const sheet2k_Name = `${sheet100k_VN_Name}-(${idx5k}-${q2k})`;
      sheets.push({
        scale: '1:2.000',
        name: sheet2k_Name,
        utmEquivalent: 'UTM không chia mảnh 1:2k',
        bounds: bounds2k,
        center: {
          lat: (bounds2k.latMin + bounds2k.latMax) / 2,
          lon: (bounds2k.lonMin + bounds2k.lonMax) / 2
        },
        details: [
          `Mảnh 1:5k chia thành 9 phần tỷ lệ 1:2.000 (Sử dụng các chữ cái: a, b, c, d, e, f, g, h, k - bỏ qua i và j)`,
          `Phần tư vị trí mảnh: ${q2k} (Hàng ${row2k + 1}, Cột ${col2k + 1})`,
          `Kích thước mảnh: 37.5" × 37.5" (~0.01042° × ~0.01042°)`,
          `Tọa độ giới hạn: B: ${bounds2k.latMin.toFixed(6)}° - ${bounds2k.latMax.toFixed(6)}°, L: ${bounds2k.lonMin.toFixed(6)}° - ${bounds2k.lonMax.toFixed(6)}°`
        ]
      });

      // 10. Scale 1:1.000 (18.75" x 18.75" = 0.0052083333° x 0.0052083333°) - divided from 1:2.000 into 4 parts: I, II, III, IV
      const latHalf2k = bounds2k.latMin + 0.0052083333;
      const lonHalf2k = bounds2k.lonMin + 0.0052083333;
      let q1k = '';
      let bounds1k = { latMin: 0, latMax: 0, lonMin: 0, lonMax: 0 };
      if (latVal >= latHalf2k) {
        if (lonVal < lonHalf2k) {
          q1k = 'I';
          bounds1k = { latMin: latHalf2k, latMax: bounds2k.latMax, lonMin: bounds2k.lonMin, lonMax: lonHalf2k };
        } else {
          q1k = 'II';
          bounds1k = { latMin: latHalf2k, latMax: bounds2k.latMax, lonMin: lonHalf2k, lonMax: bounds2k.lonMax };
        }
      } else {
        if (lonVal < lonHalf2k) {
          q1k = 'III';
          bounds1k = { latMin: bounds2k.latMin, latMax: latHalf2k, lonMin: bounds2k.lonMin, lonMax: lonHalf2k };
        } else {
          q1k = 'IV';
          bounds1k = { latMin: bounds2k.latMin, latMax: latHalf2k, lonMin: lonHalf2k, lonMax: bounds2k.lonMax };
        }
      }
      const sheet1k_Name = `${sheet100k_VN_Name}-(${idx5k}-${q2k}-${q1k})`;
      sheets.push({
        scale: '1:1.000',
        name: sheet1k_Name,
        utmEquivalent: 'UTM không chia mảnh 1:1k',
        bounds: bounds1k,
        center: {
          lat: (bounds1k.latMin + bounds1k.latMax) / 2,
          lon: (bounds1k.lonMin + bounds1k.lonMax) / 2
        },
        details: [
          `Mảnh 1:2k chia thành 4 phần tỷ lệ 1:1.000 (Sử dụng chữ số La Mã: I, II, III, IV từ trái sang phải, trên xuống dưới)`,
          `Phần tư vị trí: ${q1k} (NW=I, NE=II, SW=III, SE=IV)`,
          `Kích thước mảnh: 18.75" × 18.75" (~0.00521° × ~0.00521°)`,
          `Tọa độ giới hạn: B: ${bounds1k.latMin.toFixed(6)}° - ${bounds1k.latMax.toFixed(6)}°, L: ${bounds1k.lonMin.toFixed(6)}° - ${bounds1k.lonMax.toFixed(6)}°`
        ]
      });

      // 11. Scale 1:500 (9.375" x 9.375" = 0.0026041667° x 0.0026041667°) - split from 1:2.000 into 16 parts: 1 to 16
      const row500 = 3 - Math.floor((latVal - bounds2k.latMin) / 0.0026041667);
      const col500 = Math.floor((lonVal - bounds2k.lonMin) / 0.0026041667);
      const idx500 = row500 * 4 + col500 + 1;
      const bounds500 = {
        latMin: bounds2k.latMin + (3 - row500) * 0.0026041667,
        latMax: bounds2k.latMin + (4 - row500) * 0.0026041667,
        lonMin: bounds2k.lonMin + col500 * 0.0026041667,
        lonMax: bounds2k.lonMin + (col500 + 1) * 0.0026041667
      };
      const sheet500_Name = `${sheet100k_VN_Name}-(${idx5k}-${q2k}-${idx500})`;
      sheets.push({
        scale: '1:500',
        name: sheet500_Name,
        utmEquivalent: 'UTM không chia mảnh 1:500',
        bounds: bounds500,
        center: {
          lat: (bounds500.latMin + bounds500.latMax) / 2,
          lon: (bounds500.lonMin + bounds500.lonMax) / 2
        },
        details: [
          `Mảnh 1:2k chia thành 16 phần tỷ lệ 1:500 (Sử dụng chữ số 1 đến 16 từ trái sang phải, trên xuống dưới)`,
          `Số hiệu mảnh con: ${idx500} (Hàng ${row500 + 1}, Cột ${col500 + 1})`,
          `Kích thước mảnh: 9.375" × 9.375" (~0.00260° × ~0.00260°)`,
          `Tọa độ giới hạn: B: ${bounds500.latMin.toFixed(6)}° - ${bounds500.latMax.toFixed(6)}°, L: ${bounds500.lonMin.toFixed(6)}° - ${bounds500.lonMax.toFixed(6)}°`
        ]
      });

      setResult({
        latitude: latVal,
        longitude: lonVal,
        zone,
        centralMeridian,
        leftBoundary,
        rightBoundary,
        sheets
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tính toán mảnh bản đồ.");
    }
  };

  // 2. Map Sheet to GPS reverse converter
  const convertSheetToCoords = (inputName: string) => {
    try {
      setError(null);
      let nameClean = inputName.trim().toUpperCase().replace(/\s+/g, '');

      // Regex parsers for different sheet formats
      let parsedBounds: any = null;
      let scaleName = '';
      let details: string[] = [];

      // Helper function to extract parents for 1:5.000, 1:2.000, 1:1.000, 1:500
      const parse100kParent = (bandChar: string, zoneVal: number, localIdx: number) => {
        const bandNum = bandLetterToNum(bandChar);
        const baseLat1M = bandNum * 4;
        const baseLon1M = (zoneVal - 1) * 6 - 180;
        const rowWithin1M = Math.floor((localIdx - 1) / 12);
        const colWithin1M = (localIdx - 1) % 12;

        const pLonMin = baseLon1M + colWithin1M * 0.5;
        const pLatMin = baseLat1M + (7 - rowWithin1M) * 0.5;
        return { latMin: pLatMin, latMax: pLatMin + 0.5, lonMin: pLonMin, lonMax: pLonMin + 0.5 };
      };

      // 1. Scale 1:500 (e.g. F-48-68-(256-h-16) or F-48-68-256-h-16)
      if (/^([A-Z])-?(\d{1,2})-?(\d{1,3})-?\(?(\d{1,3})-([A-Z])-?(\d{1,2})\)?$/.test(nameClean)) {
        const match = nameClean.match(/^([A-Z])-?(\d{1,2})-?(\d{1,3})-?\(?(\d{1,3})-([A-Z])-?(\d{1,2})\)?$/);
        if (match) {
          const bandChar = match[1];
          const zoneVal = parseInt(match[2], 10);
          const localIdx = parseInt(match[3], 10);
          const idx5k = parseInt(match[4], 10);
          const q2k = match[5].toLowerCase();
          const idx500 = parseInt(match[6], 10);

          const p100 = parse100kParent(bandChar, zoneVal, localIdx);
          
          const row5k = Math.floor((idx5k - 1) / 16);
          const col5k = (idx5k - 1) % 16;
          const p5LatMin = p100.latMin + (15 - row5k) * 0.03125;
          const p5LonMin = p100.lonMin + col5k * 0.03125;

          const alphabet2k = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'k'];
          const idx2k = alphabet2k.indexOf(q2k);
          const row2k = Math.floor(idx2k / 3);
          const col2k = idx2k % 3;
          const p2LatMin = p5LatMin + (2 - row2k) * 0.0104166667;
          const p2LonMin = p5LonMin + col2k * 0.0104166667;

          const row500 = Math.floor((idx500 - 1) / 4);
          const col500 = (idx500 - 1) % 4;

          const latMin = p2LatMin + (3 - row500) * 0.0026041667;
          const latMax = latMin + 0.0026041667;
          const lonMin = p2LonMin + col500 * 0.0026041667;
          const lonMax = lonMin + 0.0026041667;

          parsedBounds = { latMin, latMax, lonMin, lonMax };
          scaleName = '1:500';
          details = [
            `Nhận diện: Mảnh bản đồ chi tiết VN-2000 tỷ lệ 1:500`,
            `Nomenclature địa phương: mảnh mẹ 1:1M ${bandChar}-${zoneVal}, mảnh 1:100k thứ ${localIdx}, mảnh 1:5k thứ (${idx5k}), mảnh 1:2k '${q2k}', mảnh con 1:500 số ${idx500}`,
            `Hệ tọa độ VN-2000 chuẩn bản địa`
          ];
        }
      }
      // 2. Scale 1:1.000 (e.g. F-48-68-(256-h-III))
      else if (/^([A-Z])-?(\d{1,2})-?(\d{1,3})-?\(?(\d{1,3})-([A-Z])-?([I|V|X]+)\)?$/.test(nameClean)) {
        const match = nameClean.match(/^([A-Z])-?(\d{1,2})-?(\d{1,3})-?\(?(\d{1,3})-([A-Z])-?([I|V|X]+)\)?$/);
        if (match) {
          const bandChar = match[1];
          const zoneVal = parseInt(match[2], 10);
          const localIdx = parseInt(match[3], 10);
          const idx5k = parseInt(match[4], 10);
          const q2k = match[5].toLowerCase();
          const q1k = match[6];

          const p100 = parse100kParent(bandChar, zoneVal, localIdx);
          
          const row5k = Math.floor((idx5k - 1) / 16);
          const col5k = (idx5k - 1) % 16;
          const p5LatMin = p100.latMin + (15 - row5k) * 0.03125;
          const p5LonMin = p100.lonMin + col5k * 0.03125;

          const alphabet2k = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'k'];
          const idx2k = alphabet2k.indexOf(q2k);
          const row2k = Math.floor(idx2k / 3);
          const col2k = idx2k % 3;
          const p2LatMin = p5LatMin + (2 - row2k) * 0.0104166667;
          const p2LonMin = p5LonMin + col2k * 0.0104166667;

          let qRow = 0, qCol = 0;
          if (q1k === 'I') { qRow = 0; qCol = 0; }
          else if (q1k === 'II') { qRow = 0; qCol = 1; }
          else if (q1k === 'III') { qRow = 1; qCol = 0; }
          else if (q1k === 'IV') { qRow = 1; qCol = 1; }

          const latMin = p2LatMin + (1 - qRow) * 0.0052083333;
          const latMax = latMin + 0.0052083333;
          const lonMin = p2LonMin + qCol * 0.0052083333;
          const lonMax = lonMin + 0.0052083333;

          parsedBounds = { latMin, latMax, lonMin, lonMax };
          scaleName = '1:1.000';
          details = [
            `Nhận diện: Mảnh địa lý mảnh VN-2000 tỷ lệ 1:1.000`,
            `Góc phần tư La Mã ${q1k} (La Mã I, II, III, IV) của mảnh mẹ 1:2.000: (${idx5k}-${q2k})`
          ];
        }
      }
      // 3. Scale 1:2.000 (e.g. F-48-68-(256-h))
      else if (/^([A-Z])-?(\d{1,2})-?(\d{1,3})-?\(?(\d{1,3})-([A-Z])\)?$/.test(nameClean)) {
        const match = nameClean.match(/^([A-Z])-?(\d{1,2})-?(\d{1,3})-?\(?(\d{1,3})-([A-Z])\)?$/);
        if (match) {
          const bandChar = match[1];
          const zoneVal = parseInt(match[2], 10);
          const localIdx = parseInt(match[3], 10);
          const idx5k = parseInt(match[4], 10);
          const q2k = match[5].toLowerCase();

          const p100 = parse100kParent(bandChar, zoneVal, localIdx);
          
          const row5k = Math.floor((idx5k - 1) / 16);
          const col5k = (idx5k - 1) % 16;
          const p5LatMin = p100.latMin + (15 - row5k) * 0.03125;
          const p5LonMin = p100.lonMin + col5k * 0.03125;

          const alphabet2k = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'k'];
          const idx2k = alphabet2k.indexOf(q2k);
          const row2k = Math.floor(idx2k / 3);
          const col2k = idx2k % 3;
          const latMin = p5LatMin + (2 - row2k) * 0.0104166667;
          const latMax = latMin + 0.0104166667;
          const lonMin = p5LonMin + col2k * 0.0104166667;
          const lonMax = lonMin + 0.0104166667;

          parsedBounds = { latMin, latMax, lonMin, lonMax };
          scaleName = '1:2.000';
          details = [
            `Nhận diện: Mảnh VN-2000 tỷ lệ 1:2.000`,
            `Chữ cái vị trí '${q2k}' (a, b, c, d, e, f, g, h, k) trong mảnh mẹ 1:5.000 số (${idx5k})`
          ];
        }
      }
      // 4. Scale 1:5.000 (e.g. F-48-68-(256))
      else if (/^([A-Z])-?(\d{1,2})-?(\d{1,3})-?\(?(\d{1,3})\)?$/.test(nameClean)) {
        const match = nameClean.match(/^([A-Z])-?(\d{1,2})-?(\d{1,3})-?\(?(\d{1,3})\)?$/);
        if (match) {
          const bandChar = match[1];
          const zoneVal = parseInt(match[2], 10);
          const localIdx = parseInt(match[3], 10);
          const idx5k = parseInt(match[4], 10);

          const p100 = parse100kParent(bandChar, zoneVal, localIdx);
          
          const row5k = Math.floor((idx5k - 1) / 16);
          const col5k = (idx5k - 1) % 16;
          const latMin = p100.latMin + (15 - row5k) * 0.03125;
          const latMax = latMin + 0.03125;
          const lonMin = p100.lonMin + col5k * 0.03125;
          const lonMax = lonMin + 0.03125;

          parsedBounds = { latMin, latMax, lonMin, lonMax };
          scaleName = '1:5.000';
          details = [
            `Nhận diện: Mảnh VN-2000 tỷ lệ 1:5.000`,
            `Mảng con thứ (${idx5k}) chia trực tiếp từ mảnh 1:100.000`
          ];
        }
      }
      // 5. Scale 1:10.000 (e.g. F-48-68-D-c-3)
      else if (/^([A-Z])-?(\d{1,2})-?(\d{1,3})-?([A-D])-?([a-d])-?([1-4])$/.test(nameClean)) {
        const match = nameClean.match(/^([A-Z])-?(\d{1,2})-?(\d{1,3})-?([A-D])-?([a-d])-?([1-4])$/);
        if (match) {
          const bandChar = match[1];
          const zoneVal = parseInt(match[2], 10);
          const localIdx = parseInt(match[3], 10);
          const sub50k = match[4];
          const sub25k = match[5].toLowerCase();
          const sub10k = match[6];

          const p100 = parse100kParent(bandChar, zoneVal, localIdx);

          let latMin25k = p100.latMin;
          let lonMin25k = p100.lonMin;
          if (sub50k === 'A' || sub50k === 'I') latMin25k += 0.25;
          else if (sub50k === 'B' || sub50k === 'II') { latMin25k += 0.25; lonMin25k += 0.25; }
          else if (sub50k === 'D' || sub50k === 'IV') { lonMin25k += 0.25; }

          if (sub25k === 'a') latMin25k += 0.125;
          else if (sub25k === 'b') { latMin25k += 0.125; lonMin25k += 0.125; }
          else if (sub25k === 'd') { lonMin25k += 0.125; }

          let qRow = 0, qCol = 0;
          if (sub10k === '1') { qRow = 0; qCol = 0; }
          else if (sub10k === '2') { qRow = 0; qCol = 1; }
          else if (sub10k === '3') { qRow = 1; qCol = 0; }
          else if (sub10k === '4') { qRow = 1; qCol = 1; }

          const latMin = latMin25k + (1 - qRow) * 0.0625;
          const latMax = latMin + 0.0625;
          const lonMin = lonMin25k + qCol * 0.0625;
          const lonMax = lonMin + 0.0625;

          parsedBounds = { latMin, latMax, lonMin, lonMax };
          scaleName = '1:10.000';
          details = [
            `Nhận diện: Mảnh bản đồ chi tiết VN-2000 tỷ lệ 1:10.000`,
            `Phần tư mảnh số ${sub10k} của mảnh 1:25.000 mẹ ${bandChar}-${zoneVal}-${localIdx}-${sub50k}-${sub25k}`
          ];
        }
      }
      // 6. Scale 1:25.000 (e.g. F-48-68-D-c)
      else if (/^([A-Z])-?(\d{1,2})-?(\d{1,3})-?([A-D])-?([a-d])$/.test(nameClean)) {
        const match = nameClean.match(/^([A-Z])-?(\d{1,2})-?(\d{1,3})-?([A-D])-?([a-d])$/);
        if (match) {
          const bandChar = match[1];
          const zoneVal = parseInt(match[2], 10);
          const localIdx = parseInt(match[3], 10);
          const sub50k = match[4];
          const sub25k = match[5].toLowerCase();

          const p100 = parse100kParent(bandChar, zoneVal, localIdx);

          let latMin50k = p100.latMin;
          let lonMin50k = p100.lonMin;
          if (sub50k === 'A' || sub50k === 'I') latMin50k += 0.25;
          else if (sub50k === 'B' || sub50k === 'II') { latMin50k += 0.25; lonMin50k += 0.25; }
          else if (sub50k === 'D' || sub50k === 'IV') { lonMin50k += 0.25; }

          let qRow = 0, qCol = 0;
          if (sub25k === 'a') { qRow = 0; qCol = 0; }
          else if (sub25k === 'b') { qRow = 0; qCol = 1; }
          else if (sub25k === 'c') { qRow = 1; qCol = 0; }
          else if (sub25k === 'd') { qRow = 1; qCol = 1; }

          const latMin = latMin50k + (1 - qRow) * 0.125;
          const latMax = latMin + 0.125;
          const lonMin = lonMin50k + qCol * 0.125;
          const lonMax = lonMin + 0.125;

          parsedBounds = { latMin, latMax, lonMin, lonMax };
          scaleName = '1:25.000';
          details = [
            `Nhận diện: Mảnh bản đồ địa hình quốc gia VN-2000 tỷ lệ 1:25.000`,
            `Mảng con '${sub25k}' thuộc mảnh tỷ lệ 1:50.000 mẹ: ${bandChar}-${zoneVal}-${localIdx}-${sub50k}`
          ];
        }
      }
      // 7. Scale 1:50.000 (e.g. F-48-68-D)
      else if (/^([A-Z])-?(\d{1,2})-?(\d{1,3})-?([A-D])$/.test(nameClean)) {
        const match = nameClean.match(/^([A-Z])-?(\d{1,2})-?(\d{1,3})-?([A-D])$/);
        if (match) {
          const bandChar = match[1];
          const zoneVal = parseInt(match[2], 10);
          const localIdx = parseInt(match[3], 10);
          const sub50k = match[4];

          const p100 = parse100kParent(bandChar, zoneVal, localIdx);

          let qRow = 0, qCol = 0;
          if (sub50k === 'A') { qRow = 0; qCol = 0; }
          else if (sub50k === 'B') { qRow = 0; qCol = 1; }
          else if (sub50k === 'C') { qRow = 1; qCol = 0; }
          else if (sub50k === 'D') { qRow = 1; qCol = 1; }

          const latMin = p100.latMin + (1 - qRow) * 0.25;
          const latMax = latMin + 0.25;
          const lonMin = p100.lonMin + qCol * 0.25;
          const lonMax = lonMin + 0.25;

          parsedBounds = { latMin, latMax, lonMin, lonMax };
          scaleName = '1:50.000';
          details = [
            `Nhận diện: Mảnh bản đồ địa hình VN-2000 tỷ lệ 1:50.000`,
            `Mảng con ${sub50k} thuộc mảnh 1:100.000 mẹ ${bandChar}-${zoneVal}-${localIdx}`
          ];
        }
      }
      // 8. Scale 1:100.000 local piece (e.g. F-48-68)
      else if (/^([A-Z])-?(\d{1,2})-?(\d{1,3})$/.test(nameClean)) {
        const match = nameClean.match(/^([A-Z])-?(\d{1,2})-?(\d{1,3})$/);
        if (match) {
          const bandChar = match[1];
          const zoneVal = parseInt(match[2], 10);
          const localIdx = parseInt(match[3], 10);

          parsedBounds = parse100kParent(bandChar, zoneVal, localIdx);
          scaleName = '1:100.000';
          details = [
            `Nhận diện: Mảnh bản đồ cục bộ VN-2000 tỷ lệ 1:100.000`,
            `Mảnh thứ ${localIdx} trong mảnh 1:1.000.000 mẹ ${bandChar}-${zoneVal}`
          ];
        }
      }
      // 9. National Scale 1:10.000 (e.g. 6329-A-a-1 or 6329-I-a-1)
      else if (/^(\d{4})-?([A-D|I|II|III|IV])-?([A-D|a-d])-?([1-4])$/.test(nameClean)) {
        const match = nameClean.match(/^(\d{4})-?([A-D|I|II|III|IV])-?([A-D|a-d])-?([1-4])$/);
        if (match) {
          const parentCode = match[1];
          const sub50k = match[2];
          const sub25k = match[3].toLowerCase();
          const sub10k = match[4];

          const pCol = parseInt(parentCode.substring(0, 2), 10);
          const pRow = parseInt(parentCode.substring(2, 4), 10);
          const pLonMin = 75 + pCol / 2;
          const pLatMin = (pRow - 1) / 2 - 4;

          let latMin25k = pLatMin;
          let lonMin25k = pLonMin;
          if (sub50k === 'A' || sub50k === 'I' || sub50k === 'IV') latMin25k += 0.25;
          else if (sub50k === 'B' || sub50k === 'II') { latMin25k += 0.25; lonMin25k += 0.25; }
          else if (sub50k === 'D' || sub50k === 'III') { lonMin25k += 0.25; } // Adjust based on dynamic grid layout

          if (sub25k === 'a') latMin25k += 0.125;
          else if (sub25k === 'b') { latMin25k += 0.125; lonMin25k += 0.125; }
          else if (sub25k === 'd') { lonMin25k += 0.125; }

          let latMin = latMin25k;
          let latMax = latMin + 0.0625;
          let lonMin = lonMin25k;
          let lonMax = lonMin + 0.0625;

          if (sub10k === '1') {
            latMin += 0.0625; latMax += 0.0625;
          } else if (sub10k === '2') {
            latMin += 0.0625; latMax += 0.0625;
            lonMin += 0.0625; lonMax += 0.0625;
          } else if (sub10k === '4') {
            lonMin += 0.0625; lonMax += 0.0625;
          }

          parsedBounds = { latMin, latMax, lonMin, lonMax };
          scaleName = '1:10.000';
          details = [
            `Nhận diện: Mảnh bản đồ chi tiết VN-2000 tỷ lệ 1:10.000 gia quốc`,
            `Con thứ ${sub10k} của mảnh mẹ 1:25.000 ${parentCode}-${sub50k}-${sub25k}`
          ];
        }
      }
      // 10. National Scale 1:25.000 (e.g. 6329-A-a or 6329-I-a)
      else if (/^(\d{4})-?([A-D|I|II|III|IV])-?([A-D|a-d])$/.test(nameClean)) {
        const match = nameClean.match(/^(\d{4})-?([A-D|I|II|III|IV])-?([A-D|a-d])$/);
        if (match) {
          const parentCode = match[1];
          const sub50k = match[2];
          const sub25k = match[3].toLowerCase();

          const pCol = parseInt(parentCode.substring(0, 2), 10);
          const pRow = parseInt(parentCode.substring(2, 4), 10);
          const pLonMin = 75 + pCol / 2;
          const pLatMin = (pRow - 1) / 2 - 4;

          let latMin50k = pLatMin;
          let lonMin50k = pLonMin;
          if (sub50k === 'A' || sub50k === 'I' || sub50k === 'IV') latMin50k += 0.25;
          else if (sub50k === 'B' || sub50k === 'II') { latMin50k += 0.25; lonMin50k += 0.25; }
          else if (sub50k === 'D' || sub50k === 'III') lonMin50k += 0.25;

          let latMin = latMin50k;
          let latMax = latMin + 0.125;
          let lonMin = lonMin50k;
          let lonMax = lonMin + 0.125;

          if (sub25k === 'a') {
            latMin += 0.125; latMax += 0.125;
          } else if (sub25k === 'b') {
            latMin += 0.125; latMax += 0.125;
            lonMin += 0.125; lonMax += 0.125;
          } else if (sub25k === 'd') {
            lonMin += 0.125; lonMax += 0.125;
          }

          parsedBounds = { latMin, latMax, lonMin, lonMax };
          scaleName = '1:25.000';
          details = [
            `Nhận diện: Mảnh quốc gia địa hình VN-2000 tỷ lệ 1:25.000`,
            `Con '${sub25k}' thuộc mảnh 1:50.000 mẹ ${parentCode}-${sub50k}`
          ];
        }
      }
      // 11. National Scale 1:50.000 (e.g. 6329-A or 6329-I)
      else if (/^(\d{4})-?([A-D|I|II|III|IV])$/.test(nameClean)) {
        const match = nameClean.match(/^(\d{4})-?([A-D|I|II|III|IV])$/);
        if (match) {
          const parentCode = match[1];
          const sub = match[2];

          const pCol = parseInt(parentCode.substring(0, 2), 10);
          const pRow = parseInt(parentCode.substring(2, 4), 10);
          const pLonMin = 75 + pCol / 2;
          const pLatMin = (pRow - 1) / 2 - 4;

          let latMin = pLatMin;
          let latMax = latMin + 0.25;
          let lonMin = pLonMin;
          let lonMax = lonMin + 0.25;

          if (sub === 'A' || sub === 'I') {
            latMin = pLatMin + 0.25; latMax = latMin + 0.25;
          } else if (sub === 'B' || sub === 'II') {
            latMin = pLatMin + 0.25; latMax = latMin + 0.25;
            lonMin = pLonMin + 0.25; lonMax = lonMin + 0.25;
          } else if (sub === 'C' || sub === 'III') {
            // lonMin, latMin bottom-left
          } else if (sub === 'D' || sub === 'IV') {
            lonMin = pLonMin + 0.25; lonMax = lonMin + 0.25;
          }

          parsedBounds = { latMin, latMax, lonMin, lonMax };
          scaleName = '1:50.000';
          details = [
            `Nhận diện: Mảnh địa hình VN-2000 tỷ lệ 1:50.000 quốc gia`,
            `Góc phần tư ${sub} thuộc mảnh 1:100.000 mẹ ${parentCode}`
          ];
        }
      }
      // 12. Standard 1:100.000 code (e.g., 6329)
      else if (/^\d{4}$/.test(nameClean)) {
        const col = parseInt(nameClean.substring(0, 2), 10);
        const row = parseInt(nameClean.substring(2, 4), 10);

        const lonMin = 75 + col / 2;
        const lonMax = lonMin + 0.5;
        const latMin = (row - 1) / 2 - 4;
        const latMax = latMin + 0.5;

        parsedBounds = { latMin, latMax, lonMin, lonMax };
        scaleName = '1:100.000';
        details = [
          `Nhận diện: Mảnh quốc gia địa lý tỷ lệ 1:100.000`,
          `Cột lưới kinh độ: ${col} (${lonMin}°Đ - ${lonMax}°Đ)`,
          `Hàng lưới vĩ độ: ${row} (${latMin}°B - ${latMax}°B)`
        ];
      }
      // 13. Scale 1:250.000 (e.g. F-48-C-4)
      else if (/^([A-Z])-?(\d{1,2})-?([A-D])-?([1-4])$/.test(nameClean)) {
        const match = nameClean.match(/^([A-Z])-?(\d{1,2})-?([A-D])-?([1-4])$/);
        if (match) {
          const bandChar = match[1];
          const zoneVal = parseInt(match[2], 10);
          const sub = match[3];
          const subNum = parseInt(match[4], 10);

          const bandNum = bandLetterToNum(bandChar);
          const baseLat = bandNum * 4;
          const baseLon = (zoneVal - 1) * 6 - 180;

          let qRow = 0, qCol = 0;
          if (sub === 'A') { qRow = 0; qCol = 0; }
          else if (sub === 'B') { qRow = 0; qCol = 1; }
          else if (sub === 'C') { qRow = 1; qCol = 0; }
          else if (sub === 'D') { qRow = 1; qCol = 1; }

          const subRow = Math.floor((subNum - 1) / 2);
          const subCol = (subNum - 1) % 2;

          const row = qRow * 2 + subRow;
          const col = qCol * 2 + subCol;

          const latMin = baseLat + (3 - row) * 1;
          const latMax = latMin + 1;
          const lonMin = baseLon + col * 1.5;
          const lonMax = lonMin + 1.5;

          parsedBounds = { latMin, latMax, lonMin, lonMax };
          scaleName = '1:250.000';
          details = [
            `Nhận diện: Mảnh VN-2000 tỷ lệ 1:250.000`,
            `Ký hiệu mảnh con số ${subNum} thuộc mảnh 1:500.000 ${bandChar}-${zoneVal}-${sub}`
          ];
        }
      }
      // 14. Scale 1:500.000 (e.g. F-48-B)
      else if (/^([A-Z])-?(\d{1,2})-?([A-D])$/.test(nameClean)) {
        const match = nameClean.match(/^([A-Z])-?(\d{1,2})-?([A-D])$/);
        if (match) {
          const bandChar = match[1];
          const zoneVal = parseInt(match[2], 10);
          const sub = match[3];

          const bandNum = bandLetterToNum(bandChar);
          const baseLat = bandNum * 4;
          const baseLon = (zoneVal - 1) * 6 - 180;

          let qRow = 0, qCol = 0;
          if (sub === 'A') { qRow = 0; qCol = 0; }
          else if (sub === 'B') { qRow = 0; qCol = 1; }
          else if (sub === 'C') { qRow = 1; qCol = 0; }
          else if (sub === 'D') { qRow = 1; qCol = 1; }

          const latMin = baseLat + (1 - qRow) * 2;
          const latMax = latMin + 2;
          const lonMin = baseLon + qCol * 3;
          const lonMax = lonMin + 3;

          parsedBounds = { latMin, latMax, lonMin, lonMax };
          scaleName = '1:500.000';
          details = [
            `Nhận diện: Mảnh VN-2000 tỷ lệ 1:500.000`,
            `Góc phần tư địa bàn ${sub} tương ứng góc tọa độ chuẩn`
          ];
        }
      }
      // 15. Scale 1:1.000.000 (e.g. F-48)
      else if (/^([A-Z])-?(\d{1,2})$/.test(nameClean)) {
        const match = nameClean.match(/^([A-Z])-?(\d{1,2})$/);
        if (match) {
          const bandChar = match[1];
          const zoneVal = parseInt(match[2], 10);

          const bandNum = bandLetterToNum(bandChar);
          const baseLat = bandNum * 4;
          const baseLon = (zoneVal - 1) * 6 - 180;

          parsedBounds = {
            latMin: baseLat,
            latMax: baseLat + 4,
            lonMin: baseLon,
            lonMax: baseLon + 6
          };
          scaleName = '1:1.000.000';
          details = [
            `Nhận diện: Mảnh bản đồ quốc tế tỷ lệ 1:1.000.000`,
            `Đai vĩ độ vĩ tuyến ${bandChar} (${baseLat}°B) đến đai kinh tuyến múi ${zoneVal} (${baseLon}°Đ)`
          ];
        }
      }

      if (parsedBounds) {
        const centerLat = (parsedBounds.latMin + parsedBounds.latMax) / 2;
        const centerLon = (parsedBounds.lonMin + parsedBounds.lonMax) / 2;

        const zone = Math.floor((centerLon + 180) / 6) + 1;
        const centralMeridian = zone * 6 - 183;

        setResult({
          latitude: centerLat,
          longitude: centerLon,
          zone,
          centralMeridian,
          leftBoundary: zone * 6 - 186,
          rightBoundary: zone * 6 - 180,
          sheets: [
            {
              scale: scaleName,
              name: inputName,
              bounds: parsedBounds,
              center: { lat: centerLat, lon: centerLon },
              details: [
                ...details,
                `Kích thước lưới địa lý: dLat = ${(parsedBounds.latMax - parsedBounds.latMin).toFixed(5)}°, dLon = ${(parsedBounds.lonMax - parsedBounds.lonMin).toFixed(5)}°`,
                `Kinh vĩ độ trung tâm: Lat = ${centerLat.toFixed(6)}°, Lon = ${centerLon.toFixed(6)}°`
              ]
            }
          ]
        });
      } else {
        setError("Không nhận diện được định dạng mảnh bản đồ này. Ví dụ hợp lệ: F-48, F-48-68, F-48-68-D-c-3, F-48-68-(256-h-16), 6329, 6329-A, 6329-A-a, hoặc 6329-A-a-1");
      }
    } catch (err: any) {
      setError("Có lỗi xảy ra: " + err.message);
    }
  };

  const handleCalculate = () => {
    if (direction === 'coord_to_sheet') {
      const latVal = parseFloat(latInput);
      const lonVal = parseFloat(lonInput);
      if (isNaN(latVal) || isNaN(lonVal)) {
        setError("Vui lòng nhập vĩ độ B và kinh độ L hợp lệ.");
        return;
      }
      convertCoordToSheets(latVal, lonVal);
    } else {
      if (!sheetNameInput.trim()) {
        setError("Vui lòng nhập tên/số hiệu mảnh bản đồ.");
        return;
      }
      convertSheetToCoords(sheetNameInput);
    }
  };

  const loadExample = (exLat: string, exLon: string) => {
    setLatInput(exLat);
    setLonInput(exLon);
    convertCoordToSheets(parseFloat(exLat), parseFloat(exLon));
  };

  // Get active sheet boundary calculations
  const activeSheet = result ? (direction === 'coord_to_sheet' ? result.sheets[selectedScaleIndex] : result.sheets[0]) : null;

  let ewDist = 0;
  let nsDist = 0;
  let area = 0;
  let zoomLevel = 12;
  let frameWidth = 208; // default w-52
  let frameHeight = 160; // default h-40
  let relativeX = 0.5;
  let relativeY = 0.5;
  let showScaleWarning = false;
  let scaleFactorUsed = 1.0;
  let rawPixelWidth = 0;
  let rawPixelHeight = 0;

  if (activeSheet) {
    const { latMin, latMax, lonMin, lonMax } = activeSheet.bounds;
    const dLat = Math.abs(latMax - latMin);
    const dLon = Math.abs(lonMax - lonMin);
    const centerLat = (latMin + latMax) / 2;
    
    // Estimate ground dimensions based on latitude/longitude boundaries
    // 1 deg Lat approx 111,132 meters
    nsDist = dLat * 111132;
    // 1 deg Lon approx 111,132 * cos(centerLat) meters
    ewDist = dLon * 111132 * Math.cos(centerLat * Math.PI / 180);
    area = (nsDist * ewDist) / 1000000; // in km2

    const scale = activeSheet.scale;
    const cleanScale = scale.replace(/\./g, '');
    if (cleanScale.includes('1:1000000')) zoomLevel = 7;
    else if (cleanScale.includes('1:500000')) zoomLevel = 8;
    else if (cleanScale.includes('1:250000')) zoomLevel = 10;
    else if (cleanScale.includes('1:100000')) zoomLevel = 12;
    else if (cleanScale.includes('1:50000')) zoomLevel = 13;
    else if (cleanScale.includes('1:25000')) zoomLevel = 14;
    else if (cleanScale.includes('1:10000')) zoomLevel = 15;
    else if (cleanScale.includes('1:5000')) zoomLevel = 16;
    else if (cleanScale.includes('1:2000')) zoomLevel = 18;
    else if (cleanScale.includes('1:1000')) zoomLevel = 19;
    else if (cleanScale.includes('1:500')) zoomLevel = 20;
    else zoomLevel = 12;

    const maxViewportWidth = 220; // max width of the frame container in pixel
    const maxViewportHeight = 160; // max height of the frame container in pixel

    if (scaleMode === 'true_scale') {
      // Convert physical dimensions to screen pixels
      const metersPerPixel = (156543.03392 * Math.cos(centerLat * Math.PI / 180)) / Math.pow(2, zoomLevel);
      rawPixelWidth = ewDist / metersPerPixel;
      rawPixelHeight = nsDist / metersPerPixel;

      if (rawPixelWidth > maxViewportWidth || rawPixelHeight > maxViewportHeight) {
        showScaleWarning = true;
        const widthScale = maxViewportWidth / rawPixelWidth;
        const heightScale = maxViewportHeight / rawPixelHeight;
        scaleFactorUsed = Math.min(widthScale, heightScale);
        frameWidth = rawPixelWidth * scaleFactorUsed;
        frameHeight = rawPixelHeight * scaleFactorUsed;
      } else {
        frameWidth = rawPixelWidth;
        frameHeight = rawPixelHeight;
      }
    } else {
      // Fit to Window: Normalize standard frame size while preserving aspect ratio
      const aspectRatio = ewDist / nsDist;
      if (aspectRatio > maxViewportWidth / maxViewportHeight) {
        frameWidth = maxViewportWidth;
        frameHeight = maxViewportWidth / aspectRatio;
      } else {
        frameHeight = maxViewportHeight;
        frameWidth = maxViewportHeight * aspectRatio;
      }
    }

    // Preserve the relative position inside the sheet:
    // relativeX = (Lon - Lmin) / (Lmax - Lmin)
    // relativeY = (Lat - Bmin) / (Bmax - Bmin)
    const lonDiff = lonMax - lonMin;
    const latDiff = latMax - latMin;
    if (lonDiff > 0) relativeX = (result.longitude - lonMin) / lonDiff;
    if (latDiff > 0) relativeY = (result.latitude - latMin) / latDiff;

    // Clamp values in [0, 1] for safety in rendering
    relativeX = Math.max(0, Math.min(1, relativeX));
    relativeY = Math.max(0, Math.min(1, relativeY));
  }

  return (
    <div className="bg-[#1a1a1a] p-6 border border-[#333] rounded-sm text-gray-200">
      <div className="flex items-center justify-between border-b border-[#333] pb-4 mb-6">
        <h2 className="text-base font-bold text-yellow-500 uppercase flex items-center gap-2">
          <Globe className="w-5 h-5 text-yellow-500" />
          Tọa độ GPS ↔ Số hiệu mảnh Bản đồ VN-2000
        </h2>
        <div className="flex gap-2 bg-[#111] p-1 rounded-sm border border-[#333]">
          <button 
            onClick={() => { setDirection('coord_to_sheet'); setResult(null); setError(null); }}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${direction === 'coord_to_sheet' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-gray-200'}`}
          >
            GPS → Số hiệu mảnh
          </button>
          <button 
            onClick={() => { setDirection('sheet_to_coord'); setResult(null); setError(null); }}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${direction === 'sheet_to_coord' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Số hiệu mảnh → GPS
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#111] p-4 border border-[#333]">
            <h3 className="text-xs text-yellow-500 uppercase tracking-wider mb-4 font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-yellow-500" />
              Thông số đầu vào
            </h3>

            {direction === 'coord_to_sheet' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wider">Vĩ độ B (Dec_Deg N)</label>
                  <input 
                    type="number" 
                    value={latInput} 
                    onChange={e => setLatInput(e.target.value)} 
                    placeholder="Ví dụ: 10.353427" 
                    className="w-full bg-[#161616] border border-[#444] px-3 py-2 text-sm text-[#e0e0e0] focus:border-yellow-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wider">Kinh độ L (Dec_Deg E)</label>
                  <input 
                    type="number" 
                    value={lonInput} 
                    onChange={e => setLonInput(e.target.value)} 
                    placeholder="Ví dụ: 106.547216" 
                    className="w-full bg-[#161616] border border-[#444] px-3 py-2 text-sm text-[#e0e0e0] focus:border-yellow-500 focus:outline-none font-mono"
                  />
                </div>
                <div className="pt-2">
                  <span className="text-[10px] text-gray-500 block mb-1 uppercase tracking-wider">Chọn nhanh mốc Toạ độ Việt Nam</span>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => loadExample('21.047039', '105.783661')} className="text-[10px] px-2 py-1.5 bg-yellow-500/10 border border-yellow-500/40 text-yellow-500 hover:bg-yellow-500/20 font-bold tracking-tight rounded-sm flex items-center gap-1">🇻🇳 Mốc N00 Mới (479 HQV)</button>
                    <button onClick={() => loadExample('21.04929722', '105.80509167')} className="text-[10px] px-2 py-1.5 bg-[#222] border border-[#444] text-gray-400 hover:bg-[#333] tracking-tight rounded-sm">🇻🇳 Mốc N00 Cũ (108 HQV)</button>
                    <button onClick={() => loadExample('10.353427', '106.547216')} className="text-[10px] px-2 py-1.5 bg-[#222] border border-[#444] text-gray-300 hover:bg-[#333] tracking-tight rounded-sm">Bến Lức / HCM</button>
                    <button onClick={() => loadExample('21.028511', '105.854167')} className="text-[10px] px-2 py-1.5 bg-[#222] border border-[#444] text-gray-300 hover:bg-[#333] tracking-tight rounded-sm">Hồ Gươm HN</button>
                    <button onClick={() => loadExample('16.054407', '108.202164')} className="text-[10px] px-2 py-1.5 bg-[#222] border border-[#444] text-gray-300 hover:bg-[#333] tracking-tight rounded-sm">Đà Nẵng</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wider">Mã / Số hiệu mảnh bản đồ</label>
                  <input 
                    type="text" 
                    value={sheetNameInput} 
                    onChange={e => setSheetNameInput(e.target.value)} 
                    placeholder="Ví dụ: 6329 hoặc E48-70" 
                    className="w-full bg-[#161616] border border-[#444] px-3 py-2 text-sm text-[#e0e0e0] focus:border-yellow-500 focus:outline-none font-mono uppercase"
                  />
                </div>
                <div className="text-[11px] text-gray-500 leading-relaxed font-sans">
                  Hỗ trợ định dạng:<br />
                  - <b className="text-yellow-500 font-mono">6329</b> (1:100k quốc tế)<br />
                  - <b className="text-yellow-500 font-mono">E48-70</b> (1:100k UTM/VN2000)<br />
                  - <b className="text-yellow-500 font-mono">6329-A</b> (1:50k A/B/C/D)<br />
                  - <b className="text-yellow-500 font-mono">6329-A-a</b> (1:25k a/b/c/d)<br />
                  - <b className="text-yellow-500 font-mono">6329-A-a-1</b> (1:10k 1/2/3/4)
                </div>
              </div>
            )}

            <button 
              onClick={handleCalculate}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase py-2.5 px-4 text-xs tracking-wider transition-colors mt-6 font-mono flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Tính toán mảnh liền
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 text-xs rounded-sm leading-relaxed">
              {error}
            </div>
          )}
        </div>

        {/* Output Panel / Result Vis */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                key="result" 
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                {/* Header overview */}
                <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <span className="text-xs uppercase tracking-wider text-yellow-500 font-bold flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> Thông tin hệ quy chiếu & lưới bao mảnh
                    </span>
                    <span className="text-[11px] bg-yellow-500/10 text-yellow-500 px-2.5 py-0.5 border border-yellow-500/30">
                      Zone {result.zone} (Kinh trục {result.centralMeridian}°Đ)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Vĩ độ tâm mảnh</span>
                      <span className="font-mono text-[#e0e0e0] font-bold">{result.latitude.toFixed(6)}°</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Kinh độ tâm mảnh</span>
                      <span className="font-mono text-[#e0e0e0] font-bold">{result.longitude.toFixed(6)}°</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Biên trái hành lang</span>
                      <span className="font-mono text-gray-400">{result.leftBoundary}° Đ</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Biên phải hành lang</span>
                      <span className="font-mono text-gray-400">{result.rightBoundary}° Đ</span>
                    </div>
                  </div>
                </div>

                {/* Chế độ xem: Thông tin mảnh (Sheet details) vs Bản đồ trực tuyến (Real-time Map) */}
                <div className="flex border-b border-[#333] mb-4 gap-1 bg-[#111] p-1 rounded-sm">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 rounded-sm border ${
                      activeTab === 'info'
                        ? 'bg-yellow-500 text-black border-yellow-500'
                        : 'bg-transparent text-gray-400 border-transparent hover:text-white hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Thông tin mảnh (Information)
                  </button>
                  <button
                    onClick={() => setActiveTab('map')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 rounded-sm border ${
                      activeTab === 'map'
                        ? 'bg-yellow-500 text-black border-yellow-500'
                        : 'bg-transparent text-gray-400 border-transparent hover:text-white hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <Map className="w-3.5 h-3.5" /> Bản đồ VN-2000 (Map Viewer)
                  </button>
                </div>

                {activeTab === 'map' ? (
                  <div className="space-y-4">
                    {/* Scale selector for map view if in coord_to_sheet mode */}
                    {direction === 'coord_to_sheet' && (
                      <div className="bg-[#111] border border-[#333] p-4 rounded-sm">
                        <h3 className="text-xs uppercase text-yellow-500 tracking-wider mb-3 font-semibold font-mono flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-yellow-500" /> Tỉ lệ lưới chiếu (Select Visualization Scale)
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
                          {result.sheets.map((sh: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedScaleIndex(idx)}
                              className={`px-1.5 py-2 text-[10px] font-mono border text-center transition-all ${
                                selectedScaleIndex === idx
                                  ? 'bg-yellow-500 text-black border-yellow-500 font-bold'
                                  : 'bg-[#161616] border-[#222] text-gray-400 hover:border-yellow-500/50 hover:text-white'
                              }`}
                            >
                              <div className="opacity-75">{sh.scale.split(':')[1]}</div>
                              <div className="font-bold truncate mt-1 text-[11px]">{sh.name.split('-').pop()}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <VN2000MapViewer
                      sheet={activeSheet}
                      latitude={result.latitude}
                      longitude={result.longitude}
                    />
                  </div>
                ) : (
                  <>
                    {/* Tỉ lệ hiển thị màn hình (Screen Scale Controls) */}
                    <div className="bg-[#111] border border-[#333] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-sm">
                      <div className="space-y-1">
                        <span className="text-xs font-mono font-bold text-yellow-500 uppercase tracking-wide flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-yellow-500" /> Chế độ hiển thị tỉ lệ mảnh (Scale Proportion Setup)
                        </span>
                        <p className="text-[11px] text-gray-400 leading-normal max-w-xl">
                          {scaleMode === 'true_scale' 
                            ? "True Screen Scale: Render using actual ground-to-screen proportions based on map scale and current visualization zoom level." 
                            : "Fit to Window: Normalize the frame size to fit viewport boundary while preserving original aspect ratio."}
                        </p>
                      </div>
                      <div className="flex gap-2.5 self-start md:self-auto shrink-0">
                        <button
                          onClick={() => setScaleMode('true_scale')}
                          className={`px-3 py-2 text-xs font-bold font-mono transition-all flex items-center gap-2 rounded-sm border ${
                            scaleMode === 'true_scale'
                              ? 'bg-yellow-500/15 text-yellow-500 border-yellow-500/55'
                              : 'bg-[#161616] text-gray-400 border-[#222] hover:text-[#e0e0e0] hover:border-[#333]'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${scaleMode === 'true_scale' ? 'border-yellow-500' : 'border-gray-500'}`}>
                            {scaleMode === 'true_scale' && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
                          </div>
                          True Screen Scale
                        </button>
                        <button
                          onClick={() => setScaleMode('fit_window')}
                          className={`px-3 py-2 text-xs font-bold font-mono transition-all flex items-center gap-2 rounded-sm border ${
                            scaleMode === 'fit_window'
                              ? 'bg-yellow-500/15 text-yellow-500 border-yellow-500/55'
                              : 'bg-[#161616] text-gray-400 border-[#222] hover:text-[#e0e0e0] hover:border-[#333]'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${scaleMode === 'fit_window' ? 'border-yellow-500' : 'border-gray-500'}`}>
                            {scaleMode === 'fit_window' && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
                          </div>
                          Fit to Window
                        </button>
                      </div>
                    </div>

                    {direction === 'coord_to_sheet' ? (
                      <div>
                        <h3 className="text-xs uppercase text-yellow-500 tracking-wider mb-3 font-bold">
                          Hệ thống mảnh phân cấp (Từ 1:1.000.000 đến 1:2.000)
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 mb-4">
                          {result.sheets.map((sh: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedScaleIndex(idx)}
                              className={`px-1.5 py-2 text-[10px] font-mono border text-center transition-all ${
                                selectedScaleIndex === idx
                                  ? 'bg-yellow-500 text-black border-yellow-500 font-bold'
                                  : 'bg-[#111] border-[#333] text-gray-400 hover:border-yellow-500/50 hover:text-white'
                              }`}
                            >
                              <div className="opacity-75">{sh.scale.split(':')[1]}</div>
                              <div className="font-bold truncate mt-1 text-[11px]">{sh.name.split('-').pop()}</div>
                            </button>
                          ))}
                        </div>

                        {/* Detailed selected scale */}
                        <div className="bg-[#111] border border-[#333] p-4">
                          <div className="flex items-center justify-between border-b border-[#222] pb-3 mb-4">
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Tỷ lệ được chọn</span>
                              <h4 className="text-sm font-bold text-[#e0e0e0]">{result.sheets[selectedScaleIndex].scale}</h4>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Ký hiệu mảnh đầy đủ</span>
                              <span className="font-bold text-yellow-500 font-mono text-sm">{result.sheets[selectedScaleIndex].name}</span>
                              {result.sheets[selectedScaleIndex].utmEquivalent && (
                                <span className="text-[10px] text-gray-400 block font-mono">({result.sheets[selectedScaleIndex].utmEquivalent})</span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Map Boundary Schema Visualizer */}
                            <div className="bg-[#161616] border border-[#222] p-4 relative flex flex-col items-center justify-center min-h-[300px] pb-6">
                              <span className="absolute top-2 left-2 text-[9px] text-yellow-500 font-mono uppercase font-bold tracking-wider">Phác họa mảnh</span>
                              
                              {/* Inner Map Quadrant Drawing */}
                              <motion.div 
                                animate={{ width: frameWidth, height: frameHeight }}
                                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                                className="border border-gray-600 relative flex items-center justify-center bg-[#1c1c1c]/50 my-6"
                              >
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-semibold text-gray-400 whitespace-nowrap">
                                  B_Max: {result.sheets[selectedScaleIndex].bounds.latMax.toFixed(5)}°
                                </div>
                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-semibold text-gray-400 whitespace-nowrap">
                                  B_Min: {result.sheets[selectedScaleIndex].bounds.latMin.toFixed(5)}°
                                </div>
                                <div className="absolute top-1/2 -left-12 -translate-y-1/2 rotate-90 text-[9px] font-mono font-semibold text-gray-400 whitespace-nowrap">
                                  L_Min: {result.sheets[selectedScaleIndex].bounds.lonMin.toFixed(5)}°
                                </div>
                                <div className="absolute top-1/2 -right-12 -translate-y-1/2 -rotate-90 text-[9px] font-mono font-semibold text-gray-400 whitespace-nowrap">
                                  L_Max: {result.sheets[selectedScaleIndex].bounds.lonMax.toFixed(5)}°
                                </div>

                                {/* Point representation */}
                                {direction === 'coord_to_sheet' && (
                                  <motion.div 
                                    className="absolute w-3 h-3 bg-red-500 rounded-full border border-white animate-pulse"
                                    animate={{
                                      left: `${relativeX * 100}%`,
                                      bottom: `${relativeY * 100}%`,
                                    }}
                                    style={{
                                      transform: 'translate(-50%, 50%)'
                                    }}
                                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                                    title={`Điểm nhập vào: (${result.latitude}, ${result.longitude})`}
                                  />
                                )}

                                {/* Info inside the box */}
                                <div className="text-center font-mono p-1">
                                  <div className="text-yellow-500 font-bold text-xs truncate max-w-[150px]">{result.sheets[selectedScaleIndex].name}</div>
                                  <div className="text-[9px] text-gray-400 mt-1 uppercase">Center</div>
                                  <div className="text-[9px] text-[#e0e0e0] font-mono truncate max-w-[150px]">
                                    {result.sheets[selectedScaleIndex].center.lat.toFixed(5)}°, {result.sheets[selectedScaleIndex].center.lon.toFixed(5)}°
                                  </div>
                                </div>
                              </motion.div>

                              {/* Ground Dimensions and Zoom Recommendation */}
                              <div className="mt-4 pt-3 border-t border-[#222] w-full text-left space-y-2.5">
                                <div className="text-[10px] text-yellow-500 font-mono uppercase font-bold tracking-wider">
                                  Approximate Ground Dimensions:
                                </div>
                                <div className="grid grid-cols-1 gap-1 text-[11px] font-mono text-gray-300">
                                  <div>• North-South: <span className="text-[#f5f5f5] font-bold">{nsDist.toFixed(1)} m</span></div>
                                  <div>• East-West: <span className="text-[#f5f5f5] font-bold">{ewDist.toFixed(1)} m</span></div>
                                  <div>• Area: <span className="text-[#f5f5f5] font-bold">{area.toFixed(4)} km²</span></div>
                                </div>
                                <div className="text-[10px] text-gray-400 border-t border-[#222]/50 pt-2 font-mono">
                                  Recommended observation zoom:<br />
                                  <span className="text-gray-500">Google Maps / OSM Zoom ≈ </span>
                                  <span className="text-yellow-500 font-bold">{zoomLevel}</span>
                                  {scaleMode === 'true_scale' && showScaleWarning && (
                                    <div className="mt-2 text-[10px] text-yellow-500 font-mono tracking-tight bg-yellow-500/10 p-2 border border-yellow-500/25 rounded-sm text-center leading-normal">
                                      ⚠️ Displayed at reduced scale for screen fitting.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Detailed analytical computation text */}
                            <div className="space-y-4">
                              <h5 className="text-xs text-gray-400 uppercase tracking-widest font-mono font-bold border-b border-[#222] pb-1">Giải giải toán học</h5>
                              <div className="space-y-2 text-xs leading-relaxed font-sans text-gray-300">
                                {result.sheets[selectedScaleIndex].details.map((detail: string, dIdx: number) => (
                                  <div key={dIdx} className="flex gap-2 items-start font-mono text-[11px] leading-relaxed">
                                    <span className="text-yellow-500">▶</span>
                                    <span>{detail}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#111] border border-[#333] p-4">
                        <div className="flex items-center justify-between border-b border-[#222] pb-3 mb-4">
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Loại bản đồ phân tích</span>
                            <h4 className="text-sm font-bold text-[#e0e0e0]">{result.sheets[0].scale}</h4>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Ký tự nguyên bản</span>
                            <span className="font-bold text-yellow-500 font-mono text-sm">{result.sheets[0].name}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-[#161616] border border-[#222] p-4 relative flex flex-col items-center justify-center min-h-[300px] pb-6">
                            <span className="absolute top-2 left-2 text-[9px] text-yellow-500 font-mono uppercase font-bold tracking-wider">Phác họa tọa độ góc</span>
                            
                            {/* Inner Map Quadrant Drawing */}
                            <motion.div 
                              animate={{ width: frameWidth, height: frameHeight }}
                              transition={{ type: "spring", stiffness: 120, damping: 20 }}
                              className="border border-gray-600 relative flex items-center justify-center bg-[#1c1c1c]/50 my-6"
                            >
                              {/* Point indicators of 4 corners */}
                              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-gray-400 whitespace-nowrap">
                                B_Max: {result.sheets[0].bounds.latMax.toFixed(5)}°
                              </div>
                              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-gray-400 whitespace-nowrap">
                                B_Min: {result.sheets[0].bounds.latMin.toFixed(5)}°
                              </div>
                              <div className="absolute top-1/2 -left-12 -translate-y-1/2 rotate-90 text-[9px] font-mono text-gray-400 whitespace-nowrap">
                                L_Min: {result.sheets[0].bounds.lonMin.toFixed(5)}°
                              </div>
                              <div className="absolute top-1/2 -right-12 -translate-y-1/2 -rotate-90 text-[9px] font-mono text-gray-400 whitespace-nowrap">
                                L_Max: {result.sheets[0].bounds.lonMax.toFixed(5)}°
                              </div>

                              {/* Center representation smoothly animated */}
                              <motion.div 
                                className="absolute w-3 h-3 bg-red-500 rounded-full border border-white animate-pulse"
                                animate={{
                                  left: `${relativeX * 100}%`,
                                  bottom: `${relativeY * 100}%`,
                                }}
                                style={{
                                  transform: 'translate(-50%, 50%)'
                                }}
                                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                                title={`Trung tâm mảnh: (${result.sheets[0].center.lat.toFixed(6)}, ${result.sheets[0].center.lon.toFixed(6)})`}
                              />

                              <div className="text-center font-mono p-1">
                                <div className="text-yellow-500 font-medium text-xs">TRUNG TÂM</div>
                                <div className="text-[10px] text-[#e0e0e0] mt-0.5 font-bold truncate max-w-[150px]">
                                  {result.sheets[0].center.lat.toFixed(5)}°B
                                </div>
                                <div className="text-[10px] text-[#e0e0e0] font-bold truncate max-w-[150px]">
                                  {result.sheets[0].center.lon.toFixed(5)}°Đ
                                </div>
                              </div>
                            </motion.div>

                            {/* Ground Dimensions and Zoom Recommendation */}
                            <div className="mt-4 pt-3 border-t border-[#222] w-full text-left space-y-2.5">
                              <div className="text-[10px] text-yellow-500 font-mono uppercase font-bold tracking-wider">
                                Approximate Ground Dimensions:
                              </div>
                              <div className="grid grid-cols-1 gap-1 text-[11px] font-mono text-gray-300">
                                <div>• North-South: <span className="text-[#f5f5f5] font-bold">{nsDist.toFixed(1)} m</span></div>
                                <div>• East-West: <span className="text-[#f5f5f5] font-bold">{ewDist.toFixed(1)} m</span></div>
                                <div>• Area: <span className="text-[#f5f5f5] font-bold">{area.toFixed(4)} km²</span></div>
                              </div>
                              <div className="text-[10px] text-gray-400 border-t border-[#222]/50 pt-2 font-mono">
                                Recommended observation zoom:<br />
                                <span className="text-gray-500">Google Maps / OSM Zoom ≈ </span>
                                <span className="text-yellow-500 font-bold">{zoomLevel}</span>
                                {scaleMode === 'true_scale' && showScaleWarning && (
                                  <div className="mt-2 text-[10px] text-yellow-500 font-mono tracking-tight bg-yellow-500/10 p-2 border border-yellow-500/25 rounded-sm text-center leading-normal">
                                    ⚠️ Displayed at reduced scale for screen fitting.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h5 className="text-xs text-gray-400 uppercase tracking-widest font-mono font-bold border-b border-[#222] pb-1">Tọa độ 4 góc (Độ thập phân)</h5>
                            <div className="space-y-2.5 font-mono text-xs">
                              <div className="bg-[#161616] p-2 border border-[#222] flex justify-between">
                                <span className="text-yellow-500 uppercase font-bold">Tây Nam (SW)</span>
                                <span className="font-bold text-gray-300">{result.sheets[0].bounds.latMin.toFixed(6)}°, {result.sheets[0].bounds.lonMin.toFixed(6)}°</span>
                              </div>
                              <div className="bg-[#161616] p-2 border border-[#222] flex justify-between">
                                <span className="text-yellow-500 uppercase font-bold">Đông Nam (SE)</span>
                                <span className="font-bold text-gray-300">{result.sheets[0].bounds.latMin.toFixed(6)}°, {result.sheets[0].bounds.lonMax.toFixed(6)}°</span>
                              </div>
                              <div className="bg-[#161616] p-2 border border-[#222] flex justify-between">
                                <span className="text-yellow-500 uppercase font-bold">Tây Bắc (NW)</span>
                                <span className="font-bold text-gray-300">{result.sheets[0].bounds.latMax.toFixed(6)}°, {result.sheets[0].bounds.lonMin.toFixed(6)}°</span>
                              </div>
                              <div className="bg-[#161616] p-2 border border-[#222] flex justify-between">
                                <span className="text-yellow-500 uppercase font-bold">Đông Bắc (NE)</span>
                                <span className="font-bold text-gray-300">{result.sheets[0].bounds.latMax.toFixed(6)}°, {result.sheets[0].bounds.lonMax.toFixed(6)}°</span>
                              </div>
                            </div>

                            <div className="bg-yellow-500/5 p-3 border border-yellow-500/10 text-[11px] text-gray-400 leading-relaxed font-sans">
                              📌 Kinh tuyến trục múi chiếu của mảnh này là <span className="text-yellow-500 font-bold">{result.centralMeridian}°Đ</span>. Bạn có thể sử dụng dữ liệu kinh vĩ độ này để chuyển đổi sang tọa dộ góc phẳng VN2000 (X, Y) mét bằng công cụ trong thẻ <span className="text-[#e2e2e2] font-bold">Vietnam Pro</span>.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <div className="bg-[#111] border border-[#333] h-[340px] flex flex-col items-center justify-center text-center text-gray-500 py-10 px-4 rounded-sm">
                <Layers className="w-16 h-16 text-gray-700 mb-4 stroke-[1.5]" />
                <h3 className="text-xs uppercase font-mono tracking-widest text-gray-400 font-bold">Chưa có kết quả phân tích</h3>
                <p className="text-xs max-w-md mt-2 leading-relaxed">
                  Cập nhật tọa độ địa lý hoặc mã danh pháp mảnh bản đồ VN-2000 của bạn bên trái và nhấn nút tính toán để phân tích chi tiết.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
