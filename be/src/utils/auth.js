const canAccessMedicalRecords = (userRole) => {
    const authorizedRoles = ['Admin', 'Doctor'];
    return authorizedRoles.includes(userRole);
};

module.exports = { canAccessMedicalRecords };