export function incrementSerial(lastSerial: string | null, prefix: string = 'PROD'): string {
  if (!lastSerial) {
    return `${prefix}001`;
  }

  // Extract the numeric part
  const match = lastSerial.match(/(\d+)$/);
  if (!match) {
    return `${prefix}001`;
  }

  const numberPart = match[0];
  const prefixPart = lastSerial.substring(0, lastSerial.length - numberPart.length);
  const nextNumber = parseInt(numberPart, 10) + 1;
  const paddedNumber = nextNumber.toString().padStart(numberPart.length, '0');

  return `${prefixPart}${paddedNumber}`;
}
