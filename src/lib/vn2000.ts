export interface ProvinceCRS {
  id: string;
  name: string;
  region: string;
  cm: number; // Central Meridian
  epsg3?: string; // 3-degree zone EPSG if exists
}

// Comprehensive database of Vietnam provinces and their VN-2000 Central Meridians
// Supports the nationwide CRS expansion including all administrative units.
export const VN_PROVINCES: ProvinceCRS[] = [
  { id: 'VN-HN', name: 'Hà Nội', region: 'Red River Delta', cm: 105.00 },
  { id: 'VN-HCM', name: 'Hồ Chí Minh', region: 'Southeast', cm: 105.75, epsg3: 'EPSG:9210' },
  { id: 'VN-HP', name: 'Hải Phòng', region: 'Red River Delta', cm: 105.75 },
  { id: 'VN-DN', name: 'Đà Nẵng', region: 'South Central Coast', cm: 107.75 },
  { id: 'VN-CT', name: 'Cần Thơ', region: 'Mekong Delta', cm: 105.00 },
  { id: 'VN-AG', name: 'An Giang', region: 'Mekong Delta', cm: 104.25 },
  { id: 'VN-BRVT', name: 'Bà Rịa - Vũng Tàu', region: 'Southeast', cm: 105.75 },
  { id: 'VN-BL', name: 'Bạc Liêu', region: 'Mekong Delta', cm: 105.00 },
  { id: 'VN-BG', name: 'Bắc Giang', region: 'Northeast', cm: 106.25 },
  { id: 'VN-BK', name: 'Bắc Kạn', region: 'Northeast', cm: 106.25 },
  { id: 'VN-BN', name: 'Bắc Ninh', region: 'Red River Delta', cm: 105.50 },
  { id: 'VN-BT', name: 'Bến Tre', region: 'Mekong Delta', cm: 105.75 },
  { id: 'VN-BD', name: 'Bình Dương', region: 'Southeast', cm: 105.75 },
  { id: 'VN-BDI', name: 'Bình Định', region: 'South Central Coast', cm: 108.25 },
  { id: 'VN-BP', name: 'Bình Phước', region: 'Southeast', cm: 106.25 },
  { id: 'VN-BTH', name: 'Bình Thuận', region: 'Southeast', cm: 108.50 },
  { id: 'VN-CM', name: 'Cà Mau', region: 'Mekong Delta', cm: 104.50 },
  { id: 'VN-CB', name: 'Cao Bằng', region: 'Northeast', cm: 105.75 },
  { id: 'VN-DL', name: 'Đắk Lắk', region: 'Central Highlands', cm: 108.00 },
  { id: 'VN-DNO', name: 'Đắk Nông', region: 'Central Highlands', cm: 108.00 },
  { id: 'VN-DB', name: 'Điện Biên', region: 'Northwest', cm: 103.00 },
  { id: 'VN-DNA', name: 'Đồng Nai', region: 'Southeast', cm: 107.75 },
  { id: 'VN-DT', name: 'Đồng Tháp', region: 'Mekong Delta', cm: 105.00 },
  { id: 'VN-GL', name: 'Gia Lai', region: 'Central Highlands', cm: 108.50 },
  { id: 'VN-HG', name: 'Hà Giang', region: 'Northeast', cm: 105.00 },
  { id: 'VN-HNA', name: 'Hà Nam', region: 'Red River Delta', cm: 105.00 },
  { id: 'VN-HT', name: 'Hà Tĩnh', region: 'North Central Coast', cm: 105.50 },
  { id: 'VN-HD', name: 'Hải Dương', region: 'Red River Delta', cm: 105.50 },
  { id: 'VN-HGI', name: 'Hậu Giang', region: 'Mekong Delta', cm: 105.00 },
  { id: 'VN-HB', name: 'Hòa Bình', region: 'Northwest', cm: 105.00 },
  { id: 'VN-HY', name: 'Hưng Yên', region: 'Red River Delta', cm: 105.50 },
  { id: 'VN-KH', name: 'Khánh Hòa', region: 'South Central Coast', cm: 108.25 },
  { id: 'VN-KG', name: 'Kiên Giang', region: 'Mekong Delta', cm: 104.50 },
  { id: 'VN-KT', name: 'Kon Tum', region: 'Central Highlands', cm: 107.50 },
  { id: 'VN-LC', name: 'Lai Châu', region: 'Northwest', cm: 103.00 },
  { id: 'VN-LD', name: 'Lâm Đồng', region: 'Central Highlands', cm: 107.75 },
  { id: 'VN-LS', name: 'Lạng Sơn', region: 'Northeast', cm: 107.25 },
  { id: 'VN-LA', name: 'Lào Cai', region: 'Northwest', cm: 104.00 },
  { id: 'VN-LAN', name: 'Long An', region: 'Mekong Delta', cm: 105.75 },
  { id: 'VN-ND', name: 'Nam Định', region: 'Red River Delta', cm: 105.50 },
  { id: 'VN-NA', name: 'Nghệ An', region: 'North Central Coast', cm: 104.75 },
  { id: 'VN-NB', name: 'Ninh Bình', region: 'Red River Delta', cm: 105.00 },
  { id: 'VN-NT', name: 'Ninh Thuận', region: 'South Central Coast', cm: 108.25 },
  { id: 'VN-PT', name: 'Phú Thọ', region: 'Northeast', cm: 105.00 },
  { id: 'VN-PY', name: 'Phú Yên', region: 'South Central Coast', cm: 108.50 },
  { id: 'VN-QB', name: 'Quảng Bình', region: 'North Central Coast', cm: 106.00 },
  { id: 'VN-QN', name: 'Quảng Nam', region: 'South Central Coast', cm: 107.75 },
  { id: 'VN-QNG', name: 'Quảng Ngãi', region: 'South Central Coast', cm: 108.00 },
  { id: 'VN-QNI', name: 'Quảng Ninh', region: 'Northeast', cm: 107.75 },
  { id: 'VN-QT', name: 'Quảng Trị', region: 'North Central Coast', cm: 106.25 },
  { id: 'VN-ST', name: 'Sóc Trăng', region: 'Mekong Delta', cm: 105.50 },
  { id: 'VN-SL', name: 'Sơn La', region: 'Northwest', cm: 104.00 },
  { id: 'VN-TN', name: 'Tây Ninh', region: 'Southeast', cm: 105.75 },
  { id: 'VN-TB', name: 'Thái Bình', region: 'Red River Delta', cm: 105.50 },
  { id: 'VN-TNG', name: 'Thái Nguyên', region: 'Northeast', cm: 105.75 },
  { id: 'VN-TH', name: 'Thanh Hóa', region: 'North Central Coast', cm: 105.00 },
  { id: 'VN-TTH', name: 'Thừa Thiên Huế', region: 'North Central Coast', cm: 107.00 },
  { id: 'VN-TG', name: 'Tiền Giang', region: 'Mekong Delta', cm: 105.75 },
  { id: 'VN-TV', name: 'Trà Vinh', region: 'Mekong Delta', cm: 105.50 },
  { id: 'VN-TQ', name: 'Tuyên Quang', region: 'Northeast', cm: 105.00 },
  { id: 'VN-VL', name: 'Vĩnh Long', region: 'Mekong Delta', cm: 105.75 },
  { id: 'VN-VP', name: 'Vĩnh Phúc', region: 'Red River Delta', cm: 105.00 },
  { id: 'VN-YB', name: 'Yên Bái', region: 'Northwest', cm: 104.75 },
];

export const getProj4String = (cm: number, zoneType: 3 | 6 = 3) => {
  const k = zoneType === 3 ? 0.9999 : 0.9996;
  // Standard 7-parameter transformation for VN-2000 to WGS84
  return `+proj=tmerc +lat_0=0 +lon_0=${cm} +k=${k} +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-191.90441429,-39.30318279,-111.45032835,-0.00928836,0.01975479,-0.00427372,0.252906278 +units=m +no_defs`;
};

export const detectProvinceFromLon = (lon: number): ProvinceCRS | null => {
  // Find the province with the closest central meridian
  let closest = VN_PROVINCES[0];
  let minDiff = Math.abs(lon - closest.cm);
  
  for (const prov of VN_PROVINCES) {
    const diff = Math.abs(lon - prov.cm);
    if (diff < minDiff) {
      minDiff = diff;
      closest = prov;
    }
  }
  
  // If the difference is too large, it might not be in Vietnam
  if (minDiff > 3) return null;
  return closest;
};
