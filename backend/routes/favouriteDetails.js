const express = require("express");
const router = express.Router();
const client = require("../db");

// =======================
// GET favourite driver details for a passenger with time-decay rating algorithm
// =======================
router.get("/passenger/:passengerId/details", async (req, res) => {
    console.log("🛠 [Route Hit] /passenger/:passengerId/details");

    try {
        const { passengerId } = req.params;
        console.log("📥 Incoming PassengerID:", passengerId);

        // Validate passengerId
        if (!passengerId || isNaN(passengerId)) {
            console.warn("⚠ Invalid PassengerID received:", passengerId);
            return res.status(400).json({ success: false, message: "Invalid PassengerID" });
        }

        const numericPassengerId = parseInt(passengerId, 10);
        console.log("✅ Parsed PassengerID as number:", numericPassengerId);

        // SQL query with time-decay weighted ratings
        const query = `
            WITH driver_ratings AS (
                SELECT 
                    f."DriverID",
                    d."UserID",
                    u."username",
                    v."VehicleModel",
                    v."color",
                    v."PlateNumber",
                    u."photo_url",
                    fe."RateValue",
                    fe."CreatedAt",
                    -- Calculate time decay weight (recent ratings have higher weight)
                    EXP(-0.1 * EXTRACT(DAY FROM (NOW() - fe."CreatedAt"))/30) AS time_weight
                FROM "Favourites" f
                JOIN "Driver" d ON f."DriverID" = d."DriverID"
                JOIN "User" u ON d."UserID" = u."UserID"
                JOIN "Vehicle" v ON d."DriverID" = v."DriverID"
                LEFT JOIN "Feedback" fe ON f."DriverID" = fe."DriverID"
                WHERE f."PassengerID" = $1
            )
            SELECT 
                "DriverID",
                "UserID",
                "username",
                "VehicleModel",
                "color",
                "PlateNumber",
                "photo_url",
                -- Weighted average rating
                ROUND(
                    CASE 
                        WHEN SUM(time_weight) > 0 
                        THEN SUM("RateValue" * time_weight) / SUM(time_weight)
                        ELSE 4.5 -- Default rating if no feedback
                    END, 1
                ) AS "WeightedRating",
                COUNT("RateValue") AS "RatingCount",
                -- Most recent rating date
                MAX("CreatedAt") AS "LastRatingDate"
            FROM driver_ratings
            GROUP BY 
                "DriverID", "UserID", "username", "VehicleModel", 
                "color", "PlateNumber", "photo_url"
        `;

        console.log("📤 Executing SQL query for PassengerID:", numericPassengerId);
        const result = await client.query(query, [numericPassengerId]);
        console.log("📦 Raw DB Result:", result.rows);

        if (result.rows.length === 0) {
            console.log("ℹ No favourite drivers found for PassengerID:", numericPassengerId);
            return res.json({
                success: true,
                favourites: []
            });
        }

        // Map DB result to clean response with additional rating info
        const favourites = result.rows.map(row => ({
            DriverID: row.DriverID,
            UserID: row.UserID,
            username: row.username,
            VehicleModel: row.VehicleModel,
            color: row.color,
            PlateNumber: row.PlateNumber,
            photo_url: row.photo_url,
            Rating: parseFloat(row.WeightedRating),
            RatingCount: parseInt(row.RatingCount, 10),
            LastRatingDate: row.LastRatingDate,
            // Additional calculated field for UI to show if recently rated
            IsRecentlyRated: row.LastRatingDate 
                ? new Date(row.LastRatingDate) > new Date(Date.now() - 30*24*60*60*1000)
                : false
        }));

        console.log("✅ Final formatted favourites object:", favourites);

        res.json({
            success: true,
            favourites
        });

    } catch (err) {
        console.error("❌ Error fetching favourite driver details:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;