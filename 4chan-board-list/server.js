const express = require("express");
const fetch = require("node-fetch"); // If you haven't already installed this

const app = express();
const port = 3000;

// Serve static files (index.html, CSS, JS) from the 'dev-api' folder
app.use(express.static("dev-api"));

// API endpoint to fetch board data
app.get("/api/boards", async (req, res) => {
	try {
		const response = await fetch("https://a.4cdn.org/boards.json"); // This is the external URL for fetching the 4chan boards data
		const data = await response.json();
		res.json(data); // Send the data back to the frontend
	} catch (error) {
		console.error("Error fetching data:", error);
		res.status(500).json({ error: "Failed to fetch boards" });
	}
});

// Start the server
app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`);
});
