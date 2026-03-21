// src/utils/validation.js
const isValidEmail = (email) => {
    if (!email) return false;

    // Biểu thức chính quy kiểm tra email cơ bản
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

module.exports = { isValidEmail };
