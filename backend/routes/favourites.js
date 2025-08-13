//backend/routes/favourites.js
const express = require("express");
const router = express.Router();
const client = require("../db");

// =======================
// ADD to Favourites 
// =======================
router.post("/", async (req, res) => {
    const { PassengerID, DriverID, CreatedAt } = req.body;

    if (!PassengerID || !DriverID) {
        return res.status(400).json({ success: false, message: "Missing PassengerID or DriverID" });
    }

    try {
        const query = `
      INSERT INTO "Favourites" ("PassengerID", "DriverID", "CreatedAt")
      VALUES ($1, $2, $3)
    `;
        console.log('favourite info: P/D/C ', PassengerID, DriverID, CreatedAt)

        await client.query(query, [PassengerID, DriverID, CreatedAt ? new Date(CreatedAt) : new Date()]);

        res.json({ success: true, message: "Favourite added successfully" });
    } catch (err) {
        console.error("Error adding favourite:", err);
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// =======================
// REMOVE from Favourites
// =======================
router.delete("/", async (req, res) => {
    const { PassengerID, DriverID } = req.body;

    if (!PassengerID || !DriverID) {
        return res.status(400).json({ success: false, message: "Missing PassengerID or DriverID" });
    }

    try {
        const query = `
      DELETE FROM "Favourites"
      WHERE "PassengerID" = $1 AND "DriverID" = $2
    `;

        await client.query(query, [PassengerID, DriverID]);

        res.json({ success: true, message: "Favourite removed successfully" });
    } catch (err) {
        console.error("Error removing favourite:", err);
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// =======================
// GET all Favourites for a Passenger
// =======================
router.get("/:passengerId", async (req, res) => {
    try {
        const { passengerId } = req.params;

        // Validate passengerId is a number
        if (!passengerId || isNaN(passengerId)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid PassengerID" 
            });
        }

        const numericPassengerId = parseInt(passengerId, 10);

        // First check if passenger exists in Favourites table
        const existsCheck = await client.query(
            `SELECT 1 FROM "Favourites" WHERE "PassengerID" = $1 LIMIT 1`,
            [numericPassengerId]
        );

        // If passenger has no favorites, return empty array
        if (existsCheck.rows.length === 0) {
            return res.json({ 
                success: true,
                exists: false,
                favourites: [] 
            });
        }

        // If passenger exists, fetch their favorite drivers
        const result = await client.query(
            `SELECT "DriverID" FROM "Favourites" WHERE "PassengerID" = $1`,
            [numericPassengerId]
        );

        const driverIds = result.rows.map(row => row.DriverID);

        res.json({
            success: true,
            exists: true,
            favourites: driverIds
        });

    } catch (err) {
        console.error("Error fetching favourites:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


module.exports = router;
