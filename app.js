let allMovies = [];
let currentFilter = 'all';
let searchQuery = '';

function isSessionPast(dayStr, timeStr) {
    if (!dayStr || !timeStr) return false;

    const now = new Date();

    // Extract day number from "Vie. 13" or "Ds. 14"
    const dayMatch = dayStr.match(/(\d+)/);
    if (!dayMatch) return false;
    const dayNum = parseInt(dayMatch[1]);

    // Extract time from strings like "10.15-ES", "10:15", "18.00-VOSE"
    const timeMatch = timeStr.match(/(\d{1,2})[\.\:](\d{2})/);
    if (!timeMatch) return false;
    const hour = parseInt(timeMatch[1]);
    const minute = parseInt(timeMatch[2]);

    // Construct a date for this session in the current year/month
    // Note: getMonth() returns 0-11
    let sessionDate = new Date(now.getFullYear(), now.getMonth(), dayNum, hour, minute);

    // Month rollover logic:
    // We assume the schedule is for the near future (within ~20 days).
    // if today is the 25th and the session is the 2nd, it's next month.
    // if today is the 2nd and the session is the 25th, it's either current month or last month (but schedule is usually future).
    const diffTime = sessionDate.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays < -15) {
        // If session seems to be more than 15 days in the past, it's likely next month
        sessionDate.setMonth(sessionDate.getMonth() + 1);
    } else if (diffDays > 20) {
        // If session seems to be more than 20 days in the future, it might be from the previous month 
        // (unlikely for a movie schedule, but keeps logic balanced)
        sessionDate.setMonth(sessionDate.getMonth() - 1);
    }

    return sessionDate < now;
}

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
            const hasFutureSessions = st.sessions.some(s => !isSessionPast(st.day, s.time));
            if (hasFutureSessions) {
                dates.add(st.day);
            }
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

        const hasMatchingFutureSession = movie.showtimes.some(st => {
            const isTargetDay = currentFilter === 'all' || st.day === currentFilter;
            if (!isTargetDay) return false;

            return st.sessions.some(s => !isSessionPast(st.day, s.time));
        });

        return matchesSearch && hasMatchingFutureSession;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="no-movies">No hay sesiones disponibles para la búsqueda o fecha seleccionada.</div>';
        return;
    }

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
        const futureSessions = st.sessions.filter(s => !isSessionPast(st.day, s.time));

        if (futureSessions.length > 0) {
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
                    ${futureSessions.map(s => `
                        <a href="${s.link || '#'}" class="session-link ${s.link ? '' : 'no-link'}" target="_blank">
                            ${s.time}
                        </a>
                    `).join('')}
                </div>
            `;
            showtimesContainer.appendChild(daySection);
        }
    });

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('movie-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

init();
