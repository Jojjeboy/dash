import axios from 'axios';

// @todo: Move these to .env for production
const CLIENT_KEY = '5fbMy91HgWCOSU4HKMmh93PM61Ya';
const CLIENT_SECRET = 'NQffPpEowiFjxMN2UILUpLsyDbIa';

export interface Station {
  gid: string;
  name: string;
  shortName: string;
}

export const STATIONS: Station[] = [
  { gid: '9021014004730000', name: 'Mariaplan', shortName: 'Mariaplan' },
  { gid: '9021014005220000', name: 'Ostindiegatan', shortName: 'Ostindiegatan' },
  { gid: '9021014003610000', name: 'Jaegerdorffsplatsen', shortName: 'Jaegerdorffsplatsen' },
  { gid: '9021014003895000', name: 'Klippans Färjeläge', shortName: 'Klippans Färjeläge' }
];

async function getAccessToken(): Promise<string> {
  const authString = btoa(`${CLIENT_KEY}:${CLIENT_SECRET}`);

  try {
    const response = await axios.post(
      'https://ext-api.vasttrafik.se/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authString}`
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Failed to get access token:", error);
    throw error;
  }
}

export interface Departure {
  serviceJourney: {
    line: {
      shortName: string;
      backgroundColor: string;
      foregroundColor: string;
    };
    direction: string;
  };
  stopPoint: {
    platform: string;
  };
  estimatedTime?: string;
  plannedTime: string;
}

export async function getDepartures(gid: string): Promise<Departure[]> {
  try {
    const token = await getAccessToken();

    const response = await axios.get(
      `https://ext-api.vasttrafik.se/pr/v4/stop-areas/${gid}/departures`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          limit: 20
        }
      }
    );

    return response.data.results;
  } catch (error) {
    console.error("Error fetching departures:", error);
    throw error;
  }
}
