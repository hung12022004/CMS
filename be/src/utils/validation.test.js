// src/utils/validation.test.js
const { isValidEmail } = require('./validation');

describe('Kiểm thử hàm isValidEmail', () => {

    test('Nên trả về true với email hợp lệ', () => {
        // Arrange (Chuẩn bị dữ liệu)
        const email = 'test@gmail.com';

        // Act (Thực thi hàm)
        const result = isValidEmail(email);

        // Assert (Xác nhận kết quả)
        expect(result).toBe(true);
    });

    test('Nên trả về false nếu email thiếu @', () => {
        expect(isValidEmail('testgmail.com')).toBe(false);
    });

    test('Nên trả về false nếu truyền vào chuỗi rỗng hoặc null', () => {
        expect(isValidEmail('')).toBe(false);
        expect(isValidEmail(null)).toBe(false);
    });

});