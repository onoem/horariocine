let allMovies = [];
let currentFilter = 'all';
let searchQuery = '';

async function init() {
    try {
        const response = await fetch('data.json');
        allMovies = await response.json();

        setupDateFilters();
        renderMovies();

        document.getElementById('search-input').addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderMovies();
        });

        document.getElementById('modal-close').addEventListener('click', closeModal);
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('movie-modal')) closeModal();
        });

        window.addEventListener('scroll', () => {
            const header = document.getElementById('header');
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

    } catch (err) {
        console.error('Error loading data:', err);
    }
}

function setupDateFilters() {
    const dates = new Set();
    allMovies.forEach(movie => {
        movie.showtimes.forEach(st => {
            dates.add(st.day);
        });
    });

    const dateFilterContainer = document.getElementById('date-filter');
    // Sort dates? They are already in order from the scraper mostly.

    Array.from(dates).forEach(date => {
        const btn = document.createElement('button');
        btn.className = 'date-btn';
        btn.innerText = date;
        btn.dataset.date = date;
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = date;
            renderMovies();
        });
        dateFilterContainer.appendChild(btn);
    });

    // Special "all" button
    document.querySelector('[data-date="all"]').addEventListener('click', (e) => {
        document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = 'all';
        renderMovies();
    });
}

function renderMovies() {
    const grid = document.getElementById('movies-grid');
    grid.innerHTML = '';

    const filtered = allMovies.filter(movie => {
        const matchesSearch = movie.title.toLowerCase().includes(searchQuery);
        const matchesDate = currentFilter === 'all' || movie.showtimes.some(st => st.day === currentFilter);
        return matchesSearch && matchesDate;
    });

    filtered.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <img src="${movie.image}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
            <div class="movie-info">
                <div class="movie-title">${movie.title}</div>
                <div class="movie-meta">${movie.duration || ''} ${movie.duration && movie.director ? '|' : ''} ${movie.director || ''}</div>
            </div>
        `;
        card.addEventListener('click', () => openModal(movie));
        grid.appendChild(card);
    });
}

function openModal(movie) {
    const modal = document.getElementById('movie-modal');
    document.getElementById('modal-img').src = movie.image;
    document.getElementById('modal-title').innerText = movie.title;
    document.getElementById('modal-duration').innerText = movie.duration;
    document.getElementById('modal-director').innerText = movie.director ? `Director: ${movie.director}` : '';
    document.getElementById('modal-synopsis').innerText = movie.synopsis;

    const showtimesContainer = document.getElementById('modal-showtimes');
    showtimesContainer.innerHTML = '<h3>Horarios</h3>';

    movie.showtimes.forEach(st => {
        // If we are filtering by a specific date, maybe highlight it or only show it?
        // Let's show all but highlight the filtered one if applicable.
        const daySection = document.createElement('div');
        daySection.className = 'day-section';
        if (currentFilter !== 'all' && st.day === currentFilter) {
            daySection.style.background = 'rgba(229, 9, 20, 0.1)';
            daySection.style.padding = '0.5rem';
            daySection.style.borderRadius = '8px';
        }

        daySection.innerHTML = `
            <div class="day-title">${st.day}</div>
            <div class="sessions-list">
                ${st.sessions.map(s => `
                    <a href="${s.link || '#'}" class="session-link ${s.link ? '' : 'no-link'}" target="_blank">
                        ${s.time}
                    </a>
                `).join('')}
            </div>
        `;
        showtimesContainer.appendChild(daySection);
    });

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('movie-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

init();
