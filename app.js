/**
 * FYI - Premium News PWA
 * Fetches stories from public Google Sheets (no API key needed)
 * Filters to show only today's stories
 */

// ==========================================
// CONFIGURATION - Edit this!
// ==========================================

// Paste your Google Sheet ID here (the long string from the URL)
// Example URL: https://docs.google.com/spreadsheets/d/1ABC123xyz.../edit
// Sheet ID would be: 1ABC123xyz...
const SHEET_ID = '1WfcDbDicaZBmTumU4dqG_349UQIRwfP4eMr8NN7TmYs';

// Sheet name (tab name at bottom of spreadsheet)
const SHEET_NAME = 'Sheet1';

// ==========================================
// PLAUSIBLE ANALYTICS CONFIGURATION
// ==========================================
// Add your Plausible domain here after signing up at plausible.io
// Example: const PLAUSIBLE_DOMAIN = 'fyi.yourdomain.com';
// Leave as empty string to disable analytics
const PLAUSIBLE_DOMAIN = '';

// ==========================================
// Analytics Helper Functions
// ==========================================

/**
 * Track an event with Plausible Analytics
 * Safe wrapper that won't break the app if Plausible fails to load
 * @param {string} eventName - The name of the event
 * @param {object} props - Optional properties to track
 */
function trackEvent(eventName, props = {}) {
    try {
        // Only track if Plausible is loaded and domain is configured
        if (typeof window.plausible !== 'undefined' && PLAUSIBLE_DOMAIN) {
            window.plausible(eventName, { props });
        }
    } catch (e) {
        // Silently fail - analytics should never break the app
        console.debug('Analytics tracking skipped:', e.message);
    }
}

/**
 * Track app open event
 */
function trackAppOpened() {
    trackEvent('App Opened');
}

/**
 * Track story viewed event
 * @param {number} storyNumber - Which story (1, 2, or 3)
 * @param {string} headline - The story headline
 */
function trackStoryViewed(storyNumber, headline) {
    trackEvent('Story Viewed', {
        story: storyNumber,
        headline: headline.substring(0, 100) // Limit length
    });
}

/**
 * Track question clicked event
 * @param {string} storyHeadline - The story headline
 * @param {string} questionText - The question text
 */
function trackQuestionClicked(storyHeadline, questionText) {
    trackEvent('Question Clicked', {
        story: storyHeadline.substring(0, 50),
        question: questionText.substring(0, 100)
    });
}

/**
 * Track rating given event
 * @param {string} storyHeadline - The story headline
 * @param {number} rating - Rating value (1-5)
 */
function trackRatingGiven(storyHeadline, rating) {
    trackEvent('Rating Given', {
        story: storyHeadline.substring(0, 50),
        rating: rating
    });
}

/**
 * Track modal opened event
 * @param {string} modalName - 'What is FYI' or 'Our Philosophy'
 */
function trackModalOpened(modalName) {
    trackEvent('Modal Opened', {
        modal: modalName
    });
}

/**
 * Track theme changed event
 * @param {string} theme - 'light' or 'dark'
 */
function trackThemeChanged(theme) {
    trackEvent('Theme Changed', {
        theme: theme
    });
}

// ==========================================
// Fallback Story Data (used when sheet not configured)
// ==========================================

