export default function cleanEntry(entry: string): string {
  return entry
    .replace(/^\d+\.\s*/, '') // Remove list numbers
    .replace(/\*\*|\*|_/g, ''); // Remove markdown characters
}
