document.addEventListener("DOMContentLoaded", function () {
	// Cache DOM elements
	const boardsContainer = document.getElementById("boards-list");
	const searchInput = document.getElementById("search-board");
	const archivedFilter = document.getElementById("filter-archived");
	const adultContentFilter = document.getElementById("filter-adult-content");
	const themeToggleButton = document.getElementById("toggle-theme");

	// Fetch boards data from the local server (using the '/api/boards' endpoint)
	fetch("/api/boards")
		.then((response) => {
			if (!response.ok) {
				throw new Error("Failed to fetch data. Status: " + response.status);
			}
			return response.json();
		})
		.then((data) => {
			console.log(data); // Log the data to make sure it's correct
			displayBoards(data);
		})
		.catch((error) => {
			console.error("Error fetching board list:", error);
			displayErrorMessage(error);
		});

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
	});

	// Function to display an error message
	function displayErrorMessage(error) {
		const resultDiv = document.getElementById("result-section");
		resultDiv.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
	}
});
