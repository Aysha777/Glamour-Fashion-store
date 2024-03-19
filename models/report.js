// models/report.js

const mongoose = require("mongoose");

// Define the schema for the report
const reportSchema = new mongoose.Schema({
  // Define the schema fields based on your report requirements
  date: {
    type: Date,
    required: true,
  },
  totalSales: {
    type: Number,
    required: true,
  },
  totalRevenue: {
    type: Number,
    required: true,
  },
  // Add other fields as needed
});

// Create the Report model
const Report = mongoose.model("Report", reportSchema);

// Export the model
module.exports = Report;
