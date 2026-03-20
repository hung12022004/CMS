const formatAppointmentDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    // Trả về định dạng DD/MM/YYYY
    return date.toLocaleDateString('vi-VN');
};

module.exports = { formatAppointmentDate }; 