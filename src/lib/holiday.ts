/**
 * @fileoverview Holiday and Working Day Logic
 * 
 * This module provides functionality to check if a given date is a working day
 * by querying Chinese holiday information from an external API.
 * 
 * Data source: https://github.com/NateScarlet/holiday-cn
 * - Includes all Chinese public holidays
 * - Includes makeup working days (e.g., weekends that are working days)
 * - Updated annually
 * 
 * Key concepts:
 * - Working day: Not a weekend AND (not a holiday OR is a makeup working day)
 * - Off day: Holiday with isOffDay=true
 * - Makeup day: Weekend date with isOffDay=false (e.g., Sat/Sun before Chinese New Year)
 * 
 * @module lib/holiday
 */

/**
 * Represents a single day's holiday information from the API
 */
interface HolidayDto {
  name: string;        // Holiday name (e.g., "New Year's Day", "Spring Festival")
  date: string;        // ISO date string (YYYY-MM-DD)
  isOffDay: boolean;   // true = day off, false = working day (makeup day)
}

/**
 * Response structure from the holiday API
 */
interface HolidaysResponseDto {
  year: number;        // Year of the holiday data
  days: HolidayDto[];  // Array of all special days (holidays + makeup days)
}

/**
 * Base URL for the Chinese holiday API
 * Data is fetched from GitHub repository and updated annually
 */
const HOLIDAY_API_URL = 'https://raw.githubusercontent.com/NateScarlet/holiday-cn/master';

/**
 * Fetches all holiday/special day information for a specific year from the external API.
 * 
 * Returns both holidays (days off) and makeup working days.
 * Results are cached by the browser/Node.js for the duration of the request.
 * 
 * @param year - The year to fetch holidays for (e.g., 2025)
 * @returns Array of holiday information, or empty array if fetch fails
 * 
 * @example
 * const holidays = await getHolidays(2025);
 * // Returns:
 * // [
 * //   { name: "New Year's Day", date: "2025-01-01", isOffDay: true },
 * //   { name: "Spring Festival", date: "2025-01-28", isOffDay: true },
 * //   { name: "Makeup day", date: "2025-01-26", isOffDay: false }, // Saturday working day
 * //   ...
 * // ]
 * 
 * @example
 * // Check if a specific date is a holiday
 * const holidays = await getHolidays(2025);
 * const newYear = holidays.find(h => h.date === '2025-01-01');
 * console.log(newYear.isOffDay); // true (day off)
 */
export async function getHolidays(year: number): Promise<HolidayDto[]> {
  try {
    const response = await fetch(`${HOLIDAY_API_URL}/${year}.json`);
    if (!response.ok) {
      console.error('Failed to fetch holidays:', response.statusText);
      return [];
    }

    const data: HolidaysResponseDto = await response.json();
    return data.days || [];
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return [];
  }
}

/**
 * Determines if a given date is a working day.
 * 
 * A day is considered a WORKING DAY if:
 * 1. It's NOT in the holiday API data (normal weekday) → Working day
 * 2. It's IN the API with isOffDay=false (makeup working day) → Working day
 * 3. It's a weekday (Mon-Fri) and not a holiday → Working day
 * 
 * A day is considered a NON-WORKING DAY if:
 * 1. It's in the API with isOffDay=true (public holiday) → Day off
 * 2. It's Saturday or Sunday AND not in the API → Weekend (day off)
 * 
 * Chinese holidays often have "makeup" working days where a weekend becomes
 * a working day to compensate for an extended holiday period.
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
 * // Check Chinese New Year (public holiday on a weekday)
 * const cny = new Date('2025-01-28');
 * await isWorkingDay(cny); // false (holiday, isOffDay=true)
 * 
 * @example
 * // Check makeup working day (Saturday before Chinese New Year)
 * const makeupDay = new Date('2025-01-26');
 * await isWorkingDay(makeupDay); // true (in API with isOffDay=false)
 * 
 * @see {@link getHolidays} for fetching holiday data
 */
export async function isWorkingDay(date: Date = new Date()): Promise<boolean> {
  // First check if it's a holiday
  const year = date.getFullYear();
  const holidays = await getHolidays(year);
  const dateString = date.toISOString().split('T')[0];
  const holiday = holidays.find(h => h.date === dateString);

  if (holiday) {
    // If it's a holiday, return !isOffDay
    // This means return false if it's an off day, return true if it's a working day
    return !holiday.isOffDay;
  }

  // If not a holiday, check if it's a weekend
  const dayOfWeek = date.getDay();
  return !(dayOfWeek === 0 || dayOfWeek === 6); // Return false if it's a weekend, otherwise return true
} 