export type StationData = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    speed: number; // Wind speed
    direction: number; // Wind direction in degrees
    u: number; // East-West component
    v: number; // North-South component
  };
  
  export const fetchWindData = async (): Promise<StationData[]> => {
    // Fetch wind speed data
    const windSpeedResponse = await fetch(
      "https://api-open.data.gov.sg/v2/real-time/api/wind-speed"
    );
    const windSpeedData = await windSpeedResponse.json();
    // console.log(`Wind Speed API: ${windSpeedData.data.stations.length} stations, ${windSpeedData.data.readings[0].data.length} readings`);
  
    // Fetch wind direction data
    const windDirectionResponse = await fetch(
      "https://api-open.data.gov.sg/v2/real-time/api/wind-direction"
    );
    const windDirectionData = await windDirectionResponse.json();
    // console.log(`Wind Direction API: ${windDirectionData.data.stations.length} stations, ${windDirectionData.data.readings[0].data.length} readings`);
  
    // Combine wind speed and direction data
    const stations = windSpeedData.data.stations.map((station: any) => {
      const speedReading = windSpeedData.data.readings[0].data.find(
        (d: any) => d.stationId === station.id
      );
      const directionReading = windDirectionData.data.readings[0].data.find(
        (d: any) => d.stationId === station.id
      );
  
      const speed = speedReading?.value || 0;
      const direction = directionReading?.value || 0;
  
      const new_direction = (direction + 180) % 360

      // Calculate U and V components
      const radians = (new_direction * Math.PI) / 180;
      const u = speed * Math.sin(radians);
      const v = speed * Math.cos(radians);
      
  
  
      return {
        id: station.id,
        name: station.name,
        latitude: station.location.latitude,
        longitude: station.location.longitude,
        speed,
        new_direction,
        u,
        v,
      };
    });
  
    return stations;
  };
  