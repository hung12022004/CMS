const { canAccessMedicalRecords } = require('./auth');

describe('Unit Test: Phân quyền truy cập hồ sơ bệnh án', () => {
    test('Nên trả về true nếu role là Doctor hoặc Admin', () => {
        expect(canAccessMedicalRecords('Doctor')).toBe(true);
        expect(canAccessMedicalRecords('Admin')).toBe(true);
    });

    test('Nên trả về false nếu role là Patient', () => {
        expect(canAccessMedicalRecords('Patient')).toBe(false);
    });

    test('Nên trả về false nếu role bị rỗng hoặc không xác định', () => {
        expect(canAccessMedicalRecords(null)).toBe(false);
        expect(canAccessMedicalRecords('Guest')).toBe(false);
    });
});