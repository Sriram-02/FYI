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
        summary: "Gold prices fell sharply as investors took profits after the precious metal hit record highs near $2,450/oz. The sell-off was accelerated by algorithmic trading and institutional limit orders set at psychological price barriers. Despite the correction, central banks—particularly in Asia—continue accumulating gold reserves, signaling long-term confidence in the asset as a hedge against economic uncertainty.",
        imageUrl: "",
        questions: [
            {
                label: "✦",
                text: "Why are investors selling NOW after gold hit records?",
                answer: "Classic profit-taking psychology. Gold touched $2,450/oz—a psychological barrier that triggered algorithmic selling. Large institutional investors had set limit orders at this level months ago. Additionally, recent Fed signals suggesting delayed rate cuts reduced gold's appeal as a hedge. When momentum traders see others exiting, FOMO works in reverse.",
                deepQuestions: [
                    { text: "What makes $2,450 a psychological barrier?", answer: "Round numbers act as mental anchors for traders. Institutions set automatic sell orders at these levels, and when multiple orders trigger simultaneously, it creates a cascade effect. This is why you see sharp movements at price points like $2,000, $2,250, and $2,500." },
                    { text: "How do algorithmic traders impact gold prices?", answer: "Algorithms now account for 60-70% of trading volume. They detect patterns and execute trades in milliseconds. When algorithms sense selling momentum, they amplify it by front-running expected price drops, creating self-fulfilling prophecies." },
                    { text: "Why does Fed policy affect gold so much?", answer: "Gold doesn't pay interest or dividends. When the Fed keeps rates high, bonds become more attractive alternatives. Gold's appeal increases when real interest rates (adjusted for inflation) are low or negative, making holding gold less costly compared to interest-bearing assets." }
                ]
            },
            {
                label: "✦",
                text: "Does this mean gold isn't safe anymore?",
                answer: "Not at all—this is normal market behavior, not a fundamental shift. Gold remains the ultimate crisis hedge. What we're seeing is a technical correction after a 15% rally. Long-term holders aren't selling; it's primarily short-term traders and algorithms. Central banks, especially in Asia, continue accumulating.",
                deepQuestions: [
                    { text: "What's the difference between a correction and a crash?", answer: "A correction is typically a 10-20% decline from recent highs and is considered healthy market behavior. A crash implies a sudden, severe decline (20%+) often driven by panic. This gold movement is firmly in correction territory—normal after any strong rally." },
                    { text: "Why are central banks still buying gold?", answer: "Central banks are diversifying away from US dollar reserves due to geopolitical risks and inflation concerns. China, Russia, and Turkey have been major buyers. Gold offers protection against currency devaluation and can't be sanctioned or frozen like foreign currency reserves." }
                ]
            },
            {
                label: "✦",
                text: "How is USD recovering with Trump chaos?",
                answer: "Counterintuitively, political uncertainty often strengthens the dollar short-term. Global investors flee to USD-denominated assets during volatility—it's still the world's reserve currency. Meanwhile, other major economies face their own issues: Europe's stagnation, China's property crisis, Japan's weak yen.",
                deepQuestions: [
                    { text: "Why do investors run TO the dollar during US political chaos?", answer: "It's the 'cleanest dirty shirt' phenomenon. Despite domestic turmoil, US markets remain the deepest and most liquid globally. Treasury bonds are still considered the safest assets. When uncertainty hits anywhere, the reflex is to buy dollars first, ask questions later." },
                    { text: "Could another currency replace the dollar?", answer: "Not soon. The dollar represents 60% of global reserves and 88% of forex trades. No alternative has the liquidity, legal framework, or trust. China's yuan has capital controls, Europe lacks unified fiscal policy, and crypto is too volatile. Change would take decades, not years." }
                ]
            }
        ]
    },
    {
        id: 2,
        date: getTodayDate(),
        emoji: "🤝",
        headline: "India-UAE Sign Nuclear, Defence, Trade Pacts",
        teaser: "A landmark strategic partnership bundles nuclear cooperation, defense agreements, and trade access into one comprehensive deal. The diplomatic move creates powerful interdependencies between both nations that extend far beyond traditional bilateral relations. This agreement signals a major shift in Middle East power dynamics and energy security frameworks.",
        summary: "India and the UAE signed a comprehensive strategic partnership covering nuclear energy cooperation, defense technology sharing, and expanded trade access. The deal includes training for UAE nuclear engineers and potential export of Indian defense systems like BrahMos missiles. This bundled approach creates mutual dependencies that strengthen bilateral ties and positions both nations advantageously in the evolving Middle East power structure.",
        imageUrl: "",
        questions: [
            {
                label: "✦",
                text: "Why bundle nuclear + defense + trade together?",
                answer: "It's diplomatic leverage maximization. Bundling creates interdependencies that make either party think twice before souring relations. If UAE wants nuclear cooperation, they commit to defense purchases. If India wants trade access, they share technology. Each component serves as insurance for the others.",
                deepQuestions: [
                    { text: "Is this bundling strategy common in international deals?", answer: "Yes, it's called 'package diplomacy.' The US does it with arms sales tied to political alignment. China's Belt and Road bundles infrastructure with resource access. The strategy reduces the risk of one-sided agreements and creates lasting partnerships." },
                    { text: "What does India gain from this specific bundle?", answer: "India gets a reliable energy partner, a major defense export market, and preferential trade terms. UAE's oil-rich economy provides investment capital India needs. The defense sales boost India's 'Make in India' initiative and establish it as a credible arms exporter." }
                ]
            },
            {
                label: "✦",
                text: "Since when does UAE have nuclear capability?",
                answer: "UAE's Barakah Nuclear Power Plant went operational in 2020—the first in the Arab world. They're not building weapons; this is about clean energy. The country aims for 25% nuclear power by 2030. India's cooperation involves training UAE engineers and potentially supplying components.",
                deepQuestions: [
                    { text: "Why would an oil-rich country need nuclear power?", answer: "Forward-thinking energy policy. UAE knows oil is finite and faces climate pressure. Nuclear provides baseload power for industry and desalination. Using oil for export rather than domestic consumption maximizes revenue. It's also about prestige and technological advancement." },
                    { text: "Is there any weapons proliferation risk here?", answer: "UAE signed the 'gold standard' 123 Agreement with the US, explicitly renouncing enrichment and reprocessing. They import fuel and return spent rods. The IAEA monitors closely. This is genuinely a civilian energy program—among the most transparent globally." }
                ]
            },
            {
                label: "✦",
                text: "Why UAE and not Russia for defense?",
                answer: "Russia's Ukraine situation changed everything. Their weapons are now battle-tested—and found wanting. Export capacity dropped as they prioritize domestic needs. Western sanctions complicate spare parts. India offers a middle path: proven systems like BrahMos missiles, no sanctions risk.",
                deepQuestions: [
                    { text: "How has Ukraine changed perceptions of Russian weapons?", answer: "Russian tanks, aircraft, and air defense systems have shown vulnerabilities against Western weapons. The vaunted T-90 tanks proved vulnerable to Javelins. Their inability to achieve air superiority raised questions about their aircraft. Buyers now question if they're getting reliable technology." },
                    { text: "What makes Indian defense equipment attractive?", answer: "India offers a 'non-aligned' option—no political strings attached. BrahMos missiles are genuinely world-class (fastest cruise missiles). Indian equipment often incorporates both Russian and Western technology, offering a unique hybrid. Pricing is competitive with generous financing." }
                ]
            }
        ]
    },
    {
        id: 3,
        date: getTodayDate(),
        emoji: "🤖",
        headline: "India Sets Up AI Task Force for Vulnerabilities",
        teaser: "The government has established a dedicated committee to assess AI model risks and develop regulatory frameworks for emerging technologies. This move positions India in the global conversation on AI governance alongside the EU and US, while balancing innovation incentives with safety concerns. The task force includes experts from major tech companies and academic institutions.",
        summary: "India formed a dedicated AI task force to assess vulnerabilities in AI models and develop appropriate regulatory frameworks. The committee includes experts from Google DeepMind, Microsoft Research India, and leading academic institutions. With a 6-month deadline for initial recommendations, India aims to establish its voice in global AI governance while balancing innovation with safety—particularly focusing on challenges unique to its context like misinformation in local languages.",
        imageUrl: "",
        questions: [
            {
                label: "✦",
                text: "Does India even have AI expertise for this?",
                answer: "More than people assume. India has the world's second-largest AI talent pool after the US. IITs and IISc produce top researchers; many return from Silicon Valley. The task force includes people from Google DeepMind, Microsoft Research India, and TCS Research.",
                deepQuestions: [
                    { text: "Why does India have such a large AI talent pool?", answer: "It's the engineering education infrastructure. India produces 1.5 million engineering graduates annually. Top IITs are globally competitive. Plus, the Indian diaspora in Silicon Valley creates a reverse brain drain as senior researchers return to lead labs at Google, Microsoft, and Amazon in India." },
                    { text: "How does India's AI research compare globally?", answer: "India ranks 5th globally in AI research publications. Indian researchers have contributed to major breakthroughs in NLP (particularly multilingual models), computer vision, and AI for healthcare. The gap is in funding and compute resources rather than talent." }
                ]
            },
            {
                label: "✦",
                text: "Will this just be another 3-year report nobody reads?",
                answer: "Valid skepticism, but timing matters. Unlike past tech committees, AI regulation has global urgency—EU's AI Act, Biden's executive order, China's rules. India can't afford to be left out of standard-setting. The task force has a 6-month deadline for initial recommendations.",
                deepQuestions: [
                    { text: "What's different about this task force?", answer: "Three things: tight deadline (6 months vs typical 2-3 years), industry participation (not just bureaucrats), and clear mandate (actionable recommendations, not just observations). The pressure from global AI regulation race adds external accountability." },
                    { text: "How has India's past tech regulation performed?", answer: "Mixed. IT Act 2000 was forward-thinking. Data Protection Bill took 5 years and multiple drafts. Digital India initiatives moved fast. The pattern suggests urgency and industry involvement correlate with better outcomes—both present here." }
                ]
            },
            {
                label: "✦",
                text: "Why not outsource to EU? They're ahead on regulation",
                answer: "EU's AI Act is designed for European values and market structures—privacy-first, precautionary principle, heavy compliance costs. India's priorities differ: enabling AI adoption for development, protecting against misinformation in local languages, and maintaining tech sovereignty.",
                deepQuestions: [
                    { text: "What are India-specific AI challenges?", answer: "Misinformation in 22 official languages (EU deals with ~24 but lower linguistic diversity), deepfakes in elections with 900 million voters, AI for agricultural advisories to 120 million farmers, and bias in systems trained predominantly on Western data. Generic Western frameworks don't address these." },
                    { text: "What does 'tech sovereignty' mean for AI?", answer: "It means not depending on foreign-controlled AI systems for critical applications. India wants domestic capability in foundational AI models, control over training data, and the ability to audit systems used in governance. It's about strategic autonomy, not isolation." }
                ]
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
    currentQuestion: null, // Track current Q&A question for Dig Deeper
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
    viewedStories: [],
    longPressTimer: null,
    isLongPress: false,
    userName: '',
    // Archive mode
    archiveMode: false,
    archiveStories: [],
    archiveIndex: 0,
    originalStories: [], // Store today's stories when entering archive mode
    // Track if navigated from completion screen
    cameFromCompletion: false,
    // Track if in recap view (accessed from completion)
    inRecapView: false
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
    elements.yourQuestionsBtn = document.getElementById('yourQuestionsBtn');
    elements.swipeHint = document.getElementById('swipeHint');
    elements.emptyRefreshBtn = document.getElementById('emptyRefreshBtn');
    elements.prevStoryBtn = document.getElementById('prevStoryBtn');

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

    // Summary Modal
    elements.summaryModalBackdrop = document.getElementById('summaryModalBackdrop');
    elements.summaryModal = document.getElementById('summaryModal');
    elements.summaryModalClose = document.getElementById('summaryModalClose');
    elements.summaryModalHeadline = document.getElementById('summaryModalHeadline');

    // Dig Deeper
    elements.digDeeperBtn = document.getElementById('digDeeperBtn');
    elements.digDeeperView = document.getElementById('digDeeperView');
    elements.deepQuestionsContainer = document.getElementById('deepQuestionsContainer');
    elements.deepAnswerView = document.getElementById('deepAnswerView');
    elements.deepAnswerQuestion = document.getElementById('deepAnswerQuestion');
    elements.deepAnswerText = document.getElementById('deepAnswerText');
    elements.deepDoneBtn = document.getElementById('deepDoneBtn');

    // Modal Prev Buttons
    elements.answerViewPrev = document.getElementById('answerViewPrev');
    elements.digDeeperViewPrev = document.getElementById('digDeeperViewPrev');
    elements.deepAnswerViewPrev = document.getElementById('deepAnswerViewPrev');

    // Welcome Modal
    elements.welcomeModalBackdrop = document.getElementById('welcomeModalBackdrop');
    elements.welcomeNameInput = document.getElementById('welcomeNameInput');
    elements.welcomeSubmitBtn = document.getElementById('welcomeSubmitBtn');

    // User Name Display
    elements.fyiUserName = document.getElementById('fyiUserName');
    elements.fyiComma = document.querySelector('.fyi-comma');
    elements.fyiSpace = document.querySelector('.fyi-space');
    elements.logoTextBlock = document.getElementById('logoTextBlock');
    elements.completionTitle = document.getElementById('completionTitle');

    // Summary Modal Bullets
    elements.summaryModalBullets = document.getElementById('summaryModalBullets');

    // Recap Week
    elements.recapWeekBtn = document.getElementById('recapWeekBtn');
    elements.recapWeekView = document.getElementById('recapWeekView');
    elements.recapStoriesList = document.getElementById('recapStoriesList');
    elements.recapEmpty = document.getElementById('recapEmpty');
    elements.recapBackBtn = document.getElementById('recapBackBtn');
}

// ==========================================
// Initialization
// ==========================================

async function init() {
    cacheElements();
    loadFromStorage();
    applyTheme();
    setupEventListeners();

    // Check if user has set their name
    const savedName = localStorage.getItem('fyi_user_name');
    if (savedName && savedName.trim().length > 0) {
        state.userName = savedName.trim();
        updateUserNameDisplay();
    } else {
        // Show welcome modal for first-time users
        showWelcomeModal();
        return; // Don't load content until name is set
    }

    // Show loading and fetch stories
    await loadAppContent();

    // Track app opened
    trackAppOpened();
}

async function loadAppContent() {
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

// ==========================================
// Archives Functions
// ==========================================

async function fetchArchiveStories() {
    // Check if sheet ID is configured
    if (SHEET_ID === 'YOUR_SHEET_ID_HERE' || !SHEET_ID) {
        return [];
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

        // Get all stories except today
        const today = getTodayDate();

        // Filter to archive stories only (excluding today)
        const archiveStories = stories.filter(story => {
            const storyDate = parseDate(story.date);
            return storyDate !== today;
        });

        // Sort by date (most recent first)
        archiveStories.sort((a, b) => {
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            return dateB.localeCompare(dateA);
        });

        // Return last 50 stories
        return archiveStories.slice(0, 50);
    } catch (error) {
        console.error('Error fetching archive stories:', error);
        return [];
    }
}

function getPastWeekDates() {
    const dates = [];
    const today = new Date();

    // Get past 7 days (not including today)
    for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
    }

    return dates;
}

function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

async function showRecapView() {
    triggerHaptic('light');

    // Track that we came from completion screen
    state.cameFromCompletion = true;
    state.inRecapView = true;

    // Show loading state
    showLoading(true);

    // Fetch archive stories
    const archiveStories = await fetchArchiveStories();

    showLoading(false);

    if (archiveStories.length === 0) {
        // Show empty state in recap view
        elements.recapStoriesList.innerHTML = '';
        elements.recapEmpty.style.display = 'block';
        elements.completionScreen.classList.remove('visible');
        elements.recapWeekView.classList.add('visible');
        // Show prev button for returning to completion
        updatePrevButtonForCompletionNav();
        return;
    }

    // Enter archive mode - show archive stories as swipeable cards
    state.archiveMode = true;
    state.originalStories = [...state.stories]; // Save current stories
    state.archiveStories = archiveStories;
    state.archiveIndex = 0;

    // Replace current stories with archive stories
    state.stories = archiveStories;
    state.totalStories = archiveStories.length;
    state.currentIndex = 0;
    state.viewedStories = [];

    // Hide completion screen
    elements.completionScreen.classList.remove('visible');

    // Render archive cards
    updateProgress();
    renderProgressDots();
    renderCards();
    updatePrevButtonVisibility();

    showToast('📚', `${archiveStories.length} archive stories loaded`);
}

function hideRecapView() {
    triggerHaptic('light');
    elements.recapWeekView.classList.remove('visible');
    elements.completionScreen.classList.add('visible');
    // Reset navigation state
    state.cameFromCompletion = false;
    state.inRecapView = false;
    updatePrevButtonVisibility();
}

function exitArchiveMode() {
    if (!state.archiveMode) return;

    state.archiveMode = false;

    // Restore today's stories
    state.stories = state.originalStories;
    state.totalStories = state.stories.length;
    state.currentIndex = 0;
    state.viewedStories = [];
    state.archiveStories = [];
    state.originalStories = [];

    // Re-render with today's stories
    elements.completionScreen.classList.remove('visible');
    updateProgress();
    renderProgressDots();
    renderCards();
    updatePrevButtonVisibility();

    showToast('✓', "Back to today's stories");
}

// Exit archive mode and return to completion screen (used by Prev button)
function exitArchiveModeToCompletion() {
    if (!state.archiveMode) return;

    state.archiveMode = false;
    state.cameFromCompletion = false;
    state.inRecapView = false;

    // Restore today's stories
    state.stories = state.originalStories;
    state.totalStories = state.stories.length;
    state.currentIndex = state.totalStories; // Set to end so completion shows
    state.viewedStories = [];
    state.archiveStories = [];
    state.originalStories = [];

    // Clear all cards from DOM
    elements.cardContainer.innerHTML = '';

    // Show completion screen
    elements.completionScreen.classList.add('visible');
    elements.progressFill.style.width = '100%';
    if (elements.historyToggle) elements.historyToggle.classList.add('hidden');

    // Update completion title
    if (state.userName && elements.completionTitle) {
        elements.completionTitle.textContent = `Take a break, ${state.userName}`;
    }

    updateCompletionButtons();
    updatePrevButtonVisibility();
    triggerHaptic('light');
}

function renderRecapStories(stories) {
    // Group stories by date
    const groupedByDate = {};
    stories.forEach(story => {
        const date = parseDate(story.date);
        if (!groupedByDate[date]) {
            groupedByDate[date] = [];
        }
        groupedByDate[date].push(story);
    });

    // Render grouped stories
    let html = '';
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

    sortedDates.forEach(date => {
        const displayDate = formatDateForDisplay(date);
        html += `<div class="recap-date-group">
            <div class="recap-date-header">${displayDate}</div>`;

        groupedByDate[date].forEach((story, index) => {
            html += `
                <div class="recap-story-card" data-recap-date="${date}" data-recap-index="${index}">
                    <span class="recap-story-emoji">${story.emoji || '📰'}</span>
                    <div class="recap-story-info">
                        <h4 class="recap-story-headline">${story.headline}</h4>
                    </div>
                    <svg class="recap-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </div>`;
        });

        html += '</div>';
    });

    elements.recapStoriesList.innerHTML = html;

    // Add click handlers
    const recapCards = elements.recapStoriesList.querySelectorAll('.recap-story-card');
    recapCards.forEach(card => {
        card.addEventListener('click', () => {
            const date = card.dataset.recapDate;
            const index = parseInt(card.dataset.recapIndex);
            const story = groupedByDate[date][index];
            if (story) {
                triggerHaptic('light');
                openRecapStoryModal(story);
            }
        });
    });
}

function openRecapStoryModal(story) {
    // Set the current story for modal interaction
    state.currentStory = story;
    state.currentQuestion = null;

    // Open the Q&A modal
    openModal(story);
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) return [];

    // Parse header row
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim().replace(/\s+/g, ' '));

    // Expected column structure (28 columns):
    // 0: Date, 1: Headline, 2: Teaser, 3: Summary
    // 4: Question 1, 5: Question 2, 6: Question 3, 7: Question 4
    // 8: Answer 1, 9: Answer 2, 10: Answer 3
    // 11-13: Q1-Deep1, Q1-Deep2, Q1-Deep3
    // 14-16: A1-Deep1, A1-Deep2, A1-Deep3
    // 17-19: Q2-Deep1, Q2-Deep2, Q2-Deep3
    // 20-22: A2-Deep1, A2-Deep2, A2-Deep3
    // 23-25: Q3-Deep1, Q3-Deep2, Q3-Deep3
    // 26-28: A3-Deep1, A3-Deep2, A3-Deep3
    // 29: Banner Image URL

    // Map expected headers to indices
    const headerMap = {};

    headers.forEach((header, index) => {
        const normalized = header.replace(/[^a-z0-9\s-]/g, '').trim();

        // Core fields
        if (header === 'date' || normalized === 'date') headerMap['date'] = index;
        if (header === 'headline' || normalized === 'headline') headerMap['headline'] = index;
        if (header === 'teaser' || normalized === 'teaser') headerMap['teaser'] = index;
        if (header === 'summary' || normalized === 'summary') headerMap['summary'] = index;

        // Questions 1-4
        if (header.includes('question 1') || normalized === 'question 1') headerMap['question 1'] = index;
        if (header.includes('question 2') || normalized === 'question 2') headerMap['question 2'] = index;
        if (header.includes('question 3') || normalized === 'question 3') headerMap['question 3'] = index;
        if (header.includes('question 4') || normalized === 'question 4') headerMap['question 4'] = index;

        // Answers 1-3
        if (header.includes('answer 1') || normalized === 'answer 1') headerMap['answer 1'] = index;
        if (header.includes('answer 2') || normalized === 'answer 2') headerMap['answer 2'] = index;
        if (header.includes('answer 3') || normalized === 'answer 3') headerMap['answer 3'] = index;

        // Deep questions for Q1
        if (header.includes('q1-deep1') || normalized === 'q1-deep1') headerMap['q1-deep1'] = index;
        if (header.includes('q1-deep2') || normalized === 'q1-deep2') headerMap['q1-deep2'] = index;
        if (header.includes('q1-deep3') || normalized === 'q1-deep3') headerMap['q1-deep3'] = index;

        // Deep answers for Q1
        if (header.includes('a1-deep1') || normalized === 'a1-deep1') headerMap['a1-deep1'] = index;
        if (header.includes('a1-deep2') || normalized === 'a1-deep2') headerMap['a1-deep2'] = index;
        if (header.includes('a1-deep3') || normalized === 'a1-deep3') headerMap['a1-deep3'] = index;

        // Deep questions for Q2
        if (header.includes('q2-deep1') || normalized === 'q2-deep1') headerMap['q2-deep1'] = index;
        if (header.includes('q2-deep2') || normalized === 'q2-deep2') headerMap['q2-deep2'] = index;
        if (header.includes('q2-deep3') || normalized === 'q2-deep3') headerMap['q2-deep3'] = index;

        // Deep answers for Q2
        if (header.includes('a2-deep1') || normalized === 'a2-deep1') headerMap['a2-deep1'] = index;
        if (header.includes('a2-deep2') || normalized === 'a2-deep2') headerMap['a2-deep2'] = index;
        if (header.includes('a2-deep3') || normalized === 'a2-deep3') headerMap['a2-deep3'] = index;

        // Deep questions for Q3
        if (header.includes('q3-deep1') || normalized === 'q3-deep1') headerMap['q3-deep1'] = index;
        if (header.includes('q3-deep2') || normalized === 'q3-deep2') headerMap['q3-deep2'] = index;
        if (header.includes('q3-deep3') || normalized === 'q3-deep3') headerMap['q3-deep3'] = index;

        // Deep answers for Q3
        if (header.includes('a3-deep1') || normalized === 'a3-deep1') headerMap['a3-deep1'] = index;
        if (header.includes('a3-deep2') || normalized === 'a3-deep2') headerMap['a3-deep2'] = index;
        if (header.includes('a3-deep3') || normalized === 'a3-deep3') headerMap['a3-deep3'] = index;

        // Banner Image URL
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

        // Process image URL - handle relative paths from /images/ folder
        let imageUrl = getValue('banner image url', 27);
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            // Assume it's a filename in the /images/ folder
            imageUrl = `/images/${imageUrl}`;
        }

        // Build story object using the 28-column structure
        const story = {
            id: i,
            date: getValue('date', 0),
            emoji: '📰', // No emoji column - use default
            headline: getValue('headline', 1),
            teaser: getValue('teaser', 2),
            summary: getValue('summary', 3),
            imageUrl: imageUrl,
            questions: []
        };

        // Parse questions 1-3 with their deep dive questions
        for (let q = 1; q <= 3; q++) {
            const question = getValue(`question ${q}`, 3 + q);
            const answer = getValue(`answer ${q}`, 7 + q);

            if (question && question.trim() && answer && answer.trim()) {
                // Build deep dive questions array
                const deepQuestions = [];
                for (let d = 1; d <= 3; d++) {
                    const deepQ = getValue(`q${q}-deep${d}`, -1);
                    const deepA = getValue(`a${q}-deep${d}`, -1);
                    if (deepQ && deepQ.trim() && deepA && deepA.trim()) {
                        deepQuestions.push({
                            text: deepQ.trim(),
                            answer: deepA.trim()
                        });
                    }
                }

                story.questions.push({
                    label: '✦',
                    text: question.trim(),
                    answer: answer.trim(),
                    deepQuestions: deepQuestions
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
// User Name / Welcome Modal
// ==========================================

function showWelcomeModal() {
    elements.welcomeModalBackdrop.classList.add('visible');
    setTimeout(() => {
        elements.welcomeNameInput.focus();
    }, 300);
}

function hideWelcomeModal() {
    elements.welcomeModalBackdrop.classList.remove('visible');
}

function formatUserName(name) {
    // Proper capitalization: first letter uppercase, rest lowercase
    const trimmed = name.trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function saveUserName(name) {
    const formatted = formatUserName(name);
    if (formatted) {
        localStorage.setItem('fyi_user_name', formatted);
        state.userName = formatted;
        updateUserNameDisplay();
        hideWelcomeModal();
        // Now load the app content
        loadAppContent();
        trackAppOpened();
    }
}

function updateUserNameDisplay() {
    if (state.userName) {
        elements.fyiUserName.textContent = state.userName;
        elements.fyiComma.classList.remove('hidden');
        if (elements.fyiSpace) elements.fyiSpace.classList.remove('hidden');
        elements.fyiUserName.classList.remove('hidden');

        // Dynamically adjust font size for long names - shrink entire logo block together
        adjustLogoFontSize();
    } else {
        elements.fyiComma.classList.add('hidden');
        if (elements.fyiSpace) elements.fyiSpace.classList.add('hidden');
        elements.fyiUserName.classList.add('hidden');
    }
}

function adjustLogoFontSize() {
    // Reset to default size first
    if (elements.logoTextBlock) {
        elements.logoTextBlock.style.fontSize = '';
    }

    // Get available width (header width minus hamburger and theme toggle buttons with padding)
    const headerWidth = window.innerWidth;
    const availableWidth = headerWidth - 140; // Reserve 140px for hamburger (44px) + theme toggle (44px) + padding

    // Measure current width of entire logo block
    const logoBlock = elements.logoTextBlock;
    if (!logoBlock) return;

    const logoWidth = logoBlock.offsetWidth;

    // If logo block is too wide, reduce font size for the ENTIRE block (both FYI and Name together)
    if (logoWidth > availableWidth) {
        const ratio = availableWidth / logoWidth;
        const currentSize = 28; // Default font size in CSS
        const newSize = Math.max(16, Math.floor(currentSize * ratio));
        logoBlock.style.fontSize = `${newSize}px`;
    }
}

// ==========================================
// HTML Text Formatting
// ==========================================

function parseFormattedText(text) {
    if (!text) return text;

    // Parse custom HTML-like tags for formatting
    let formatted = text;

    // <color1>text</color1> -> orange accent color
    formatted = formatted.replace(/<color1>(.*?)<\/color1>/gi, '<span class="text-color1">$1</span>');

    // <color2>text</color2> -> teal/blue secondary color
    formatted = formatted.replace(/<color2>(.*?)<\/color2>/gi, '<span class="text-color2">$1</span>');

    // <color3>text</color3> -> plum/purple color (#6B5C8A)
    formatted = formatted.replace(/<color3>(.*?)<\/color3>/gi, '<span class="text-color3">$1</span>');

    // <mark>text</mark> -> yellow highlight background
    formatted = formatted.replace(/<mark>(.*?)<\/mark>/gi, '<span class="text-mark">$1</span>');

    // <lookup def="definition">word</lookup> -> clickable orange underlined word
    formatted = formatted.replace(
        /<lookup\s+def="([^"]*)">(.*?)<\/lookup>/gi,
        '<span class="text-lookup" data-definition="$1" onclick="showLookupTooltip(this, event)">$2</span>'
    );

    return formatted;
}

function parseSummaryWithBullets(text) {
    if (!text) return '';

    // Split by <br> tags
    const lines = text.split(/<br\s*\/?>/gi);

    // If only one line (no <br> tags), return as single bullet
    if (lines.length === 1) {
        return `<div class="summary-bullet-item">
            <span class="summary-bullet-icon">✦</span>
            <span class="summary-bullet-text">${parseFormattedText(lines[0].trim())}</span>
        </div>`;
    }

    // Multiple lines - create bullet for each non-empty line
    return lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => `<div class="summary-bullet-item">
            <span class="summary-bullet-icon">✦</span>
            <span class="summary-bullet-text">${parseFormattedText(line)}</span>
        </div>`)
        .join('');
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
        if (elements.historyToggle) elements.historyToggle.classList.add('hidden');
        return;
    }

    elements.noStoriesState.classList.remove('visible');
    if (elements.historyToggle) elements.historyToggle.classList.remove('hidden');

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

    // Update prev button visibility
    updatePrevButtonVisibility();
}

function createCardElement(story, position) {
    const card = document.createElement('div');
    card.className = 'story-card';
    card.dataset.id = story.id;
    card.dataset.position = position;
    card.dataset.flipped = 'false';

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

    // Parse summary for display on back face
    const summaryText = story.summary || story.teaser || '';
    const summaryHTML = parseFormattedText(summaryText);

    // Check if user has flipped before (for "Tap to flip" hint)
    const hasFlippedBefore = localStorage.getItem('fyi_has_flipped') === 'true';
    const flipHintClass = hasFlippedBefore ? 'hidden' : '';

    card.innerHTML = `
        <div class="card-flipper">
            <!-- FRONT FACE -->
            <div class="card-face card-front">
                <div class="card-swipe-overlay left"></div>
                <div class="card-swipe-overlay right"></div>
                ${bannerHTML}
                <div class="card-body">
                    <h2 class="card-headline">${story.headline}</h2>
                    <p class="card-teaser">${teaserText}</p>
                </div>
                <!-- Bottom Navigation Indicators - All clickable -->
                <div class="card-nav-indicators">
                    <button class="nav-indicator nav-skip" data-action="skip">
                        <svg class="nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 14L4 9l5-5"/>
                            <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>
                        </svg>
                        <span>Skip</span>
                    </button>
                    <button class="nav-indicator nav-flip" data-action="flip" id="flipHint-${story.id}">
                        <span>Tap to flip</span>
                    </button>
                    <button class="nav-indicator nav-curious" data-action="curious">
                        <span>Curious</span>
                        <svg class="nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 14l5-5-5-5"/>
                            <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- BACK FACE -->
            <div class="card-face card-back">
                <div class="card-swipe-overlay left"></div>
                <div class="card-swipe-overlay right"></div>
                <div class="card-back-content">
                    <h3 class="card-back-header">Summary</h3>
                    <div class="card-summary-text">${summaryHTML}</div>
                </div>
                <!-- Bottom Navigation Indicators - All clickable -->
                <div class="card-nav-indicators">
                    <button class="nav-indicator nav-skip" data-action="skip">
                        <svg class="nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 14L4 9l5-5"/>
                            <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>
                        </svg>
                        <span>Skip</span>
                    </button>
                    <button class="nav-indicator nav-flip-back" data-action="flip">
                        <span>Tap to flip back</span>
                    </button>
                    <button class="nav-indicator nav-curious" data-action="curious">
                        <span>Curious</span>
                        <svg class="nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 14l5-5-5-5"/>
                            <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;

    if (position === 0) {
        setupCardInteractions(card, story);
    }

    return card;
}

// Flip card function
function flipCard(card, story) {
    const isFlipped = card.dataset.flipped === 'true';

    if (isFlipped) {
        // Flip back to front
        card.classList.remove('flipped');
        card.dataset.flipped = 'false';
    } else {
        // Flip to back (summary)
        card.classList.add('flipped');
        card.dataset.flipped = 'true';

        // Hide the "Tap to flip" hint permanently after first flip
        if (localStorage.getItem('fyi_has_flipped') !== 'true') {
            localStorage.setItem('fyi_has_flipped', 'true');
            // Hide all flip hints on all cards
            document.querySelectorAll('.nav-flip').forEach(hint => {
                hint.classList.add('hidden');
            });
        }
    }
}

function setupCardInteractions(card, story) {
    // Touch events for swiping
    card.addEventListener('touchstart', (e) => handleDragStart(e, card, story), { passive: true });
    card.addEventListener('touchmove', (e) => handleDragMove(e, card), { passive: false });
    card.addEventListener('touchend', (e) => handleDragEnd(e, card, story));

    // Mouse events for desktop swiping
    card.addEventListener('mousedown', (e) => handleDragStart(e, card, story));
    card.addEventListener('mousemove', (e) => handleDragMove(e, card));
    card.addEventListener('mouseup', (e) => handleDragEnd(e, card, story));
    card.addEventListener('mouseleave', (e) => {
        if (state.isDragging) handleDragEnd(e, card, story);
    });

    // Setup click handlers for nav buttons (Skip, Flip, Curious)
    setupNavButtonHandlers(card, story);
}

function setupNavButtonHandlers(card, story) {
    // Find all nav indicator buttons
    const navButtons = card.querySelectorAll('.nav-indicator');

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent swipe handler from triggering
            const action = btn.dataset.action;

            if (action === 'skip') {
                // Skip: animate card left and go to next
                triggerHaptic('light');
                animateCardExit(card, 'left', () => nextCard());
            } else if (action === 'flip') {
                // Flip: toggle card flip
                triggerHaptic('light');
                flipCard(card, story);
            } else if (action === 'curious') {
                // Curious: open Q&A modal
                triggerHaptic('medium');
                animateCardExitWithModal(card, 'right', () => {}, story);
            }
        });

        // Prevent touch events on buttons from triggering swipe
        btn.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: true });

        btn.addEventListener('touchend', (e) => {
            e.stopPropagation();
        });
    });
}

// ==========================================
// Drag/Swipe Handling
// ==========================================

function handleDragStart(e, card, story) {
    state.isDragging = true;
    state.isLongPress = false;
    state.startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    state.startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    state.currentX = 0;
    card.classList.add('dragging');
    hideSwipeHint();
    // Long-press flip REMOVED - flip is now only via "Tap to flip" button
}

// Long-press timer functions REMOVED - flip is now only via "Tap to flip" button
function clearLongPressTimer() {
    // No-op: long press timer removed
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
            // Swipe RIGHT: Card glides off smoothly to the right while Q&A modal opens
            animateCardExitWithModal(card, 'right', () => {
                // Card has exited, modal is already open
            }, story);
        } else {
            // Swipe LEFT: Skip to next card
            animateCardExit(card, 'left', () => nextCard());
        }
    } else {
        // Tap or small drag: snap back (flip is ONLY via "Tap to flip" button)
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

function animateCardExitWithModal(card, direction, callback, story) {
    // Smoothly animate card off screen while opening modal simultaneously
    const exitX = direction === 'left' ? -window.innerWidth : window.innerWidth * 0.7;
    const rotation = direction === 'left' ? -20 : 12;

    // Use smooth easing for premium feel
    card.style.transition = 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1), opacity 450ms cubic-bezier(0.32, 0.72, 0, 1)';
    card.classList.add('exiting');
    card.style.transform = `translateX(${exitX}px) rotate(${rotation}deg) scale(0.85)`;
    card.style.opacity = '0';

    // Open modal immediately for coordinated animation
    openModal(story);

    setTimeout(() => {
        card.style.transition = '';
        // Don't remove the card - keep it invisible until modal closes
        // This prevents visual issues if user closes modal early
        if (callback) callback();
    }, 450);
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
        updatePrevButtonVisibility();
    }
}

function prevCard() {
    // If on completion screen, clear it first and show last story
    if (elements.completionScreen.classList.contains('visible')) {
        elements.completionScreen.classList.remove('visible');
        // Restore history toggle if present
        if (elements.historyToggle) elements.historyToggle.classList.remove('hidden');
        // Decrement to show last story
        if (state.currentIndex > 0) {
            state.currentIndex--;
        } else {
            // If at index 0, we need to go to last story (totalStories - 1)
            state.currentIndex = Math.max(0, state.totalStories - 1);
        }
        saveToStorage();
        updateProgress();
        renderProgressDots();
        renderCards();
        updatePrevButtonVisibility();
        triggerHaptic('light');
        return;
    }

    // Normal prev card navigation
    if (state.currentIndex > 0) {
        state.currentIndex--;
        saveToStorage();
        updateProgress();
        renderProgressDots();
        renderCards();
        updatePrevButtonVisibility();
        triggerHaptic('light');
    }
}

function updatePrevButtonVisibility() {
    if (elements.prevStoryBtn) {
        // Hide prev button on first story, unless we came from completion screen
        const shouldHide = state.currentIndex === 0 && !state.cameFromCompletion && !state.inRecapView;
        elements.prevStoryBtn.classList.toggle('hidden', shouldHide);
    }
}

// Show prev button when navigating from completion screen to history/recap
function updatePrevButtonForCompletionNav() {
    if (elements.prevStoryBtn && state.cameFromCompletion) {
        elements.prevStoryBtn.classList.remove('hidden');
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
    if (elements.historyToggle) elements.historyToggle.classList.add('hidden');

    // Update completion title with user's name - "Take a break, [name]"
    if (state.userName && elements.completionTitle) {
        elements.completionTitle.textContent = `Take a break, ${state.userName}`;
    }

    // Update button labels based on archive mode
    updateCompletionButtons();
}

function updateCompletionButtons() {
    // "Review Stories" button - loops within current context
    const reviewBtn = elements.reviewStoriesBtn;
    if (reviewBtn) {
        const reviewText = reviewBtn.querySelector('span');
        if (state.archiveMode) {
            reviewText.textContent = 'Review archives';
        } else {
            reviewText.textContent = 'Review stories';
        }
    }

    // "Go to Archives" button - switches context
    const archiveBtn = elements.recapWeekBtn;
    if (archiveBtn) {
        const archiveText = archiveBtn.querySelector('span');
        if (state.archiveMode) {
            archiveText.textContent = "Back to today";
        } else {
            archiveText.textContent = 'Go to archives';
        }
    }
}

function resetApp() {
    state.currentIndex = 0;
    state.viewedStories = [];
    saveToStorage();
    elements.completionScreen.classList.remove('visible');
    if (elements.historyToggle) elements.historyToggle.classList.remove('hidden');
    updateProgress();
    renderProgressDots();
    renderCards();
    showSwipeHint();
    updatePrevButtonVisibility();
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

    // Store current question for Dig Deeper feature
    state.currentQuestion = question;

    // Track question clicked
    trackQuestionClicked(state.currentStory.headline, question.text);

    console.log('[showAnswer] Transitioning from Q&A to answer view');

    // Reset all views first
    resetAllModalViews();

    // Prepare answer view content before showing
    elements.answerLabel.textContent = '✦';
    elements.answerQuestion.textContent = question.text;
    elements.answerText.innerHTML = parseFormattedText(question.answer);

    // Show/hide Dig Deeper button based on availability
    const hasDeepQuestions = question.deepQuestions && question.deepQuestions.length > 0;
    if (elements.digDeeperBtn) {
        elements.digDeeperBtn.style.display = hasDeepQuestions ? 'flex' : 'none';
    }

    resetStars();

    // Now show answer view
    elements.answerView.classList.remove('hidden');
    elements.answerView.style.display = 'block';
    elements.answerView.style.visibility = 'visible';
    elements.answerView.style.opacity = '1';

    // Force reflow
    void elements.answerView.offsetHeight;
}

function showQAView() {
    console.log('[showQAView] Starting transition to Q&A view');

    // STRATEGY 1: Complete reset of all modal views
    const allViews = [elements.qaView, elements.answerView, elements.digDeeperView, elements.deepAnswerView].filter(v => v);

    // First, immediately hide all views without animation
    allViews.forEach(v => {
        v.classList.add('hidden');
        v.classList.remove('fade-out', 'fade-in');
        // Reset ALL possible inline styles
        v.style.cssText = '';
        v.style.zIndex = '';
        v.style.opacity = '';
        v.style.visibility = '';
        v.style.pointerEvents = '';
        v.style.display = '';
        v.style.position = '';
        v.style.transform = '';
    });

    // STRATEGY 2: Force reflow to ensure styles are applied
    void document.body.offsetHeight;

    // STRATEGY 3: Explicitly show Q&A view
    elements.qaView.classList.remove('hidden');
    elements.qaView.style.display = 'block';
    elements.qaView.style.visibility = 'visible';
    elements.qaView.style.opacity = '1';
    elements.qaView.style.pointerEvents = 'auto';

    // STRATEGY 4: Force another reflow
    void elements.qaView.offsetHeight;

    // STRATEGY 5: Verify modal backdrop is still correctly visible
    if (!elements.modalBackdrop.classList.contains('visible')) {
        elements.modalBackdrop.classList.add('visible');
    }

    // STRATEGY 6: Ensure modal container is on top
    elements.qaModal.style.zIndex = '301';

    console.log('[showQAView] Q&A view should now be visible');
    console.log('[showQAView] qaView hidden?', elements.qaView.classList.contains('hidden'));
    console.log('[showQAView] qaView display:', getComputedStyle(elements.qaView).display);

    // Verify function - check everything is correct
    verifyModalState();
}

function verifyModalState() {
    // Check Q&A view is visible
    const qaViewStyle = getComputedStyle(elements.qaView);
    const qaViewVisible = qaViewStyle.display !== 'none' && qaViewStyle.visibility !== 'hidden';

    // Check other views are hidden
    const answerHidden = elements.answerView.classList.contains('hidden');
    const digDeeperHidden = elements.digDeeperView ? elements.digDeeperView.classList.contains('hidden') : true;
    const deepAnswerHidden = elements.deepAnswerView ? elements.deepAnswerView.classList.contains('hidden') : true;

    console.log('[verifyModalState] Q&A visible:', qaViewVisible);
    console.log('[verifyModalState] Answer hidden:', answerHidden);
    console.log('[verifyModalState] DigDeeper hidden:', digDeeperHidden);
    console.log('[verifyModalState] DeepAnswer hidden:', deepAnswerHidden);

    // Check for any stray overlay elements
    const overlays = document.querySelectorAll('[class*="overlay"], [class*="backdrop"]');
    overlays.forEach(el => {
        const style = getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'absolute') {
            console.log('[verifyModalState] Found overlay element:', el.className, 'zIndex:', style.zIndex);
        }
    });
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
        elements.digDeeperView.classList.add('hidden');
        elements.digDeeperView.classList.remove('fade-out', 'fade-in');
        elements.deepAnswerView.classList.add('hidden');
        elements.deepAnswerView.classList.remove('fade-out', 'fade-in');
        state.currentStory = null;
        state.currentQuestion = null;
        state.currentHistoryEntry = null;

        // Re-render cards to restore any that were animated out for the modal
        renderCards();
    }, 300);
}

// ==========================================
// Summary Modal
// ==========================================

function openSummaryModal(story) {
    state.currentStory = story;

    // Track story viewed
    const storyIndex = state.stories.findIndex(s => s.id === story.id);
    trackStoryViewed(storyIndex + 1, story.headline);

    elements.summaryModalHeadline.textContent = story.headline;

    // Parse summary with bullets and HTML formatting
    const summaryText = story.summary || story.teaser;
    elements.summaryModalBullets.innerHTML = parseSummaryWithBullets(summaryText);

    elements.summaryModalBackdrop.classList.add('visible');
    document.body.classList.add('no-scroll');

    // Setup swipe to dismiss
    setupSummaryModalSwipe();
}

function closeSummaryModal() {
    elements.summaryModalBackdrop.classList.remove('visible');
    document.body.classList.remove('no-scroll');
    elements.summaryModal.style.transform = '';
}

function setupSummaryModalSwipe() {
    let startY = 0;
    let currentY = 0;

    const modal = elements.summaryModal;

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
            closeSummaryModal();
        } else {
            modal.style.transform = '';
        }

        startY = 0;
        currentY = 0;
    };

    // Remove old listeners first to avoid duplicates
    modal.removeEventListener('touchstart', modal._touchStartHandler);
    modal.removeEventListener('touchmove', modal._touchMoveHandler);
    modal.removeEventListener('touchend', modal._touchEndHandler);

    // Store handlers for removal later
    modal._touchStartHandler = handleTouchStart;
    modal._touchMoveHandler = handleTouchMove;
    modal._touchEndHandler = handleTouchEnd;

    modal.addEventListener('touchstart', handleTouchStart, { passive: true });
    modal.addEventListener('touchmove', handleTouchMove, { passive: false });
    modal.addEventListener('touchend', handleTouchEnd);
}

// ==========================================
// Dig Deeper Feature
// ==========================================

function showDigDeeper() {
    console.log('[showDigDeeper] Transitioning to dig deeper view');

    const question = state.currentQuestion;
    if (!question || !question.deepQuestions || question.deepQuestions.length === 0) {
        showToast('ℹ', 'No follow-up questions available');
        showQAView();
        return;
    }

    // Reset all views first
    resetAllModalViews();

    // Populate deep questions
    elements.deepQuestionsContainer.innerHTML = '';
    question.deepQuestions.forEach((dq, index) => {
        const button = document.createElement('button');
        button.className = 'deep-question-button';
        button.innerHTML = `
            <span class="deep-question-label">✦</span>
            <span class="deep-question-text">${dq.text}</span>
        `;
        button.addEventListener('click', () => {
            triggerHaptic('light');
            showDeepAnswer(dq);
        });
        elements.deepQuestionsContainer.appendChild(button);
    });

    // Add "Back to main questions" option
    const backButton = document.createElement('button');
    backButton.className = 'deep-question-button';
    backButton.style.background = 'transparent';
    backButton.style.border = '1px solid var(--border-color)';
    backButton.innerHTML = `
        <span class="deep-question-label">←</span>
        <span class="deep-question-text">Back to main questions</span>
    `;
    backButton.addEventListener('click', () => {
        triggerHaptic('light');
        hideDigDeeper();
    });
    elements.deepQuestionsContainer.appendChild(backButton);

    // Show dig deeper view
    elements.digDeeperView.classList.remove('hidden');
    elements.digDeeperView.style.display = 'block';
    elements.digDeeperView.style.visibility = 'visible';
    elements.digDeeperView.style.opacity = '1';

    // Force reflow
    void elements.digDeeperView.offsetHeight;
}

function hideDigDeeper() {
    console.log('[hideDigDeeper] Returning to Q&A view');
    showQAView();
}

function showDeepAnswer(deepQuestion) {
    console.log('[showDeepAnswer] Transitioning to deep answer view');

    // Reset all views first
    resetAllModalViews();

    // Prepare deep answer content
    elements.deepAnswerQuestion.textContent = deepQuestion.text;
    elements.deepAnswerText.innerHTML = parseFormattedText(deepQuestion.answer);

    // Show deep answer view
    elements.deepAnswerView.classList.remove('hidden');
    elements.deepAnswerView.style.display = 'block';
    elements.deepAnswerView.style.visibility = 'visible';
    elements.deepAnswerView.style.opacity = '1';

    // Force reflow
    void elements.deepAnswerView.offsetHeight;
}

function backToDeepQuestions() {
    console.log('[backToDeepQuestions] Transitioning from deep answer to deep questions');

    // Immediately reset all views
    resetAllModalViews();

    // Show only dig deeper view
    elements.digDeeperView.classList.remove('hidden');
    elements.digDeeperView.style.display = 'block';
    elements.digDeeperView.style.visibility = 'visible';
    elements.digDeeperView.style.opacity = '1';

    // Force reflow
    void elements.digDeeperView.offsetHeight;
}

function hideDigDeeperToAnswer() {
    console.log('[hideDigDeeperToAnswer] Transitioning from dig deeper to answer');

    // Immediately reset all views
    resetAllModalViews();

    // Show only answer view
    elements.answerView.classList.remove('hidden');
    elements.answerView.style.display = 'block';
    elements.answerView.style.visibility = 'visible';
    elements.answerView.style.opacity = '1';

    // Force reflow
    void elements.answerView.offsetHeight;
}

function deepDone() {
    console.log('[deepDone] Returning to Q&A view from deep answer');

    // Use the comprehensive showQAView function
    showQAView();
}

// Helper function to reset all modal views to hidden state
function resetAllModalViews() {
    const allViews = [elements.qaView, elements.answerView, elements.digDeeperView, elements.deepAnswerView].filter(v => v);

    allViews.forEach(v => {
        v.classList.add('hidden');
        v.classList.remove('fade-out', 'fade-in');
        v.style.cssText = '';
    });

    // Force reflow
    void document.body.offsetHeight;
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
    // Apply HTML formatting to history answer
    elements.answerText.innerHTML = parseFormattedText(entry.answer);

    // Hide Dig Deeper button for history items (no deep questions stored)
    if (elements.digDeeperBtn) {
        elements.digDeeperBtn.style.display = 'none';
    }

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
        if (elements.historyToggle) elements.historyToggle.classList.remove('hidden');
        // Reset navigation state when returning to today
        state.cameFromCompletion = false;
        updatePrevButtonVisibility();
    } else {
        elements.sectionHistory.classList.add('active');
        if (elements.historyToggle) elements.historyToggle.classList.add('hidden');
        // Show prev button if came from completion
        updatePrevButtonForCompletionNav();
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
// Word Lookup Tooltip
// ==========================================

function createLookupTooltip() {
    // Create tooltip if it doesn't exist
    if (document.getElementById('lookupTooltip')) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'lookup-tooltip';
    tooltip.id = 'lookupTooltip';
    tooltip.innerHTML = `
        <div class="lookup-tooltip-header">FYI explains</div>
        <div class="lookup-tooltip-content" id="lookupTooltipContent"></div>
    `;
    document.body.appendChild(tooltip);
}

function showLookupTooltip(element, event) {
    event.stopPropagation(); // Prevent card flip

    createLookupTooltip();

    const tooltip = document.getElementById('lookupTooltip');
    const content = document.getElementById('lookupTooltipContent');
    const definition = element.dataset.definition;

    if (!definition) return;

    content.textContent = definition;

    // Position tooltip near the word
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 280;

    let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

    let top = rect.bottom + 8;
    // If not enough space below, show above
    if (top + 150 > window.innerHeight) {
        top = rect.top - 120;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.classList.add('visible');

    triggerHaptic('light');

    // Close on click outside (after a small delay)
    setTimeout(() => {
        document.addEventListener('click', closeLookupTooltip, { once: true });
        document.addEventListener('touchstart', closeLookupTooltip, { once: true });
    }, 10);
}

function closeLookupTooltip() {
    const tooltip = document.getElementById('lookupTooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
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
        if (state.archiveMode) {
            // Exit archive mode and return to today's stories
            exitArchiveMode();
        } else if (state.stories.length > 0 && (state.currentIndex > 0 || elements.completionScreen.classList.contains('visible'))) {
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

    // Dig Deeper button
    if (elements.digDeeperBtn) {
        elements.digDeeperBtn.addEventListener('click', () => {
            triggerHaptic('light');
            showDigDeeper();
        });
    }

    // Deep done button
    if (elements.deepDoneBtn) {
        elements.deepDoneBtn.addEventListener('click', () => {
            triggerHaptic('light');
            deepDone();
        });
    }

    // Modal Prev buttons
    if (elements.answerViewPrev) {
        elements.answerViewPrev.addEventListener('click', () => {
            triggerHaptic('light');
            showQAView();
        });
    }

    if (elements.digDeeperViewPrev) {
        elements.digDeeperViewPrev.addEventListener('click', () => {
            triggerHaptic('light');
            hideDigDeeperToAnswer();
        });
    }

    if (elements.deepAnswerViewPrev) {
        elements.deepAnswerViewPrev.addEventListener('click', () => {
            triggerHaptic('light');
            backToDeepQuestions();
        });
    }

    // Summary Modal close button
    if (elements.summaryModalClose) {
        elements.summaryModalClose.addEventListener('click', () => {
            triggerHaptic('light');
            closeSummaryModal();
        });
    }

    // Summary Modal backdrop click
    if (elements.summaryModalBackdrop) {
        elements.summaryModalBackdrop.addEventListener('click', (e) => {
            if (e.target === elements.summaryModalBackdrop) {
                triggerHaptic('light');
                closeSummaryModal();
            }
        });
    }

    // Review stories button
    elements.reviewStoriesBtn.addEventListener('click', () => {
        triggerHaptic('light');
        resetApp();
    });

    // Your Questions button (on completion screen)
    if (elements.yourQuestionsBtn) {
        elements.yourQuestionsBtn.addEventListener('click', () => {
            triggerHaptic('light');
            state.cameFromCompletion = true; // Track that we came from completion
            switchSection('history');
        });
    }

    // Prev Story button - handles both card navigation AND returning from completion-accessed pages
    if (elements.prevStoryBtn) {
        elements.prevStoryBtn.addEventListener('click', () => {
            // If we're in history section (came from completion's "Your Questions")
            if (state.currentSection === 'history' && state.cameFromCompletion) {
                // Return to completion screen
                state.cameFromCompletion = false;
                switchSection('today');
                elements.completionScreen.classList.add('visible');
                return;
            }
            // If we're in recap view (came from completion's "Go to archives")
            if (state.inRecapView && state.cameFromCompletion) {
                hideRecapView();
                return;
            }
            // If in archive mode on first card, exit archive mode and show completion
            if (state.archiveMode && state.currentIndex === 0) {
                exitArchiveModeToCompletion();
                return;
            }
            // Default: go to previous card
            prevCard();
        });
    }

    // Recap This Week / Back to Today button - toggles between modes
    if (elements.recapWeekBtn) {
        elements.recapWeekBtn.addEventListener('click', () => {
            if (state.archiveMode) {
                // In archive mode: go back to today's stories
                exitArchiveMode();
            } else {
                // In today mode: go to archives
                showRecapView();
            }
        });
    }

    // Star rating
    setupStarRating();

    // History toggle (legacy floating button, may be removed)
    if (elements.historyToggle) {
        elements.historyToggle.addEventListener('click', () => {
            switchSection('history');
        });
    }

    // History back button - REMOVED from HTML, functionality moved to global Prev button

    // Welcome modal submit
    if (elements.welcomeSubmitBtn) {
        elements.welcomeSubmitBtn.addEventListener('click', () => {
            const name = elements.welcomeNameInput.value.trim();
            if (name) {
                triggerHaptic('medium');
                saveUserName(name);
            }
        });
    }

    // Welcome modal input - submit on Enter key
    if (elements.welcomeNameInput) {
        elements.welcomeNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const name = elements.welcomeNameInput.value.trim();
                if (name) {
                    triggerHaptic('medium');
                    saveUserName(name);
                }
            }
        });
    }

    // Resize handler to adjust logo font size
    window.addEventListener('resize', () => {
        if (state.userName) {
            adjustLogoFontSize();
        }
    });

    // Pull to refresh
    setupPullToRefresh();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape closes modals
        if (e.key === 'Escape') {
            if (elements.summaryModalBackdrop && elements.summaryModalBackdrop.classList.contains('visible')) {
                closeSummaryModal();
            } else if (elements.modalBackdrop.classList.contains('visible')) {
                closeModal();
            }
        }

        // Arrow keys for card navigation (when no modal is open)
        const anyModalOpen = (elements.modalBackdrop && elements.modalBackdrop.classList.contains('visible')) ||
                             (elements.summaryModalBackdrop && elements.summaryModalBackdrop.classList.contains('visible'));

        if (state.currentSection === 'today' && !anyModalOpen) {
            if (e.key === 'ArrowLeft') {
                const card = document.querySelector('.story-card[data-position="0"]');
                if (card) {
                    animateCardExit(card, 'left', nextCard);
                }
            }
            if (e.key === 'ArrowRight') {
                const story = state.stories[state.currentIndex];
                if (story) openModal(story);
            }
            if (e.key === ' ' || e.key === 'Enter') {
                // Space/Enter opens Summary Modal
                e.preventDefault();
                const story = state.stories[state.currentIndex];
                if (story) openSummaryModal(story);
            }
        }
    });
}

// ==========================================
// Android/Chrome Anti-Scaling Defense
// ==========================================

/**
 * Applies defensive measures against Chrome's automatic text scaling
 * This runs before init() to ensure the layout is correct from the start
 */
function applyAntiScalingDefense() {
    // Force text-size-adjust on all elements via injected style
    const style = document.createElement('style');
    style.id = 'anti-scaling-defense';
    style.textContent = `
        * {
            -webkit-text-size-adjust: 100% !important;
            text-size-adjust: 100% !important;
        }
    `;
    document.head.appendChild(style);

    // Ensure viewport meta is correctly set for Android
    let viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content',
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
    }

    // Prevent any zoom gestures on iOS
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    }, { passive: false });

    // Prevent double-tap zoom on all platforms
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
}

// ==========================================
// Start App
// ==========================================

// Apply anti-scaling defense immediately when script loads
applyAntiScalingDefense();

document.addEventListener('DOMContentLoaded', init);
