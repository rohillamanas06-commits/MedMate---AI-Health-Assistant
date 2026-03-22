import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to parse naive UTC date strings from the backend into correct local JS Date objects
export function parseUTCDate(dateStr: string | Date | undefined): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  // Replace space with T to ensure ISO format (e.g. "2026-03-22 18:37:11" -> "2026-03-22T18:37:11")
  let isoStr = dateStr.replace(' ', 'T');
  
  // If no timezone indicator (Z or +/- offset), treat as UTC by appending 'Z'
  if (!isoStr.endsWith('Z') && !isoStr.match(/[+-]\d{2}:?\d{2}$/)) {
    isoStr += 'Z';
  }
  return new Date(isoStr);
}
