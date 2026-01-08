
import { LocationInfo } from '../types';

export const geocodeCity = async (city: string): Promise<LocationInfo | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'GeomagDashboard/1.0',
        },
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      const result = data[0];
      return {
        name: city,
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        display_name: result.display_name,
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to search city. Please check your connection.');
  }
};
