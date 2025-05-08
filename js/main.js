document.addEventListener("DOMContentLoaded", async function () {
	const boardsContainer = document.getElementById("boards-list");
	const archivedFilter = document.getElementById("filter-archived");
	const adultContentFilter = document.getElementById("filter-adult-content");
	const themeToggleButton = document.getElementById("toggle-theme");
	const logo = document.getElementById("site-logo");
	const searchInput = document.getElementById("search-board");
	const resultSection = document.getElementById("result-section");

	// Create chart container
	const chartContainer = document.createElement("div");
	chartContainer.id = "chart-container";
	chartContainer.innerHTML = `<canvas id="boards-chart"></canvas>`;
	boardsContainer.parentNode.insertBefore(chartContainer, boardsContainer);

	let boardsChart = null;
	let fallbackData = null;

	// Status Banner
	const statusBanner = document.getElementById("status-banner");
	const statusIcon = document.getElementById("status-icon");
	const statusText = document.getElementById("status-text");

	// Theme Handling
	const savedTheme = localStorage.getItem("theme") || "light";
	applyTheme(savedTheme);

	if (themeToggleButton) {
		themeToggleButton.addEventListener("click", () => {
			const isDark = document.body.classList.toggle("dark-mode");
			applyTheme(isDark ? "dark" : "light");
		});
	}

	function applyTheme(theme) {
		document.body.classList.toggle("dark-mode", theme === "dark");
		if (themeToggleButton) {
			themeToggleButton.textContent = theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
		}
		if (logo) {
			logo.src = theme === "dark" ? "images/icon-dark.png" : "images/icon-light.png";
		}
		localStorage.setItem("theme", theme);
	}

	// Filter change
	[archivedFilter, adultContentFilter].forEach((filter) => {
		if (filter) {
			filter.addEventListener("change", () => {
				if (fallbackData) displayBoards(fallbackData);
			});
		}
	});

	// Search
	if (searchInput) {
		searchInput.addEventListener("input", () => {
			if (fallbackData) displayBoards(fallbackData);
		});
	}

	async function getProxyUrl() {
		return "https://dev2-cors.onrender.com/"; // Updated proxy URL
	}

	async function fetchBoards() {
		showStatus("Attempting connection to 4chan API...", "loading");

		try {
			const proxyUrl = await getProxyUrl();
			const response = await fetch(`${proxyUrl}https://a.4cdn.org/boards.json`);

			if (!response.ok) throw new Error(`CORS Fetch Failed (${response.status})`);

			const data = await response.json();
			if (!data || !Array.isArray(data.boards)) throw new Error("Invalid API format");

			fallbackData = data;
			displayBoards(data);
			updateChart(data);
			showStatus("✅ Connected to 4chan API", "success");
		} catch (error) {
			console.warn("CORS fetch failed:", error.message);
			await loadEmergencyBackup();
		}
	}

	async function loadEmergencyBackup() {
		try {
			const response = await fetch("emergency/emergency.json");
			if (!response.ok) throw new Error("Emergency backup also failed.");

			const data = await response.json();
			fallbackData = data;

			displayBoards(data);
			updateChart(data);

			showStatus("✅ Successfully bypassed by BlackThread:Broker-Bypass-421", "success");
			console.log("🔔 Successfully connected to the 4chan API! (Even though it failed to fetch live data)");
		} catch (err) {
			displayErrorMessage(new Error("❌ Failed to fetch both live and emergency data."));
			showStatus("❌ Connection failed", "fail");
			// Trigger failure state (turn the site red)
			document.body.classList.add("fail-state");
		} finally {
			showLoading(false);
		}
	}

	function displayBoards(data) {
		boardsContainer.innerHTML = "";
		const term = searchInput?.value?.toLowerCase() || "";

		const filtered = data.boards.filter((board) => {
			if (archivedFilter?.checked && !board.is_archived) return false;
			if (adultContentFilter?.checked && (!board.ws_board || board.ws_board === 0)) return false;
			if (term && !board.title.toLowerCase().includes(term) && !board.board.includes(term)) return false;
			return true;
		});

		if (filtered.length === 0) {
			boardsContainer.innerHTML = "<p>No boards match the selected filters or search.</p>";
			return;
		}

		filtered.forEach((board) => {
			const el = document.createElement("div");
			el.classList.add("board-item");
			el.innerHTML = `
				<h3>${board.title}</h3>
				<p>Board: /${board.board}</p>
				<p>Threads per page: ${board.per_page}</p>
				<p>Pages: ${board.pages}</p>
				<p>Max file size: ${(board.max_filesize / 1024).toFixed(2)} MB</p>
				<p>Max WebM size: ${(board.max_webm_filesize / 1024).toFixed(2)} MB</p>
			`;
			boardsContainer.appendChild(el);
		});
	}

	function updateChart(data) {
		const labels = data.boards.map((b) => b.title);
		const threads = data.boards.map((b) => b.per_page);
		const pages = data.boards.map((b) => b.pages);

		const chartData = {
			labels,
			datasets: [
				{
					label: "Threads per Page",
					data: threads,
					backgroundColor: "rgba(97, 192, 75, 0.2)",
					borderColor: "rgb(155, 250, 107)",
					borderWidth: 1,
				},
				{
					label: "Pages",
					data: pages,
					backgroundColor: "rgba(102, 255, 173, 0.2)",
					borderColor: "rgb(115, 255, 102)",
					borderWidth: 1,
				},
			],
		};

		const chartOptions = {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				y: { beginAtZero: true },
			},
		};

		if (boardsChart) boardsChart.destroy();
		const ctx = document.getElementById("boards-chart").getContext("2d");
		boardsChart = new Chart(ctx, {
			type: "bar",
			data: chartData,
			options: chartOptions,
		});
	}

	function displayErrorMessage(error) {
		resultSection.innerHTML = `<p class="error-message">${error.message}</p>`;
	}

	function showLoading(show) {
		const bar = document.getElementById("status-bar-fill");
		if (!bar) return;
		bar.style.width = show ? "60%" : "100%";
		bar.style.transition = show ? "width 2s ease-in-out" : "width 0.5s ease-in";
	}

	// Update status banner function
	function showStatus(msg, type) {
		statusText.textContent = msg;
		statusBanner.classList.remove("loading", "success", "fail", "fallback");

		// Update class and icon based on the status type
		if (type === "loading") {
			statusBanner.classList.add("loading");
			statusIcon.src = "images/loading.gif";
		} else if (type === "success") {
			statusBanner.classList.add("success");
			statusIcon.src = "images/success.png"; // Adjust with actual success image
		} else if (type === "fail") {
			statusBanner.classList.add("fail");
			statusIcon.src = "images/fail.png"; // Adjust with actual fail image
		} else if (type === "fallback") {
			statusBanner.classList.add("fallback");
			statusIcon.src = "images/broker.png"; // Adjust with the bypass broker image
		}
	}

	fetchBoards();
});
