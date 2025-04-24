document.addEventListener("DOMContentLoaded", async function () {
	const boardsContainer = document.getElementById("boards-list");
	const archivedFilter = document.getElementById("filter-archived");
	const adultContentFilter = document.getElementById("filter-adult-content");
	const themeToggleButton = document.getElementById("toggle-theme");

	const chartContainer = document.createElement("div");
	chartContainer.id = "chart-container";
	chartContainer.innerHTML = `<canvas id="boards-chart"></canvas>`;
	boardsContainer.parentNode.insertBefore(chartContainer, boardsContainer);

	let boardsChart = null;
	let fallbackData = null; // Save last good data

	// Apply saved theme
	const savedTheme = localStorage.getItem("theme") || "light";
	applyTheme(savedTheme);

	// Event: Toggle theme
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
		localStorage.setItem("theme", theme);
	}

	// Event: Filters
	[archivedFilter, adultContentFilter].forEach((filter) =>
		filter.addEventListener("change", () => {
			if (fallbackData) displayBoards(fallbackData);
		})
	);

	// Get proxy (only one now)
	async function getProxyUrl() {
		return "https://cors-anywhere.herokuapp.com/";
	}

	// Fetch board data
	async function fetchBoards() {
		try {
			const proxyUrl = await getProxyUrl();
			const response = await fetch(`${proxyUrl}https://a.4cdn.org/boards.json`);

			if (!response.ok) throw new Error(`Fetch failed (${response.status})`);

			const rawText = await response.text();
			const data = JSON.parse(rawText);

			if (!data || !Array.isArray(data.boards)) throw new Error("Invalid data format: 'boards' missing or malformed");

			// Save fallback
			fallbackData = data;

			displayBoards(data);
			updateChart(data);
		} catch (error) {
			console.error("🚨 Fetch error:", error.message);

			if (fallbackData) {
				displayBoards(fallbackData);
				updateChart(fallbackData);
				displayErrorMessage(new Error("Loaded last known good data. Live fetch failed."));
			} else {
				displayErrorMessage(error);
			}
		}
	}

	function displayBoards(data) {
		boardsContainer.innerHTML = "";

		const filteredBoards = data.boards.filter((board) => {
			if (archivedFilter.checked && !board.is_archived) return false;
			if (adultContentFilter.checked && (board.ws_board === undefined || board.ws_board === 0)) return false;
			return true;
		});

		if (filteredBoards.length === 0) {
			boardsContainer.innerHTML = "<p>No boards match the selected filters.</p>";
			return;
		}

		filteredBoards.forEach((board) => {
			const boardElement = document.createElement("div");
			boardElement.classList.add("board-item");
			boardElement.innerHTML = `
				<h3>${board.title}</h3>
				<p>Board: /${board.board}</p>
				<p>Threads per page: ${board.per_page}</p>
				<p>Pages: ${board.pages}</p>
				<p>Max file size: ${(board.max_filesize / 1024).toFixed(2)} MB</p>
				<p>Max WebM size: ${(board.max_webm_filesize / 1024).toFixed(2)} MB</p>
			`;
			boardsContainer.appendChild(boardElement);
		});
	}

	function updateChart(data) {
		const labels = data.boards.map((b) => b.title);
		const threadsPerPage = data.boards.map((b) => b.per_page);
		const pages = data.boards.map((b) => b.pages);

		const chartData = {
			labels: labels,
			datasets: [
				{
					label: "Threads per Page",
					data: threadsPerPage,
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
		const resultDiv = document.getElementById("result-section");
		resultDiv.innerHTML = `<p class="error-message">⚠️ ${error.message}</p>`;
	}

	// Start
	fetchBoards();
});
