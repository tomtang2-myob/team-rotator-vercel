interface HolidayDto {
  name: string;
  date: string;
  isOffDay: boolean;
}

interface HolidaysResponseDto {
  year: number;
  days: HolidayDto[];
}

const HOLIDAY_API_URL = 'https://raw.githubusercontent.com/NateScarlet/holiday-cn/master';

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