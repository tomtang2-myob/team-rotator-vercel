import { POST } from '../restart-rotation/route';
import { kickoffSprint } from '@/services/assignments';

// Mock the kickoffSprint service
jest.mock('@/services/assignments', () => ({
  kickoffSprint: jest.fn(),
}));

describe('Sprint Kickoff API - Timezone Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse date string as local date, not UTC (timezone fix)', async () => {
    const mockKickoffSprint = kickoffSprint as jest.MockedFunction<typeof kickoffSprint>;
    mockKickoffSprint.mockResolvedValue({ 
      success: true, 
      message: 'Sprint kicked off successfully from 2026-01-07' 
    });

    // Simulate user selecting Jan 7, 2026 from date picker
    const requestBody = { startDate: '2026-01-07' };
    const request = new Request('http://localhost:3000/api/assignments/restart-rotation', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    await POST(request);

    // Verify kickoffSprint was called with correct local date
    expect(mockKickoffSprint).toHaveBeenCalledWith(
      expect.any(Date)
    );

    const calledDate = mockKickoffSprint.mock.calls[0][0];
    
    // The date should be Jan 7 in local time, not shifted by timezone
    expect(calledDate.getFullYear()).toBe(2026);
    expect(calledDate.getMonth()).toBe(0); // January (0-indexed)
    expect(calledDate.getDate()).toBe(7); // 7th day
    expect(calledDate.getHours()).toBe(0);
    expect(calledDate.getMinutes()).toBe(0);
    expect(calledDate.getSeconds()).toBe(0);

    console.log('✅ Date parsed correctly as local time:', calledDate.toISOString());
    console.log('   Local date string:', calledDate.toLocaleDateString());
  });

  it('should handle date with timezone offset correctly', async () => {
    const mockKickoffSprint = kickoffSprint as jest.MockedFunction<typeof kickoffSprint>;
    mockKickoffSprint.mockResolvedValue({ 
      success: true, 
      message: 'Sprint kicked off successfully' 
    });

    // Test with a date that would fail with old UTC parsing
    const requestBody = { startDate: '2026-01-15' };
    const request = new Request('http://localhost:3000/api/assignments/restart-rotation', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    await POST(request);

    const calledDate = mockKickoffSprint.mock.calls[0][0];
    
    // Should be Jan 15, not Jan 14 (in timezones ahead of UTC)
    expect(calledDate.getDate()).toBe(15);
  });
});

