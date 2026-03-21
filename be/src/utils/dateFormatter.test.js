const { formatAppointmentDate } = require('./dateFormatter');

describe('Unit Test: Định dạng ngày hẹn khám', () => {
    test('Nên chuyển đổi định dạng ISO sang định dạng Việt Nam (DD/MM/YYYY)', () => {
        const input = '2026-03-18T10:00:00Z';
        // Kết quả tùy vào múi giờ, ở VN thường là 18/03/2026
        expect(formatAppointmentDate(input)).toContain('18/3/2026');
    });

    test('Nên trả về N/A nếu đầu vào trống', () => {
        expect(formatAppointmentDate(null)).toBe('N/A');
    });

    test('Nên báo Invalid Date nếu chuỗi ngày không hợp lệ', () => {
        expect(formatAppointmentDate('abc-xyz')).toBe('Invalid Date');
    });
});