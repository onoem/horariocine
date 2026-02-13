const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

async function scrape() {
    const htmlPath = path.join(__dirname, 'programacio.html');
    if (!fs.existsSync(htmlPath)) {
        console.error('File programacio.html not found');
        return;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(html);
    const movies = [];

    // The movies are usually in dmRespRow containers that have an image and a table
    $('.dmRespRow').each((i, row) => {
        const $row = $(row);

        // Find title
        let title = $row.find('p.text-align-left strong').first().text().trim();
        if (!title || title.includes('(+)')) {
            // Try another way to find title if the first one is empty or contains (+info)
            title = $row.find('p.text-align-left strong').eq(0).text().trim();
        }

        // Clean title (sometimes it has (VOSE) or similar attached, or (+info))
        title = title.replace(/\s*\(\+info\)\s*/i, '').trim();

        if (!title || title.length < 3) return; // Skip non-movie rows

        // Image
        const image = $row.find('.imageWidget img').attr('src');

        // Table with showtimes
        const $table = $row.find('table.table');
        if ($table.length === 0) return;

        const showtimes = [];
        $table.find('tr.row').each((j, tr) => {
            const $cells = $(tr).find('td.cell');
            if ($cells.length === 0) return;

            let day = $cells.eq(0).text().trim(); // e.g. "Dv. 13"

            // Translate day
            const translations = {
                'Dv.': 'Vie.',
                'Ds.': 'Sáb.',
                'Dg.': 'Dom.',
                'Dll.': 'Lun.',
                'Dt.': 'Mar.',
                'Dc.': 'Mié.',
                'Dj.': 'Jue.'
            };

            for (const [cat, esp] of Object.entries(translations)) {
                if (day.startsWith(cat)) {
                    day = day.replace(cat, esp);
                    break;
                }
            }

            const sessions = [];

            $cells.slice(1).each((k, td) => {
                const $td = $(td);
                const timeText = $td.text().trim();
                const link = $td.find('a').attr('href');

                if (timeText && timeText !== '-') {
                    sessions.push({
                        time: timeText,
                        link: link || null
                    });
                }
            });

            if (sessions.length > 0) {
                showtimes.push({
                    day,
                    sessions
                });
            }
        });

        // Additional Info
        let duration = '';
        let director = '';
        let cast = '';
        let synopsis = '';

        $row.find('p, .dmNewParagraph').each((pIdx, p) => {
            const text = $(p).text().trim();
            if (text.startsWith('DURADA:')) {
                duration = text.replace('DURADA:', '').split('DIRECCIÓ:')[0].trim();
            }
            if (text.includes('DIRECCIÓ:')) {
                director = text.split('DIRECCIÓ:')[1]?.split('INTÈRPRETS:')[0]?.trim() || '';
            }
            if (text.includes('INTÈRPRETS:')) {
                cast = text.split('INTÈRPRETS:')[1]?.split('VERSIONS:')[0]?.split('SINOPSI:')[0]?.trim() || '';
            }
            if (text.includes('SINOPSI:')) {
                synopsis = text.split('SINOPSI:')[1]?.trim() || '';
            }
        });

        // Fallback for synopsis in case it's in a different paragraph
        if (!synopsis) {
            $row.find('p, .dmNewParagraph').each((pIdx, p) => {
                const text = $(p).text().trim();
                if (text.length > 100 && !text.includes('DURADA:') && !text.includes('DIRECCIÓ:')) {
                    synopsis = text;
                }
            });
        }

        if (showtimes.length > 0) {
            movies.push({
                title,
                image,
                duration,
                director,
                cast,
                synopsis,
                showtimes
            });
        }
    });

    // Extracting ticketing links from koobin.html to match by title if possible
    // (Optional enhancement, since we already have links in the table)

    fs.writeFileSync('data.json', JSON.stringify(movies, null, 2), 'utf8');
    console.log(`Scraped ${movies.length} movies into data.json`);
}

scrape().catch(err => {
    console.error('Error scraping:', err);
    process.exit(1);
});