const fallbackStories = [
    {
        id: 1,
        date: getTodayDate(),
        emoji: "📉",
        headline: "Gold Prices Crash After Heavy Liquidation",
        teaser: "Investors are booking profits after gold hit record highs, triggering algorithmic selling and a sharp correction in global markets. This market behavior reveals the psychology behind profit-taking and the technical levels that matter to institutional traders. Central banks continue accumulating while retail investors panic—creating an interesting divergence in market sentiment.",
        imageUrl: "",
        questions: [
            {
                label: "✦",
                text: "Why are investors selling NOW after gold hit records?",
                answer: "Classic profit-taking psychology. Gold touched $2,450/oz—a psychological barrier that triggered algorithmic selling. Large institutional investors had set limit orders at this level months ago. Additionally, recent Fed signals suggesting delayed rate cuts reduced gold's appeal as a hedge. When momentum traders see others exiting, FOMO works in reverse."
            },
            {
                label: "✦",
                text: "Does this mean gold isn't safe anymore?",
                answer: "Not at all—this is normal market behavior, not a fundamental shift. Gold remains the ultimate crisis hedge. What we're seeing is a technical correction after a 15% rally. Long-term holders aren't selling; it's primarily short-term traders and algorithms. Central banks, especially in Asia, continue accumulating."
            },
            {
                label: "✦",
                text: "How is USD recovering with Trump chaos?",
                answer: "Counterintuitively, political uncertainty often strengthens the dollar short-term. Global investors flee to USD-denominated assets during volatility—it's still the world's reserve currency. Meanwhile, other major economies face their own issues: Europe's stagnation, China's property crisis, Japan's weak yen."
            }
        ]
    },
    {
        id: 2,
        date: getTodayDate(),
        emoji: "🤝",
        headline: "India-UAE Sign Nuclear, Defence, Trade Pacts",
        teaser: "A landmark strategic partnership bundles nuclear cooperation, defense agreements, and trade access into one comprehensive deal. The diplomatic move creates powerful interdependencies between both nations that extend far beyond traditional bilateral relations. This agreement signals a major shift in Middle East power dynamics and energy security frameworks.",
        imageUrl: "",
        questions: [
            {
                label: "✦",
                text: "Why bundle nuclear + defense + trade together?",
                answer: "It's diplomatic leverage maximization. Bundling creates interdependencies that make either party think twice before souring relations. If UAE wants nuclear cooperation, they commit to defense purchases. If India wants trade access, they share technology. Each component serves as insurance for the others."
            },
            {
                label: "✦",
                text: "Since when does UAE have nuclear capability?",
                answer: "UAE's Barakah Nuclear Power Plant went operational in 2020—the first in the Arab world. They're not building weapons; this is about clean energy. The country aims for 25% nuclear power by 2030. India's cooperation involves training UAE engineers and potentially supplying components."
            },
            {
                label: "✦",
                text: "Why UAE and not Russia for defense?",
                answer: "Russia's Ukraine situation changed everything. Their weapons are now battle-tested—and found wanting. Export capacity dropped as they prioritize domestic needs. Western sanctions complicate spare parts. India offers a middle path: proven systems like BrahMos missiles, no sanctions risk."
            }
        ]
    },
    {
        id: 3,
        date: getTodayDate(),
        emoji: "🤖",
        headline: "India Sets Up AI Task Force for Vulnerabilities",
        teaser: "The government has established a dedicated committee to assess AI model risks and develop regulatory frameworks for emerging technologies. This move positions India in the global conversation on AI governance alongside the EU and US, while balancing innovation incentives with safety concerns. The task force includes experts from major tech companies and academic institutions.",
        imageUrl: "",
        questions: [
            {
                label: "✦",
                text: "Does India even have AI expertise for this?",
                answer: "More than people assume. India has the world's second-largest AI talent pool after the US. IITs and IISc produce top researchers; many return from Silicon Valley. The task force includes people from Google DeepMind, Microsoft Research India, and TCS Research."
            },
            {
                label: "✦",
                text: "Will this just be another 3-year report nobody reads?",
                answer: "Valid skepticism, but timing matters. Unlike past tech committees, AI regulation has global urgency—EU's AI Act, Biden's executive order, China's rules. India can't afford to be left out of standard-setting. The task force has a 6-month deadline for initial recommendations."
            },
            {
                label: "✦",
                text: "Why not outsource to EU? They're ahead on regulation",
                answer: "EU's AI Act is designed for European values and market structures—privacy-first, precautionary principle, heavy compliance costs. India's priorities differ: enabling AI adoption for development, protecting against misinformation in local languages, and maintaining tech sovereignty."
            }
        ]
    }
];

// ==========================================
// Helper Functions
// ==========================================

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    // Handle various date formats
    const str = String(dateStr).trim();
    // Try ISO format first (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
    }
    // Try MM/DD/YYYY
    const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
        return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
    }
    // Try DD/MM/YYYY
    const match2 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match2) {
        return `${match2[3]}-${match2[2].padStart(2, '0')}-${match2[1].padStart(2, '0')}`;
    }
    return str;
}

// ==========================================
// App State
// ==========================================

const state = {
    stories: [],
    currentIndex: 0,
    totalStories: 0,
    currentStory: null,
    currentSection: 'today',
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    dragThreshold: 100,
    hasShownHint: false,
    rating: 0,
    history: [],
    theme: 'dark',
    isLoading: true,
    viewedStories: []
};

// ==========================================
// DOM Elements
// ==========================================

const elements = {};

function cacheElements() {
    elements.hamburgerBtn = document.getElementById('hamburgerBtn');
    elements.dropdownMenu = document.getElementById('dropdownMenu');
    elements.whatIsFYIBtn = document.getElementById('whatIsFYIBtn');
    elements.ourPhilosophyBtn = document.getElementById('ourPhilosophyBtn');
    elements.whatIsFYIModal = document.getElementById('whatIsFYIModal');
    elements.ourPhilosophyModal = document.getElementById('ourPhilosophyModal');
    elements.whatIsFYIClose = document.getElementById('whatIsFYIClose');
    elements.ourPhilosophyClose = document.getElementById('ourPhilosophyClose');
    elements.headerLogo = document.getElementById('headerLogo');
    elements.themeToggle = document.getElementById('themeToggle');
    elements.progressFill = document.getElementById('progressFill');
    elements.dateDisplay = document.getElementById('dateDisplay');
    elements.progressDots = document.getElementById('progressDots');
    elements.pullIndicator = document.getElementById('pullIndicator');
    elements.loadingState = document.getElementById('loadingState');
    elements.mainContent = document.getElementById('mainContent');
    elements.cardContainer = document.getElementById('cardContainer');
    elements.noStoriesState = document.getElementById('noStoriesState');
    elements.completionScreen = document.getElementById('completionScreen');
    elements.reviewStoriesBtn = document.getElementById('reviewStoriesBtn');
    elements.swipeHint = document.getElementById('swipeHint');
    elements.emptyRefreshBtn = document.getElementById('emptyRefreshBtn');

    // Sections
    elements.sectionToday = document.getElementById('sectionToday');
    elements.sectionHistory = document.getElementById('sectionHistory');

    // History
    elements.historyList = document.getElementById('historyList');
    elements.historyEmpty = document.getElementById('historyEmpty');
    elements.historyToggle = document.getElementById('historyToggle');
    elements.historyBackBtn = document.getElementById('historyBackBtn');

    // Modal
    elements.modalBackdrop = document.getElementById('modalBackdrop');
    elements.qaModal = document.getElementById('qaModal');
    elements.modalClose = document.getElementById('modalClose');
    elements.qaView = document.getElementById('qaView');
    elements.answerView = document.getElementById('answerView');
    elements.modalEmoji = document.getElementById('modalEmoji');
    elements.modalHeadline = document.getElementById('modalHeadline');
    elements.questionsContainer = document.getElementById('questionsContainer');
    elements.answerLabel = document.getElementById('answerLabel');
    elements.answerQuestion = document.getElementById('answerQuestion');
    elements.answerText = document.getElementById('answerText');
    elements.starRating = document.getElementById('starRating');
    elements.doneBtn = document.getElementById('doneBtn');

    // Toast
    elements.toast = document.getElementById('toast');
    elements.toastIcon = document.getElementById('toastIcon');
    elements.toastMessage = document.getElementById('toastMessage');
}

