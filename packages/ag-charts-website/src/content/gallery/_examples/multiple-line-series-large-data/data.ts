export function getData() {
  const amplitude = 1; // Amplitude of the wave
  const frequency = 1; // Frequency of the wave (number of cycles within 2π)
  const phase = 0; // Phase offset
  const numberOfPoints = 1000; // Number of data points

  const data = [];

  for (let i = 0; i < numberOfPoints; i++) {
    const x = ((i / (numberOfPoints - 1)) * 4 - 2) * Math.PI; // Values between -2π and 2π
    const sinX = amplitude * Math.sin(frequency * x + phase);
    const cosX = amplitude * Math.cos(frequency * x + phase);
    let tanX: number | null = amplitude * Math.tan(frequency * x + phase);
    let cscX: number | null = 1 / sinX;
    let secX: number | null = 1 / cosX;
    let cotX: number | null = 1 / tanX;

    // Skip values above 4 and below -4
    if (tanX > 4 || tanX < -4) {
      tanX = null;
    }
    if (cscX > 4 || cscX < -4) {
      cscX = null;
    }
    if (secX > 4 || secX < -4) {
      secX = null;
    }
    if (cotX > 4 || cotX < -4) {
      cotX = null;
    }

    data.push({ x, sinX, cosX, tanX, cscX, secX, cotX });
  }

  return data;
}
