/**
 * @fileoverview Holiday and Working Day Logic
 * 
 * This module provides functionality to check if a given date is a working day
 * by querying Vietnam holiday information from an external API.
 * 
 * Data source: https://date.nager.at - Nager.Date Public Holiday API
 * - Includes all Vietnam public holidays
 * - Free and open-source API
 * - No authentication required
 * - Automatically updated
 * 
 * Key concepts:
 * - Working day: Not a weekend AND not a public holiday
 * - Off day: Public holiday or weekend
 * 
 * Note: Vietnam typically does not have "makeup" working days like China,
 * so weekends are consistently non-working days.
 * 
 * @module lib/holiday
 */

/**
 * Represents a single day's holiday information from the Nager.Date API
 */
interface HolidayDto {
  date: string;        // ISO date string (YYYY-MM-DD)
  localName: string;   // Holiday name in Vietnamese
  name: string;        // Holiday name in English
  countryCode: string; // Country code (VN)
  fixed: boolean;      // Whether the date is fixed every year
  global: boolean;     // Whether it's a nationwide holiday
  counties: string[] | null; // Specific counties if applicable
  launchYear: number | null; // Year the holiday was introduced
  types: string[];     // Holiday types (e.g., "Public")
}

/**
 * Base URL for the Vietnam holiday API (Nager.Date)
 * This API provides public holiday information for countries worldwide
 */
const HOLIDAY_API_URL = 'https://date.nager.at/api/v3/PublicHolidays';

/**
 * Fetches all public holiday information for Vietnam for a specific year from the Nager.Date API.
 * 
 * Returns all Vietnam public holidays for the specified year.
 * Results are cached by the browser/Node.js for the duration of the request.
 * 
 * @param year - The year to fetch holidays for (e.g., 2025)
 * @returns Array of holiday information, or empty array if fetch fails
 * 
 * @example
 * const holidays = await getHolidays(2025);
 * // Returns:
 * // [
 * //   { date: "2025-01-01", name: "New Year's Day", localName: "Tết Dương lịch", ... },
 * //   { date: "2025-01-28", name: "Lunar New Year", localName: "Tết Nguyên Đán", ... },
 * //   { date: "2025-04-30", name: "Reunification Day", localName: "Ngày Thống nhất", ... },
 * //   ...
 * // ]
 * 
 * @example
 * // Check if a specific date is a holiday
 * const holidays = await getHolidays(2025);
 * const newYear = holidays.find(h => h.date === '2025-01-01');
 * console.log(newYear?.name); // "New Year's Day"
 */
export async function getHolidays(year: number): Promise<HolidayDto[]> {
  try {
    const response = await fetch(`${HOLIDAY_API_URL}/${year}/VN`);
    if (!response.ok) {
      console.error('Failed to fetch Vietnam holidays:', response.statusText);
      return [];
    }

    const data: HolidayDto[] = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching Vietnam holidays:', error);
    return [];
  }
}

/**
 * Determines if a given date is a working day in Vietnam.
 * 
 * A day is considered a WORKING DAY if:
 * 1. It's a weekday (Monday-Friday) AND
 * 2. It's NOT a Vietnam public holiday
 * 
 * A day is considered a NON-WORKING DAY if:
 * 1. It's a weekend (Saturday or Sunday) OR
 * 2. It's a Vietnam public holiday
 * 
 * Note: Unlike China, Vietnam does not typically have "makeup" working days
 * where weekends become working days to compensate for extended holidays.
 * 
 * @param date - The date to check (defaults to today)
 * @returns true if it's a working day, false if it's a day off
 * 
 * @example
 * // Check a normal weekday (Monday)
 * const monday = new Date('2025-01-06');
 * await isWorkingDay(monday); // true
 * 
 * @example
 * // Check a normal weekend (Saturday)
 * const saturday = new Date('2025-01-04');
 * await isWorkingDay(saturday); // false
 * 
 * @example
 * // Check Lunar New Year (public holiday on a weekday)
 * const tet = new Date('2025-01-29');
 * await isWorkingDay(tet); // false (Vietnam public holiday)
 * 
 * @example
 * // Check Reunification Day (April 30)
 * const reunificationDay = new Date('2025-04-30');
 * await isWorkingDay(reunificationDay); // false (Vietnam public holiday)
 * 
 * @see {@link getHolidays} for fetching holiday data
 */
export async function isWorkingDay(date: Date = new Date()): Promise<boolean> {
  // First check if it's a weekend
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false; // Saturday or Sunday is always a non-working day
  }

  // Check if it's a public holiday
  const year = date.getFullYear();
  const holidays = await getHolidays(year);
  const dateString = date.toISOString().split('T')[0];
  const isHoliday = holidays.some(h => h.date === dateString);

  // Return false if it's a holiday, true if it's a normal weekday
  return !isHoliday;
} 