// ==========================================
// Initialization
// ==========================================

async function init() {
    cacheElements();
    loadFromStorage();
    applyTheme();
    setupEventListeners();

    // Show loading and fetch stories
    showLoading(true);
    await fetchStories();
    showLoading(false);

    renderCards();
    updateProgress();
    updateDateDisplay();
    renderProgressDots();
    renderHistory();
    showSwipeHint();
    registerServiceWorker();

    // Track app opened
    trackAppOpened();
}

// Format and display today's date
function updateDateDisplay() {
    const today = new Date();
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', options);
    elements.dateDisplay.textContent = formattedDate;
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.log('SW registration failed:', err));
    }
}

// ==========================================
// Storage
// ==========================================

function loadFromStorage() {
    try {
        // Try new key first, then fall back to old key for migration
        let saved = localStorage.getItem('fyiNews');
        if (!saved) {
            saved = localStorage.getItem('criticalNews');
            // Migrate to new key
            if (saved) {
                localStorage.setItem('fyiNews', saved);
                localStorage.removeItem('criticalNews');
            }
        }
        if (saved) {
            const data = JSON.parse(saved);
            state.history = data.history || [];
            state.theme = data.theme || 'dark';
            state.hasShownHint = data.hasShownHint || false;
            state.viewedStories = data.viewedStories || [];

            // Reset current index if it's a new day
            const lastDate = data.lastDate;
            const today = getTodayDate();
            if (lastDate !== today) {
                state.currentIndex = 0;
                state.viewedStories = [];
            } else {
                state.currentIndex = data.currentIndex || 0;
            }
        }
    } catch (e) {
        console.error('Error loading from storage:', e);
    }
}

function saveToStorage() {
    try {
        const data = {
            history: state.history,
            theme: state.theme,
            currentIndex: state.currentIndex,
            hasShownHint: state.hasShownHint,
            viewedStories: state.viewedStories,
            lastDate: getTodayDate()
        };
        localStorage.setItem('fyiNews', JSON.stringify(data));
    } catch (e) {
        console.error('Error saving to storage:', e);
    }
}

// ==========================================
// Google Sheets Integration (Public CSV)
// ==========================================

