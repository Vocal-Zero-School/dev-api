document.addEventListener("DOMContentLoaded", async function () {
	// Cache DOM elements
	const boardsContainer = document.getElementById("boards-list");
	const searchInput = document.getElementById("search-board");
	const archivedFilter = document.getElementById("filter-archived");
	const adultContentFilter = document.getElementById("filter-adult-content");
	const themeToggleButton = document.getElementById("toggle-theme");

	// Add a canvas element for the chart above the board list
	const chartContainer = document.createElement("div");
	chartContainer.id = "chart-container";
	chartContainer.innerHTML = `<canvas id="boards-chart"></canvas>`;
	boardsContainer.parentNode.insertBefore(chartContainer, boardsContainer);

	// Initialize Chart.js
	let boardsChart = null;

	// Function to get the proxy URL dynamically
	async function getProxyUrl() {
		try {
			const response = await fetch("https://corsproxy.io/?url=https://example.com");
			if (response.ok) {
				return "https://cors-anywhere.herokuapp.com/";
			} else {
				throw new Error("Failed to retrieve proxy access");
			}
		} catch (error) {
			console.error("Error fetching proxy:", error);
			displayErrorMessage(error);
			return null;
		}
	}

	// Function to fetch board data using the proxy
	async function fetchBoards() {
		const proxyUrl = await getProxyUrl();
		if (!proxyUrl) {
			displayErrorMessage(new Error("CORS proxy unavailable"));
			return;
		}

		try {
			const response = await fetch(`${proxyUrl}https://a.4cdn.org/boards.json`);
			if (!response.ok) {
				throw new Error("Failed to fetch data. Status: " + response.status);
			}
			const data = await response.json();
			console.log(data); // Log the data to make sure it's correct
			displayBoards(data);
			updateChart(data);
		} catch (error) {
			console.error("Error fetching board list:", error);
			displayErrorMessage(error);
		}
	}

	// Fetch the board data
	fetchBoards();

	// Function to display the list of boards
	function displayBoards(data) {
		boardsContainer.innerHTML = ""; // Clear previous content

		// Apply filters to boards
		const filteredBoards = data.boards.filter((board) => {
			// Apply filter for archived boards
			if (archivedFilter.checked && board.is_archived !== true) {
				return false;
			}

			// Apply filter for adult content
			if (adultContentFilter.checked && board.ws_board !== 1) {
				return false;
			}

			return true;
		});

		// Display the boards in the container
		filteredBoards.forEach((board) => {
			const boardElement = document.createElement("div");
			boardElement.classList.add("board-item");

			// Display basic board info
			boardElement.innerHTML = `
			  <h3>${board.title}</h3>
			  <p>Board: /${board.board}</p>
			  <p>Threads per page: ${board.per_page}</p>
			  <p>Pages: ${board.pages}</p>
			  <p>Max file size: ${board.max_filesize / 1024} MB</p>
			  <p>Max WebM size: ${board.max_webm_filesize / 1024} MB</p>
			`;

			boardsContainer.appendChild(boardElement);
		});
	}

	// Function to update the chart
	function updateChart(data) {
		const labels = data.boards.map((board) => board.title);
		const threadsPerPage = data.boards.map((board) => board.per_page);
		const pages = data.boards.map((board) => board.pages);

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
				y: {
					beginAtZero: true,
				},
			},
		};

		// Destroy the previous chart instance if it exists
		if (boardsChart) {
			boardsChart.destroy();
		}

		// Create a new chart instance
		const ctx = document.getElementById("boards-chart").getContext("2d");
		boardsChart = new Chart(ctx, {
			type: "bar",
			data: chartData,
			options: chartOptions,
		});
	}

	// Function to filter boards based on search input
	searchInput.addEventListener("input", () => {
		const searchQuery = searchInput.value.toLowerCase();
		const boards = document.querySelectorAll(".board-item");
		boards.forEach((board) => {
			const boardTitle = board.querySelector("h3").textContent.toLowerCase();
			// Show or hide the board based on search query
			if (boardTitle.includes(searchQuery)) {
				board.style.display = "";
			} else {
				board.style.display = "none";
			}
		});
	});

	// Function to toggle dark mode
	themeToggleButton.addEventListener("click", () => {
		document.body.classList.toggle("dark-mode");
		const isDarkMode = document.body.classList.contains("dark-mode");
		themeToggleButton.textContent = isDarkMode ? "🌞 Light Mode" : "🌙 Dark Mode";

		// Change the icon/logo based on the mode
		const logoIcon = document.getElementById("site-logo");
		if (logoIcon) {
			logoIcon.src = isDarkMode ? "../images/icon-dark.png" : "../images/icon-light.png";
		}
	});

	// Function to display an error message
	function displayErrorMessage(error) {
		const resultDiv = document.getElementById("result-section");
		resultDiv.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
	}
});
