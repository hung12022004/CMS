const http = require("http");

async function run() {
    try {
        const loginRes = await fetch("http://localhost:5000/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "patient@clinic.dev", 
                password: "password123"
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        if (!token) {
           console.log("Login failed", loginData);
           return;
        }
        
        // Create appointment
        const apptRes = await fetch("http://localhost:5000/api/v1/appointments", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                doctorId: "65e6b1234567890123456789", // fake
                date: "2026-03-27",
                time: "13:00",
                type: "clinic",
                reason: "Khám bệnh",
                address: ""
            })
        });
        const apptData = await apptRes.json();
        console.log("Appt status:", apptRes.status);
        console.log("Appt payload:", apptData);

    } catch(err) {
         console.error(err);
    }
}
run();