async function fetchStories() {
    // Check if sheet ID is configured
    if (SHEET_ID === 'YOUR_SHEET_ID_HERE' || !SHEET_ID) {
        console.log('Sheet ID not configured, using fallback stories');
        state.stories = fallbackStories;
        state.totalStories = state.stories.length;
        return;
    }

    try {
        // Fetch public Google Sheet as CSV
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch sheet');
        }

        const csvText = await response.text();
        const stories = parseCSV(csvText);

        // Filter to today's stories only
        const today = getTodayDate();
        const todayStories = stories.filter(story => {
            const storyDate = parseDate(story.date);
            return storyDate === today;
        });

        if (todayStories.length > 0) {
            state.stories = todayStories;
            state.totalStories = todayStories.length;

            // Cache for offline
            localStorage.setItem('cachedStories', JSON.stringify({
                date: today,
                stories: todayStories
            }));

            showToast('✓', 'Stories loaded');
        } else {
            // Try to load cached stories
            const cached = localStorage.getItem('cachedStories');
            if (cached) {
                const data = JSON.parse(cached);
                if (data.date === today && data.stories.length > 0) {
                    state.stories = data.stories;
                    state.totalStories = data.stories.length;
                    return;
                }
            }

            // No stories for today
            state.stories = [];
            state.totalStories = 0;
        }
    } catch (error) {
        console.error('Fetch error:', error);

        // Try cached stories
        const cached = localStorage.getItem('cachedStories');
        if (cached) {
            const data = JSON.parse(cached);
            state.stories = data.stories || [];
            state.totalStories = state.stories.length;
            showToast('⚠', 'Showing cached stories');
        } else {
            // Use fallback
            state.stories = fallbackStories;
            state.totalStories = state.stories.length;
            showToast('⚠', 'Using sample stories');
        }
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) return [];

    // Parse header row
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim().replace(/\s+/g, ' '));

    // Expected column structure:
    // Date, Headline, Teaser, Question 1, Question 2, Question 3, Question 4, Answer 1, Answer 2, Answer 3, Banner Image URL
    // Note: Question 4 is always "Skip this story" and has no answer

    // Map expected headers to indices
    const headerMap = {};
    const expectedHeaders = ['date', 'headline', 'teaser', 'question 1', 'question 2', 'question 3', 'question 4', 'answer 1', 'answer 2', 'answer 3', 'banner image url'];

    headers.forEach((header, index) => {
        // Normalize header for matching
        const normalized = header.replace(/[^a-z0-9\s]/g, '').trim();
        expectedHeaders.forEach(expected => {
            if (normalized === expected || header.includes(expected) || expected.includes(normalized)) {
                headerMap[expected] = index;
            }
        });
        // Also check for exact matches
        if (header === 'date') headerMap['date'] = index;
        if (header === 'headline') headerMap['headline'] = index;
        if (header === 'teaser') headerMap['teaser'] = index;
        if (header.includes('question 1') || header === 'question1') headerMap['question 1'] = index;
        if (header.includes('question 2') || header === 'question2') headerMap['question 2'] = index;
        if (header.includes('question 3') || header === 'question3') headerMap['question 3'] = index;
        if (header.includes('question 4') || header === 'question4') headerMap['question 4'] = index;
        if (header.includes('answer 1') || header === 'answer1') headerMap['answer 1'] = index;
        if (header.includes('answer 2') || header === 'answer2') headerMap['answer 2'] = index;
        if (header.includes('answer 3') || header === 'answer3') headerMap['answer 3'] = index;
        if (header.includes('banner') || header.includes('image url')) headerMap['banner image url'] = index;
    });

    const stories = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);

        // Get values using header map, with fallback to positional indices
        const getValue = (key, fallbackIndex) => {
            const idx = headerMap[key] !== undefined ? headerMap[key] : fallbackIndex;
            return (values[idx] || '').trim();
        };

        // Build story object using the exact column structure
        const story = {
            id: i,
            date: getValue('date', 0),
            emoji: '📰', // No emoji column - use default
            headline: getValue('headline', 1),
            teaser: getValue('teaser', 2),
            imageUrl: getValue('banner image url', 10),
            questions: []
        };

        // Parse questions 1-3 (Question 4 is skip, handled separately in modal)
        for (let q = 1; q <= 3; q++) {
            const question = getValue(`question ${q}`, 2 + q);
            const answer = getValue(`answer ${q}`, 6 + q);
            if (question && question.trim() && answer && answer.trim()) {
                story.questions.push({
                    label: '✦',
                    text: question.trim(),
                    answer: answer.trim()
                });
            }
        }

        // Validate date format (YYYY-MM-DD)
        const dateStr = story.date;
        if (dateStr && !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            console.warn(`Invalid date format for story ${i}: ${dateStr}. Expected YYYY-MM-DD`);
        }

        // Only add story if it has headline and at least one question
        if (story.headline && story.headline.trim() && story.questions.length > 0) {
            stories.push(story);
        }
    }

    return stories;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

// ==========================================
// Theme
// ==========================================

function applyTheme() {
    if (state.theme === 'light') {
        document.documentElement.classList.add('light-mode');
    } else {
        document.documentElement.classList.remove('light-mode');
    }
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveToStorage();
    triggerHaptic('light');
    trackThemeChanged(state.theme);
}

// ==========================================
// Loading State
// ==========================================

function showLoading(show) {
    state.isLoading = show;
    elements.loadingState.classList.toggle('visible', show);
}

// ==========================================
// Card Rendering
// ==========================================

function renderCards() {
    elements.cardContainer.innerHTML = '';

    // Check if no stories
    if (state.stories.length === 0) {
        elements.noStoriesState.classList.add('visible');
        elements.historyToggle.classList.add('hidden');
        return;
    }

    elements.noStoriesState.classList.remove('visible');
    elements.historyToggle.classList.remove('hidden');

    // Check if completed
    if (state.currentIndex >= state.totalStories) {
        showCompletion();
        return;
    }

    // Render remaining cards (up to 3 visible in stack)
    const cardsToRender = state.stories.slice(state.currentIndex, state.currentIndex + 3);

    cardsToRender.forEach((story, index) => {
        const card = createCardElement(story, index);
        elements.cardContainer.appendChild(card);
    });
}

