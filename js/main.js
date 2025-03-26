document.addEventListener("DOMContentLoaded", async function () {
	// Cache DOM elements
	const boardsContainer = document.getElementById("boards-list");
	const searchInput = document.getElementById("search-board");
	const archivedFilter = document.getElementById("filter-archived");
	const adultContentFilter = document.getElementById("filter-adult-content");
	const themeToggleButton = document.getElementById("toggle-theme");

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
			if (archivedFilter.checked && board.is_archived === 0) {
				return false;
			}

			// Apply filter for adult content (you'll need to define your own rules for this)
			if (adultContentFilter.checked && /adult/i.test(board.title)) {
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
