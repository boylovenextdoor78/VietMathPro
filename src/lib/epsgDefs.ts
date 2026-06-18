import proj4 from 'proj4';

export const EPSG_DEFS: Record<string, string> = {
  'EPSG:4326': '+proj=longlat +datum=WGS84 +no_defs',
  'EPSG:4269': '+proj=longlat +ellps=GRS80 +datum=NAD83 +no_defs',
  'EPSG:3857': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs',
  'EPSG:26910': '+proj=utm +zone=10 +ellps=GRS80 +datum=NAD83 +units=m +no_defs',
  'EPSG:26917': '+proj=utm +zone=17 +ellps=GRS80 +datum=NAD83 +units=m +no_defs',
  'EPSG:3405': '+proj=utm +zone=48 +ellps=WGS84 +towgs84=-191.90441429,-39.30318279,-111.45032835,-0.00928836,0.01975479,-0.00427372,0.252906278 +units=m +no_defs',
  'EPSG:3406': '+proj=utm +zone=49 +ellps=WGS84 +towgs84=-191.90441429,-39.30318279,-111.45032835,-0.00928836,0.01975479,-0.00427372,0.252906278 +units=m +no_defs',
  'EPSG:6957': '+proj=tmerc +lat_0=0 +lon_0=105 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-191.90441429,-39.30318279,-111.45032835,-0.00928836,0.01975479,-0.00427372,0.252906278 +units=m +no_defs',
  'EPSG:5897': '+proj=tmerc +lat_0=0 +lon_0=107.75 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-191.90441429,-39.30318279,-111.45032835,-0.00928836,0.01975479,-0.00427372,0.252906278 +units=m +no_defs',
  'EPSG:9210': '+proj=tmerc +lat_0=0 +lon_0=105.75 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-191.90441429,-39.30318279,-111.45032835,-0.00928836,0.01975479,-0.00427372,0.252906278 +units=m +no_defs', // HCM
  'EPSG:4549': '+proj=tmerc +lat_0=0 +lon_0=106.75 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-191.90441429,-39.30318279,-111.45032835,-0.00928836,0.01975479,-0.00427372,0.252906278 +units=m +no_defs', // Thu Duc
};

export const EPSG_OPTIONS = [
  { value: 'EPSG:4326', label: 'EPSG:4326 (WGS 84 - Lat/Lon)' },
  { value: 'EPSG:3857', label: 'EPSG:3857 (Web Mercator)' },
  { value: 'EPSG:4269', label: 'EPSG:4269 (NAD83)' },
  { value: 'EPSG:26910', label: 'EPSG:26910 (NAD83 UTM 10N)' },
  { value: 'EPSG:26917', label: 'EPSG:26917 (NAD83 UTM 17N)' },
  { value: 'EPSG:3405', label: 'EPSG:3405 (VN-2000 UTM 48N)' },
  { value: 'EPSG:3406', label: 'EPSG:3406 (VN-2000 UTM 49N)' },
  { value: 'EPSG:6957', label: 'EPSG:6957 (VN-2000 TM-3 105E)' },
  { value: 'EPSG:5897', label: 'EPSG:5897 (VN-2000 TM-3 107.75E)' },
  { value: 'EPSG:9210', label: 'EPSG:9210 (VN-2000 HCM)' },
  { value: 'EPSG:4549', label: 'EPSG:4549 (VN-2000 Thu Duc)' },
];

// Initialize proj4 definitions
Object.entries(EPSG_DEFS).forEach(([code, def]) => {
  proj4.defs(code, def);
});

export const convertToWGS84 = (x: number, y: number, fromEpsg: string): [number, number] => {
  if (fromEpsg === 'EPSG:4326') return [x, y]; // already lon, lat
  try {
    // proj4(from, to, [x, y]) returns [lon, lat]
    return proj4(fromEpsg, 'EPSG:4326', [x, y]);
  } catch (e) {
    console.error("Projection error:", e);
    return [0, 0];
  }
};