function createCardElement(story, position) {
    const card = document.createElement('div');
    card.className = 'story-card';
    card.dataset.id = story.id;
    card.dataset.position = position;

    // Banner image
    let bannerHTML = '';
    if (story.imageUrl) {
        bannerHTML = `
            <div class="card-banner">
                <img src="${story.imageUrl}" alt="" onerror="this.parentElement.innerHTML='<span class=card-banner-placeholder>${story.emoji}</span>'">
            </div>
        `;
    } else {
        bannerHTML = `
            <div class="card-banner">
                <span class="card-banner-placeholder">${story.emoji}</span>
            </div>
        `;
    }

    // Use teaser from story, or placeholder if empty
    const teaserText = story.teaser || "This is placeholder teaser text for the story. It should span approximately five lines to show how the expanded subheading area will look with real content from your Google Sheet.";

    card.innerHTML = `
        <div class="card-swipe-overlay left"></div>
        <div class="card-swipe-overlay right"></div>
        ${bannerHTML}
        <div class="card-body">
            <h2 class="card-headline">${story.headline}</h2>
            <p class="card-teaser">${teaserText}</p>
            <div class="card-hint">
                <span>Curious?</span>
                <span class="card-hint-arrow">›</span>
            </div>
        </div>
    `;

    if (position === 0) {
        setupCardInteractions(card, story);
    }

    return card;
}

function setupCardInteractions(card, story) {
    // Touch events
    card.addEventListener('touchstart', (e) => handleDragStart(e, card), { passive: true });
    card.addEventListener('touchmove', (e) => handleDragMove(e, card), { passive: false });
    card.addEventListener('touchend', (e) => handleDragEnd(e, card, story));

    // Mouse events for desktop
    card.addEventListener('mousedown', (e) => handleDragStart(e, card));
    card.addEventListener('mousemove', (e) => handleDragMove(e, card));
    card.addEventListener('mouseup', (e) => handleDragEnd(e, card, story));
    card.addEventListener('mouseleave', (e) => {
        if (state.isDragging) handleDragEnd(e, card, story);
    });

    // Click/tap to open
    card.addEventListener('click', (e) => {
        if (!state.isDragging && Math.abs(state.currentX) < 10) {
            triggerHaptic('light');
            openModal(story);
        }
    });
}

// ==========================================
// Drag/Swipe Handling
// ==========================================

function handleDragStart(e, card) {
    state.isDragging = true;
    state.startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    state.startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    state.currentX = 0;
    card.classList.add('dragging');
    hideSwipeHint();
}

