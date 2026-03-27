const mongoose = require("mongoose");
const Appointment = require("./src/models/Appointment");

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/clinic_cms");
        console.log("Connected to MongoDB.");

        const testAppointment = new Appointment({
            patientId: new mongoose.Types.ObjectId(),
            doctorId: new mongoose.Types.ObjectId(),
            date: "2026-03-27",
            time: "13:00",
            type: "clinic",
            reason: "Khám bệnh",
            address: "HCMC",
            status: "pending"
        });

        const validationError = testAppointment.validateSync();
        if (validationError) {
             console.log("Validation Error:", validationError);
        } else {
             console.log("Schema validation passed.");
             await testAppointment.save();
             console.log("Successfully saved!");
             await Appointment.deleteOne({ _id: testAppointment._id });
        }
    } catch(err) {
        console.error("Test error:", err);
    } finally {
        mongoose.disconnect();
    }
}

test();