function handleDragMove(e, card) {
    if (!state.isDragging) return;

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - state.startX;
    const deltaY = clientY - state.startY;

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaX) < 10) {
        return;
    }

    if (e.type === 'touchmove' && Math.abs(deltaX) > 10) {
        e.preventDefault();
    }

    state.currentX = deltaX;

    const rotation = deltaX * 0.05;
    const scale = Math.max(0.95, 1 - Math.abs(deltaX) * 0.0002);

    card.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg) scale(${scale})`;

    card.classList.toggle('swiping-left', deltaX < -30);
    card.classList.toggle('swiping-right', deltaX > 30);
}

function handleDragEnd(e, card, story) {
    if (!state.isDragging) return;

    state.isDragging = false;
    card.classList.remove('dragging', 'swiping-left', 'swiping-right');

    const deltaX = state.currentX;

    if (Math.abs(deltaX) > state.dragThreshold) {
        triggerHaptic('medium');
        if (deltaX > 0) {
            // Swipe right: Open modal WITHOUT removing card yet
            // Card stays in place, modal opens on top
            card.style.transition = 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)';
            card.style.transform = 'translateX(0) rotate(0) scale(1)';
            setTimeout(() => { card.style.transition = ''; }, 300);
            openModal(story);
        } else {
            // Swipe left: Skip to next card
            animateCardExit(card, 'left', () => nextCard());
        }
    } else {
        card.style.transition = 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        card.style.transform = 'translateX(0) rotate(0) scale(1)';
        setTimeout(() => { card.style.transition = ''; }, 300);
    }

    state.currentX = 0;
}

function animateCardExit(card, direction, callback) {
    const exitX = direction === 'left' ? -window.innerWidth : window.innerWidth;
    const rotation = direction === 'left' ? -30 : 30;

    card.classList.add('exiting');
    card.style.transform = `translateX(${exitX}px) rotate(${rotation}deg) scale(0.8)`;
    card.style.opacity = '0';

    setTimeout(callback, 400);
}

// ==========================================
// Card Navigation
// ==========================================

function nextCard() {
    // Mark current story as viewed
    if (state.stories[state.currentIndex]) {
        state.viewedStories.push(state.stories[state.currentIndex].id);
    }

    state.currentIndex++;
    saveToStorage();

    if (state.currentIndex >= state.totalStories) {
        showCompletion();
    } else {
        updateProgress();
        renderProgressDots();
        renderCards();
    }
}

function updateProgress() {
    if (state.totalStories === 0) {
        elements.progressFill.style.width = '0%';
        return;
    }
    const progress = ((state.currentIndex + 1) / state.totalStories) * 100;
    elements.progressFill.style.width = `${Math.min(progress, 100)}%`;
}

function renderProgressDots() {
    if (state.totalStories === 0) {
        elements.progressDots.innerHTML = '';
        return;
    }

    let dotsHTML = '';
    for (let i = 0; i < state.totalStories; i++) {
        let className = 'progress-dot';
        if (i === state.currentIndex) {
            className += ' active';
        } else if (i < state.currentIndex) {
            className += ' viewed';
        }
        dotsHTML += `<div class="${className}"></div>`;
    }
    elements.progressDots.innerHTML = dotsHTML;
}

function showCompletion() {
    elements.cardContainer.innerHTML = '';
    elements.completionScreen.classList.add('visible');
    elements.progressFill.style.width = '100%';
    elements.historyToggle.classList.add('hidden');
}

function resetApp() {
    state.currentIndex = 0;
    state.viewedStories = [];
    saveToStorage();
    elements.completionScreen.classList.remove('visible');
    elements.historyToggle.classList.remove('hidden');
    updateProgress();
    renderProgressDots();
    renderCards();
    showSwipeHint();
    triggerHaptic('light');
}

// ==========================================
// Modal Handling
// ==========================================

function openModal(story) {
    state.currentStory = story;
    state.rating = 0;

    // Track story viewed
    const storyIndex = state.stories.findIndex(s => s.id === story.id);
    trackStoryViewed(storyIndex + 1, story.headline);

    elements.modalEmoji.textContent = story.emoji;
    elements.modalHeadline.textContent = story.headline;

    elements.questionsContainer.innerHTML = '';
    story.questions.forEach((q) => {
        const button = document.createElement('button');
        button.className = 'question-button';
        button.innerHTML = `
            <span class="question-label">✦</span>
            <span class="question-text">${q.text}</span>
        `;
        button.addEventListener('click', () => {
            triggerHaptic('light');
            showAnswer(q);
        });
        elements.questionsContainer.appendChild(button);
    });

    // Add skip button - this advances to next story
    const skipButton = document.createElement('button');
    skipButton.className = 'question-button skip';
    skipButton.innerHTML = `
        <span class="question-label">✦</span>
        <span class="question-text">Skip this story</span>
    `;
    skipButton.addEventListener('click', () => {
        triggerHaptic('light');
        closeModal();
        // Animate current card out and move to next
        setTimeout(() => {
            const card = document.querySelector('.story-card[data-position="0"]');
            if (card) {
                animateCardExit(card, 'left', () => nextCard());
            } else {
                nextCard();
            }
        }, 300);
    });
    elements.questionsContainer.appendChild(skipButton);

    elements.qaView.classList.remove('hidden', 'fade-out');
    elements.answerView.classList.add('hidden');

    elements.modalBackdrop.classList.add('visible');
    document.body.classList.add('no-scroll');

    // Setup modal swipe to dismiss
    setupModalSwipe();
}

function setupModalSwipe() {
    let startY = 0;
    let currentY = 0;

    const modal = elements.qaModal;

    const handleTouchStart = (e) => {
        startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        if (deltaY > 0 && modal.scrollTop === 0) {
            e.preventDefault();
            modal.style.transform = `translateY(${deltaY}px)`;
        }
    };

    const handleTouchEnd = () => {
        const deltaY = currentY - startY;

        if (deltaY > 100) {
            closeModal();
        } else {
            modal.style.transform = '';
        }

        startY = 0;
        currentY = 0;
    };

    modal.addEventListener('touchstart', handleTouchStart, { passive: true });
    modal.addEventListener('touchmove', handleTouchMove, { passive: false });
    modal.addEventListener('touchend', handleTouchEnd);
}

function showAnswer(question) {
    addToHistory(state.currentStory, question);

    // Track question clicked
    trackQuestionClicked(state.currentStory.headline, question.text);

    elements.qaView.classList.add('fade-out');

    setTimeout(() => {
        elements.qaView.classList.add('hidden');
        elements.answerView.classList.remove('hidden');
        elements.answerView.classList.add('fade-in');

        elements.answerLabel.textContent = '✦';
        elements.answerQuestion.textContent = question.text;
        elements.answerText.textContent = question.answer;

        resetStars();

        setTimeout(() => {
            elements.answerView.classList.remove('fade-in');
        }, 300);
    }, 200);
}

function showQAView() {
    elements.answerView.classList.add('fade-out');

    setTimeout(() => {
        elements.answerView.classList.add('hidden');
        elements.answerView.classList.remove('fade-out');
        elements.qaView.classList.remove('hidden');
        elements.qaView.classList.add('fade-in');

        setTimeout(() => {
            elements.qaView.classList.remove('fade-in');
        }, 300);
    }, 200);
}

function closeModal() {
    elements.modalBackdrop.classList.remove('visible');
    document.body.classList.remove('no-scroll');
    elements.qaModal.style.transform = '';

    // Reset modal state after animation completes
    setTimeout(() => {
        elements.qaView.classList.remove('hidden', 'fade-out', 'fade-in');
        elements.answerView.classList.add('hidden');
        elements.answerView.classList.remove('fade-out', 'fade-in');
        state.currentStory = null;
        state.currentHistoryEntry = null;
    }, 300);
}

// ==========================================
// History
// ==========================================

function addToHistory(story, question) {
    const entry = {
        id: Date.now(),
        storyId: story.id,
        emoji: story.emoji,
        headline: story.headline,
        question: question.text,
        answer: question.answer,
        label: question.label,
        rating: 0,
        timestamp: Date.now()
    };

    state.history.unshift(entry);

    if (state.history.length > 50) {
        state.history = state.history.slice(0, 50);
    }

    saveToStorage();
    renderHistory();
}

function updateHistoryRating(entryId, rating) {
    const entry = state.history.find(h => h.id === entryId);
    if (entry) {
        entry.rating = rating;
        saveToStorage();
        renderHistory();
    }
}

function renderHistory() {
    if (state.history.length === 0) {
        elements.historyList.innerHTML = '';
        elements.historyEmpty.classList.add('visible');
        return;
    }

    elements.historyEmpty.classList.remove('visible');
    elements.historyList.innerHTML = state.history.map(entry => `
        <div class="history-item" data-id="${entry.id}">
            <span class="history-emoji">${entry.emoji}</span>
            <div class="history-content">
                <h4 class="history-headline">${entry.headline}</h4>
                <p class="history-question">${entry.label}: ${entry.question}</p>
            </div>
            <div class="history-meta">
                ${entry.rating > 0 ? `<span class="history-rating">${'★'.repeat(entry.rating)}</span>` : ''}
                <span class="history-time">${formatTimeAgo(entry.timestamp)}</span>
            </div>
        </div>
    `).join('');

    elements.historyList.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            const entry = state.history.find(h => h.id === id);
            if (entry) {
                triggerHaptic('light');
                showHistoryAnswer(entry);
            }
        });
    });
}

function showHistoryAnswer(entry) {
    const story = {
        id: entry.storyId,
        emoji: entry.emoji,
        headline: entry.headline,
        teaser: '',
        questions: [{
            label: entry.label,
            text: entry.question,
            answer: entry.answer
        }]
    };

    state.currentStory = story;
    state.currentHistoryEntry = entry;

    elements.modalEmoji.textContent = story.emoji;
    elements.modalHeadline.textContent = story.headline;

    elements.qaView.classList.add('hidden');
    elements.answerView.classList.remove('hidden');

    elements.answerLabel.textContent = '✦';
    elements.answerQuestion.textContent = entry.question;
    elements.answerText.textContent = entry.answer;

    setRating(entry.rating, true);

    elements.modalBackdrop.classList.add('visible');
    document.body.classList.add('no-scroll');
}

function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ==========================================
// Navigation
// ==========================================

function switchSection(sectionName) {
    state.currentSection = sectionName;
    triggerHaptic('light');

    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    if (sectionName === 'today') {
        elements.sectionToday.classList.add('active');
        elements.historyToggle.classList.remove('hidden');
    } else {
        elements.sectionHistory.classList.add('active');
        elements.historyToggle.classList.add('hidden');
    }
}

// ==========================================
// Star Rating
// ==========================================

function setupStarRating() {
    const stars = elements.starRating.querySelectorAll('.star');

    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            setRating(rating);
            triggerHaptic('light');

            if (state.currentHistoryEntry) {
                updateHistoryRating(state.currentHistoryEntry.id, rating);
            }
        });
    });
}

function setRating(rating, skipAnimation = false) {
    state.rating = rating;
    const stars = elements.starRating.querySelectorAll('.star');

    // Track rating if not skipping animation (i.e., user clicked)
    if (!skipAnimation && state.currentStory) {
        trackRatingGiven(state.currentStory.headline, rating);
    }

    stars.forEach((star, index) => {
        const starRating = index + 1;

        if (starRating <= rating) {
            if (skipAnimation) {
                star.classList.add('active');
                star.classList.remove('filling');
            } else if (!star.classList.contains('active')) {
                star.classList.add('filling');
                setTimeout(() => {
                    star.classList.remove('filling');
                    star.classList.add('active');
                }, 200);
            }
        } else {
            star.classList.remove('active', 'filling');
        }
    });
}

function resetStars() {
    state.rating = 0;
    state.currentHistoryEntry = null;
    const stars = elements.starRating.querySelectorAll('.star');
    stars.forEach(star => star.classList.remove('active', 'filling'));
}

// ==========================================
// Pull to Refresh
// ==========================================

function setupPullToRefresh() {
    let pullStartY = 0;
    let isPulling = false;

    elements.sectionToday.addEventListener('touchstart', (e) => {
        if (elements.sectionToday.scrollTop === 0) {
            pullStartY = e.touches[0].clientY;
            isPulling = true;
        }
    }, { passive: true });

    elements.sectionToday.addEventListener('touchmove', (e) => {
        if (!isPulling) return;

        const pullDistance = e.touches[0].clientY - pullStartY;

        if (pullDistance > 0 && pullDistance < 150) {
            elements.pullIndicator.classList.add('visible');
            elements.pullIndicator.querySelector('.pull-text').textContent =
                pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh';
        }
    }, { passive: true });

    elements.sectionToday.addEventListener('touchend', (e) => {
        if (!isPulling) return;

        const pullDistance = e.changedTouches[0].clientY - pullStartY;

        if (pullDistance > 80) {
            triggerHaptic('medium');
            elements.pullIndicator.classList.add('refreshing');
            elements.pullIndicator.querySelector('.pull-text').textContent = 'Refreshing...';
            refreshStories();
        } else {
            elements.pullIndicator.classList.remove('visible');
        }

        isPulling = false;
    });
}

async function refreshStories() {
    await fetchStories();
    renderCards();
    updateProgress();
    renderProgressDots();

    elements.pullIndicator.classList.remove('visible', 'refreshing');
}

// ==========================================
// Haptic Feedback
// ==========================================

function triggerHaptic(intensity = 'light') {
    if ('vibrate' in navigator) {
        switch (intensity) {
            case 'light': navigator.vibrate(10); break;
            case 'medium': navigator.vibrate(20); break;
            case 'heavy': navigator.vibrate([30, 10, 30]); break;
        }
    }
}

// ==========================================
// Toast
// ==========================================

function showToast(icon, message) {
    elements.toastIcon.textContent = icon;
    elements.toastMessage.textContent = message;
    elements.toast.classList.add('visible');

    setTimeout(() => {
        elements.toast.classList.remove('visible');
    }, 2500);
}

// ==========================================
// Swipe Hint
// ==========================================

function showSwipeHint() {
    if (state.hasShownHint || state.stories.length === 0) return;

    setTimeout(() => {
        elements.swipeHint.classList.add('visible');
        state.hasShownHint = true;
        saveToStorage();

        setTimeout(hideSwipeHint, 3000);
    }, 1000);
}

function hideSwipeHint() {
    elements.swipeHint.classList.remove('visible');
}

// ==========================================
// Event Listeners
// ==========================================

function setupEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Hamburger menu toggle
    elements.hamburgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerHaptic('light');
        elements.dropdownMenu.classList.toggle('visible');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.dropdownMenu.contains(e.target) && e.target !== elements.hamburgerBtn) {
            elements.dropdownMenu.classList.remove('visible');
        }
    });

    // What is FYI modal
    elements.whatIsFYIBtn.addEventListener('click', () => {
        triggerHaptic('light');
        elements.dropdownMenu.classList.remove('visible');
        elements.whatIsFYIModal.classList.add('visible');
        document.body.classList.add('no-scroll');
        trackModalOpened('What is FYI');
    });

    elements.whatIsFYIClose.addEventListener('click', () => {
        triggerHaptic('light');
        elements.whatIsFYIModal.classList.remove('visible');
        document.body.classList.remove('no-scroll');
    });

    elements.whatIsFYIModal.addEventListener('click', (e) => {
        if (e.target === elements.whatIsFYIModal) {
            triggerHaptic('light');
            elements.whatIsFYIModal.classList.remove('visible');
            document.body.classList.remove('no-scroll');
        }
    });

    // Our Philosophy modal
    elements.ourPhilosophyBtn.addEventListener('click', () => {
        triggerHaptic('light');
        elements.dropdownMenu.classList.remove('visible');
        elements.ourPhilosophyModal.classList.add('visible');
        document.body.classList.add('no-scroll');
        trackModalOpened('Our Philosophy');
    });

    elements.ourPhilosophyClose.addEventListener('click', () => {
        triggerHaptic('light');
        elements.ourPhilosophyModal.classList.remove('visible');
        document.body.classList.remove('no-scroll');
    });

    elements.ourPhilosophyModal.addEventListener('click', (e) => {
        if (e.target === elements.ourPhilosophyModal) {
            triggerHaptic('light');
            elements.ourPhilosophyModal.classList.remove('visible');
            document.body.classList.remove('no-scroll');
        }
    });

    // Logo click to reset to Story 1
    elements.headerLogo.addEventListener('click', () => {
        triggerHaptic('light');
        if (state.stories.length > 0 && (state.currentIndex > 0 || elements.completionScreen.classList.contains('visible'))) {
            resetApp();
            showToast('✓', 'Back to first story');
        }
    });

    // Empty state refresh
    elements.emptyRefreshBtn.addEventListener('click', () => {
        triggerHaptic('light');
        refreshStories();
    });

    // Modal controls
    elements.modalClose.addEventListener('click', () => {
        triggerHaptic('light');
        closeModal();
    });

    elements.modalBackdrop.addEventListener('click', (e) => {
        if (e.target === elements.modalBackdrop) {
            triggerHaptic('light');
            closeModal();
        }
    });

    // Done button - returns to question set (Q&A view), NOT to card deck
    elements.doneBtn.addEventListener('click', () => {
        triggerHaptic('light');
        showQAView();
    });

    // Review stories button
    elements.reviewStoriesBtn.addEventListener('click', () => {
        triggerHaptic('light');
        resetApp();
    });

    // Star rating
    setupStarRating();

    // History toggle
    elements.historyToggle.addEventListener('click', () => {
        switchSection('history');
    });

    // History back button
    elements.historyBackBtn.addEventListener('click', () => {
        switchSection('today');
    });

    // Pull to refresh
    setupPullToRefresh();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.modalBackdrop.classList.contains('visible')) {
            closeModal();
        }

        if (state.currentSection === 'today' && !elements.modalBackdrop.classList.contains('visible')) {
            if (e.key === 'ArrowLeft') {
                const card = document.querySelector('.story-card[data-position="0"]');
                if (card) {
                    const story = state.stories[state.currentIndex];
                    animateCardExit(card, 'left', nextCard);
                }
            }
            if (e.key === 'ArrowRight') {
                const story = state.stories[state.currentIndex];
                if (story) openModal(story);
            }
        }
    });
}

// ==========================================
// Start App
// ==========================================

document.addEventListener('DOMContentLoaded', init);
