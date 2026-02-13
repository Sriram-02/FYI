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

// FAQ Sheet name (separate tab for FAQ content)
const FAQ_SHEET_NAME = 'FAQs';

// ==========================================
// PLAUSIBLE ANALYTICS CONFIGURATION
// ==========================================
// Add your Plausible domain here after signing up at plausible.io
// Example: const PLAUSIBLE_DOMAIN = 'fyi.yourdomain.com';
// Leave as empty string to disable analytics
const PLAUSIBLE_DOMAIN = 'https://fyi-news.netlify.app/';

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

/**
 * Track card swipe event
 * @param {string} direction - 'skip' (left) or 'curious' (right)
 * @param {string} headline - The story headline
 * @param {number} storyNumber - Which story (1, 2, or 3)
 */
function trackSwipe(direction, headline, storyNumber) {
    trackEvent('Card Swiped', {
        direction: direction,
        story: storyNumber,
        headline: headline.substring(0, 50)
    });
}

/**
 * Track card flip event
 * @param {string} headline - The story headline
 * @param {string} side - 'to_summary' or 'to_front'
 */
function trackCardFlip(headline, side) {
    trackEvent('Card Flipped', {
        side: side,
        headline: headline.substring(0, 50)
    });
}

/**
 * Track completion screen viewed
 * @param {number} storiesRead - Number of stories completed
 * @param {number} curiousCount - Number of stories swiped curious
 */
function trackCompletionViewed(storiesRead, curiousCount) {
    trackEvent('Completion Viewed', {
        stories_read: storiesRead,
        curious_count: curiousCount
    });
}

/**
 * Track Dig Deeper interaction
 * @param {string} headline - The story headline
 * @param {string} deepQuestion - The deep question clicked
 */
function trackDigDeeper(headline, deepQuestion) {
    trackEvent('Dig Deeper Clicked', {
        headline: headline.substring(0, 50),
        question: deepQuestion.substring(0, 100)
    });
}

/**
 * Track archive/recap viewed
 * @param {string} source - 'completion_button' or 'header_recap'
 */
function trackRecapViewed(source) {
    trackEvent('Recap Viewed', {
        source: source
    });
}

/**
 * Track archive story opened
 * @param {string} headline - The story headline
 * @param {string} date - The story date
 */
function trackArchiveStoryOpened(headline, date) {
    trackEvent('Archive Story Opened', {
        headline: headline.substring(0, 50),
        date: date
    });
}

/**
 * Track skip question (when user skips all questions)
 * @param {string} headline - The story headline
 */
function trackQuestionsSkipped(headline) {
    trackEvent('Questions Skipped', {
        headline: headline.substring(0, 50)
    });
}

/**
 * Track session duration when user leaves
 * Called on page unload
 */
function trackSessionEnd() {
    const sessionDuration = Math.round((Date.now() - sessionStartTime) / 1000);
    trackEvent('Session Ended', {
        duration_seconds: sessionDuration,
        stories_completed: state.currentIndex
    });
}

// Session start time for duration tracking
const sessionStartTime = Date.now();

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
    currentY: 0, // Track vertical movement for up/down swipes
    dragThreshold: 50, // Reduced from 100 for new swipe mechanics
    swipeVelocityThreshold: 0.3, // px/ms velocity threshold
    swipeStartTime: 0, // Track swipe start time for velocity calculation
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
    inRecapView: false,
    // FAQ mode
    faqMode: false,
    faqStories: [],
    faqIndex: 0,
    faqCompleted: false, // Track if user has completed FAQ onboarding
    // Content mode: 'stories', 'faqs', or 'archives'
    contentMode: 'stories',
    // First-time user choice tracking
    isFirstTimeUser: true,
    showedWelcomeChoice: false,
    showFAQsAfterName: false, // Flag to show FAQs after name entry
    // Track if entered archives from no-stories page
    enteredArchivesFromNoStories: false,
    // App mode state machine: 'welcome', 'faqs', 'stories', 'archives', 'no_stories'
    appMode: 'welcome',

    // NEW: Card layer stack for navigation
    // Layers: 'headline' (front) -> 'summary' (flipped) -> 'questions' -> 'answer' -> 'deep-questions' -> 'deep-answer'
    cardLayer: 'headline', // Current visible layer
    modalStack: [], // Stack of modal states for back navigation

    // NEW: Track if card is flipped (on summary side)
    isCardFlipped: false
};

// ==========================================
// STATE MACHINE - App Mode Management
// ==========================================

/**
 * Comprehensive cleanup function that removes ALL UI elements
 * Must be called before ANY state transition
 */
function cleanupCurrentState() {
    console.log('[STATE] Cleaning up current state:', state.appMode);

    // Close all modals
    if (elements.modalBackdrop) {
        elements.modalBackdrop.classList.remove('visible');
        document.body.classList.remove('no-scroll');
    }
    if (elements.summaryModalBackdrop) {
        elements.summaryModalBackdrop.classList.remove('visible');
    }
    if (elements.whatIsFYIModal) {
        elements.whatIsFYIModal.classList.remove('visible');
    }
    if (elements.ourPhilosophyModal) {
        elements.ourPhilosophyModal.classList.remove('visible');
    }

    // Hide completion screen
    if (elements.completionScreen) {
        elements.completionScreen.classList.remove('visible');
    }

    // Hide no-stories state
    if (elements.noStoriesState) {
        elements.noStoriesState.classList.remove('visible');
        elements.noStoriesState.style.display = 'none';
    }

    // Hide recap view
    if (elements.recapWeekView) {
        elements.recapWeekView.classList.remove('visible');
    }

    // Clear card container
    if (elements.cardContainer) {
        elements.cardContainer.innerHTML = '';
    }

    // Reset modal views to initial state
    resetAllModalViews();

    // Clear navigation state
    state.cameFromCompletion = false;
    state.inRecapView = false;

    // Remove any stray backdrop overlays
    document.body.classList.remove('no-scroll');

    console.log('[STATE] Cleanup complete');
}

/**
 * Transition to a new app mode with proper cleanup and initialization
 * @param {string} newMode - 'welcome', 'faqs', 'stories', 'archives', 'no_stories'
 * @param {object} options - Additional options for the transition
 */
async function transitionToMode(newMode, options = {}) {
    const previousMode = state.appMode;
    console.log(`[STATE TRANSITION] ${previousMode} → ${newMode}`, options);

    // Skip cleanup for welcome → name input transitions
    if (!(previousMode === 'welcome' && newMode === 'welcome')) {
        cleanupCurrentState();
    }

    // Update state
    state.appMode = newMode;

    // Reset mode-specific flags
    state.faqMode = (newMode === 'faqs');
    state.archiveMode = (newMode === 'archives');
    state.enteredArchivesFromNoStories = options.fromNoStories || false;

    // Clear connection to previous FAQ state when leaving FAQs
    if (previousMode === 'faqs' && newMode !== 'faqs') {
        state.faqStories = [];
        state.faqIndex = 0;
        // Mark FAQ as completed if user went through FAQs
        if (!state.faqCompleted && state.currentIndex > 0) {
            state.faqCompleted = true;
            localStorage.setItem('fyi_faq_completed', 'true');
        }
    }

    // Initialize the new mode
    switch (newMode) {
        case 'faqs':
            await initFAQMode(options.isNewUserOnboarding || false, options.forceRefresh || false);
            break;
        case 'stories':
            await initStoriesMode(options);
            break;
        case 'archives':
            await initArchivesMode(options);
            break;
        case 'no_stories':
            initNoStoriesMode();
            break;
        case 'welcome':
            // Welcome is handled separately
            break;
    }

    // Update Prev button visibility
    updatePrevButtonVisibility();

    console.log(`[STATE] Transition complete. Now in: ${state.appMode}`);

    // Verify clean state after transition
    setTimeout(verifyCleanState, 450);
}

/**
 * Initialize FAQ mode - load FAQ cards fresh
 * @param {boolean} isNewUserOnboarding - True when this is part of new user welcome flow
 * @param {boolean} forceRefresh - True to bypass cache and fetch fresh data
 */
async function initFAQMode(isNewUserOnboarding = false, forceRefresh = false) {
    console.log('[initFAQMode] Loading FAQ content, isNewUserOnboarding:', isNewUserOnboarding, 'forceRefresh:', forceRefresh);

    // Use custom loading text for new user onboarding
    const loadingText = isNewUserOnboarding ? "Let's show you around" : "Loading FAQs...";
    showLoading(true, loadingText);

    const faqs = await fetchFAQs(forceRefresh);
    state.faqStories = faqs;
    state.stories = faqs;
    state.totalStories = faqs.length;
    state.currentIndex = 0;
    state.viewedStories = [];

    showLoading(false);

    // Update UI
    updateDateDisplay();
    renderProgressDots();
    renderCards();

    trackEvent('FAQ Mode Entered');
}

/**
 * Initialize Stories mode - load today's stories
 */
async function initStoriesMode(options = {}) {
    console.log('[initStoriesMode] Loading today\'s stories');

    // Clear FAQ state completely
    state.faqMode = false;
    state.faqStories = [];

    showLoading(true);
    await fetchStories();
    showLoading(false);

    // Check if we have stories
    if (state.stories.length === 0) {
        // No stories - transition to no_stories mode
        state.appMode = 'no_stories';
        initNoStoriesMode();
        return;
    }

    // Reset to first story unless specified otherwise
    if (!options.preserveIndex) {
        state.currentIndex = 0;
        state.viewedStories = [];
    }

    // Update UI
    updateDateDisplay();
    renderProgressDots();
    renderCards();
    updateProgress();

    if (state.currentIndex === 0) {
        showSwipeHint();
    }
}

/**
 * Initialize Archives mode - load archive stories
 */
async function initArchivesMode(options = {}) {
    console.log('[initArchivesMode] Loading archive stories');

    showLoading(true);

    const archiveStories = await fetchArchiveStories();

    showLoading(false);

    if (archiveStories.length === 0) {
        showToast('⚠', 'No archive stories available');
        // Fall back to stories mode
        await transitionToMode('stories');
        return;
    }

    state.archiveStories = archiveStories;
    state.stories = archiveStories;
    state.totalStories = archiveStories.length;
    state.currentIndex = 0;
    state.viewedStories = [];

    // Store original stories if coming from stories mode
    if (options.originalStories) {
        state.originalStories = options.originalStories;
    }

    // Update UI
    updateDateDisplay();
    renderProgressDots();
    renderCards();
    updateProgress();

    trackEvent('Archive Mode Entered', { source: options.source || 'unknown' });
}

/**
 * Initialize No Stories mode - show empty state
 */
function initNoStoriesMode() {
    console.log('[initNoStoriesMode] Showing no stories page');

    if (elements.noStoriesState) {
        elements.noStoriesState.style.display = 'flex';
        elements.noStoriesState.classList.add('visible');
    }

    updateDateDisplay();
}

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
    elements.loadingText = document.querySelector('.loading-text');
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

    // Welcome Modal - Choice Screen
    elements.welcomeChoiceBackdrop = document.getElementById('welcomeChoiceBackdrop');
    elements.welcomeNewUserBtn = document.getElementById('welcomeNewUserBtn');
    elements.welcomeReturningBtn = document.getElementById('welcomeReturningBtn');

    // Welcome Modal - Name Input
    elements.welcomeModalBackdrop = document.getElementById('welcomeModalBackdrop');
    elements.welcomeNameInput = document.getElementById('welcomeNameInput');
    elements.welcomeSubmitBtn = document.getElementById('welcomeSubmitBtn');
    elements.welcomeBackBtn = document.getElementById('welcomeBackBtn');

    // FAQs Menu Button
    elements.faqsBtn = document.getElementById('faqsBtn');

    // No Stories - Archives Button
    elements.emptyArchivesBtn = document.getElementById('emptyArchivesBtn');

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
    setupSessionTracking();

    // Check if user has set their name
    const savedName = localStorage.getItem('fyi_user_name');
    const faqCompleted = localStorage.getItem('fyi_faq_completed') === 'true';

    if (savedName && savedName.trim().length > 0) {
        state.userName = savedName.trim();
        state.faqCompleted = faqCompleted;
        state.isFirstTimeUser = false;
        updateUserNameDisplay();
    } else {
        // First-time user - show welcome choice modal
        state.isFirstTimeUser = true;
        showWelcomeChoice();
        return; // Don't load content until name is set
    }

    // Show loading and fetch stories
    await loadAppContent();

    // Track app opened
    trackAppOpened();
}

/**
 * Show the welcome choice modal (New here? / Been here before?)
 */
function showWelcomeChoice() {
    if (elements.welcomeChoiceBackdrop) {
        elements.welcomeChoiceBackdrop.classList.add('visible');
    }
}

/**
 * Hide the welcome choice modal
 */
function hideWelcomeChoice() {
    if (elements.welcomeChoiceBackdrop) {
        elements.welcomeChoiceBackdrop.classList.remove('visible');
    }
}

/**
 * Setup session tracking for when user leaves the app
 */
function setupSessionTracking() {
    // Track session end when page is about to unload
    window.addEventListener('pagehide', () => {
        trackSessionEnd();
    });

    // Also track on visibility change (when user switches tabs/apps on mobile)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            trackSessionEnd();
        }
    });
}

async function loadAppContent() {
    // Set app mode to stories
    state.appMode = 'stories';
    state.faqMode = false;
    state.archiveMode = false;

    showLoading(true);
    await fetchStories();
    showLoading(false);

    // Check if we have stories
    if (state.stories.length === 0) {
        state.appMode = 'no_stories';
    }

    renderCards();
    updateProgress();
    updateDateDisplay();
    renderProgressDots();
    renderHistory();
    showSwipeHint();
    registerServiceWorker();
}

// Format and display today's date (or appropriate text for FAQ/archive mode)
function updateDateDisplay() {
    // Reset any FAQ-specific styling first
    elements.dateDisplay.classList.remove('faq-title-display');

    if (state.faqMode) {
        // Show FAQ title with special styling
        elements.dateDisplay.textContent = 'FAQs: See what we\'re all about';
        elements.dateDisplay.classList.add('faq-title-display');
    } else if (state.archiveMode) {
        // Show "Archives" instead of date
        elements.dateDisplay.textContent = 'Archives';
    } else {
        // Show today's date
        const today = new Date();
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const formattedDate = today.toLocaleDateString('en-US', options);
        elements.dateDisplay.textContent = formattedDate;
    }
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

// ==========================================
// FAQ Functions
// ==========================================

/**
 * Fetch FAQ content from the FAQs sheet with caching
 * FAQs use the same column structure as stories but:
 * - No date filtering (FAQs are evergreen)
 * - Only 3 questions displayed (Question 4 is always "Skip this FAQ")
 * - No Dig Deeper functionality (deep question columns are empty)
 *
 * Caching: FAQ data is cached in localStorage for 24 hours
 * Cache key: 'fyi_faq_data'
 * Cache timestamp key: 'fyi_faq_timestamp'
 */
async function fetchFAQs(forceRefresh = false) {
    const CACHE_KEY = 'fyi_faq_data';
    const CACHE_TIMESTAMP_KEY = 'fyi_faq_timestamp';
    const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

    // Check if sheet ID is configured
    if (SHEET_ID === 'YOUR_SHEET_ID_HERE' || !SHEET_ID) {
        console.log('Sheet ID not configured, using fallback FAQs');
        return getFallbackFAQs();
    }

    // Check cache unless force refresh is requested
    if (!forceRefresh) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

        if (cachedData && cachedTimestamp) {
            const cacheAge = Date.now() - parseInt(cachedTimestamp, 10);
            if (cacheAge < CACHE_DURATION_MS) {
                console.log('[FAQ] Using cached FAQ data (age:', Math.round(cacheAge / 1000 / 60), 'minutes)');
                try {
                    return JSON.parse(cachedData);
                } catch (e) {
                    console.warn('[FAQ] Cache parse error, fetching fresh data');
                }
            } else {
                console.log('[FAQ] Cache expired, fetching fresh data');
            }
        }
    }

    try {
        // Fetch FAQ sheet as CSV
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(FAQ_SHEET_NAME)}`;

        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch FAQ sheet');
        }

        const csvText = await response.text();
        const faqs = parseCSV(csvText);

        // FAQs don't need date filtering - return all
        if (faqs.length > 0) {
            // Log warning if not exactly 5 FAQs
            if (faqs.length !== 5) {
                console.warn(`[FAQ] Expected 5 FAQs, found ${faqs.length}`);
            }

            // Process FAQs - ensure no deep questions are shown
            const processedFaqs = faqs.map(faq => ({
                ...faq,
                isFAQ: true,
                // Use image from sheet or fall back to cat image
                imageUrl: faq.imageUrl || '/images/cat-sleep.jpg',
                // Strip deep questions from FAQ questions
                questions: faq.questions.map(q => ({
                    ...q,
                    deepQuestions: [] // FAQs don't have dig deeper
                }))
            }));

            // Cache the processed FAQs
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(processedFaqs));
                localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
                console.log('[FAQ] Cached', processedFaqs.length, 'FAQs from Google Sheets');
            } catch (e) {
                console.warn('[FAQ] Failed to cache FAQs:', e.message);
            }

            return processedFaqs;
        }

        // Sheet exists but is empty - show updating message
        console.warn('[FAQ] FAQ sheet is empty');
        showToast('ℹ️', 'FAQs are being updated. Please check back soon.');
        return getFallbackFAQs();
    } catch (error) {
        console.error('Error fetching FAQs:', error);

        // Try to use cached data even if expired
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            console.log('[FAQ] Using expired cache due to fetch error');
            try {
                return JSON.parse(cachedData);
            } catch (e) {
                // Cache corrupted
            }
        }

        // Show error message and return fallback
        showToast('⚠️', "We're having trouble loading FAQs. Please try refreshing.");
        return getFallbackFAQs();
    }
}

/**
 * Fallback FAQ content when sheet is not configured
 */
function getFallbackFAQs() {
    return [
        {
            id: 'faq-1',
            isFAQ: true,
            headline: "Why do I need another news app?",
            teaser: "We know you've been here before—another news service promising \"high-quality\" news that \"cuts the clutter.\" We get the eye roll. But hear us out.",
            summary: "✦ We're not trying to keep you informed about everything—that's impossible and exhausting<br>✦ We curate 3-5 stories daily that actually matter for conversations you'll have with real people<br>✦ We teach you how to think about news, not just what happened—questions beat headlines every time",
            imageUrl: "images/cat-sleep.jpg",
            questions: [
                {
                    label: "✦",
                    text: "News apps have just not worked for me, I'm still skeptical",
                    answer: "We get it. This exact skepticism is what got us to start FYI in the first place. Most news apps either overwhelm you with notifications or simplify things to the point of uselessness. We're not here to replace your news diet—we're here to make you sharper in the 15 minutes you actually have to engage with what's happening.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "What are your qualifications to report on this?",
                    answer: "Fair question. We're students at IIM Bangalore with 6+ years of competitive debate experience—meaning we're trained to interrogate arguments, spot BS, and explain complex ideas simply. Think of us as your smart friend who reads too much and can't help but share what's actually interesting.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "How is this different from reading headlines on Twitter or Reddit?",
                    answer: "Twitter gives you hot takes. Reddit gives you crowd consensus. We give you the questions you'd ask if you had time to dig deeper. Plus, our stuff is curated—you're not scrolling through an algorithm designed to keep you angry and engaged. You get in, get smarter, get out.",
                    deepQuestions: []
                }
            ]
        },
        {
            id: 'faq-2',
            isFAQ: true,
            headline: "What kind of stories do you report on?",
            teaser: "We don't break headlines. We don't give you an endless stream of stories. So why should you pick us?",
            summary: "✦ We report on stories you'll actually discuss—the ones where people say \"Did you see that thing about...\"<br>✦ Business, geopolitics, tech, culture—anything that reveals how the world actually works<br>✦ If a story won't teach you something or make you sound smarter in conversation, we skip it",
            imageUrl: "images/cat-sleep.jpg",
            questions: [
                {
                    label: "✦",
                    text: "Do you plan to personalize stories further?",
                    answer: "Yes, soon! Right now we're keeping it simple—5 stories a day that we think work for most curious people. But we're building features to let you pick topics you care about most. Politics bore you? Skip them. Obsessed with AI? Get more. We want FYI to feel like it's made for you, not for \"users.\"",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "Will you ever cover local news or niche topics?",
                    answer: "Maybe. We're focused on stories with broad relevance right now—things that matter whether you're in Mumbai, Delhi, or Bangalore. But if there's enough interest in hyperlocal stuff or niche deep-dives, we're open to experimenting. Let us know what you want to see.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "How do you decide what's \"conversation-worthy\"?",
                    answer: "Simple test: Would this come up at dinner with smart friends? If yes, it's in. We avoid breaking news that'll be outdated in 6 hours, clickbait that sounds important but isn't, and niche wonkery that only policy nerds care about. We're optimizing for \"Oh, I read about this\" moments, not \"I saw a headline\" moments.",
                    deepQuestions: []
                }
            ]
        },
        {
            id: 'faq-3',
            isFAQ: true,
            headline: "Do you store my data?",
            teaser: "We're a bunch of 20-somethings who forget to store our friends' phone numbers. Relax—we're not tracking you.",
            summary: "✦ Nope. We use Plausible Analytics—made in the EU, privacy-focused, no cookies, no creepy tracking<br>✦ We only see aggregate data: how many people read a story, which questions get clicked most<br>✦ We can't see who you are, what device you're on, or where you're reading from—and we like it that way",
            imageUrl: "images/cat-sleep.jpg",
            questions: [
                {
                    label: "✦",
                    text: "But you ask for my name—is that stored on your server?",
                    answer: "Nope. Your name is stored in localStorage on your device—basically your phone remembers it, not us. That's why the app sometimes glitches and asks you again—if it were on our server, that wouldn't happen. We genuinely have no idea who you are, and that's by design.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "So what kind of data are you actually interested in?",
                    answer: "We care about what you like. Do you swipe left on all our stories? (Hopefully not.) Which questions do people dig into most? Do people finish all 5 stories or bail after 2? That helps us get better at picking stories and writing questions—but it doesn't tell us anything about you personally.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "All news apps store data. Why not you?",
                    answer: "We don't run ads. That's the whole game. Most news apps store data because advertisers pay for targeting—show this person shoe ads, that person finance stuff. We're not doing that. We'd rather charge you ₹15/week and keep your reading experience clean than make ₹5/week per user by selling your attention to brands.",
                    deepQuestions: []
                }
            ]
        },
        {
            id: 'faq-4',
            isFAQ: true,
            headline: "What are your political inclinations?",
            teaser: "Fair question. Are we a propaganda machine in disguise?",
            summary: "✦ We like capitalism but recognize it has real limitations—markets aren't magic, regulation isn't always bad<br>✦ We're skeptical of ideology in general—left or right—because reality is messy and most loud opinions are performative<br>✦ If we've done our job right, you shouldn't be able to guess our politics from what we write",
            imageUrl: "images/cat-sleep.jpg",
            questions: [
                {
                    label: "✦",
                    text: "But everyone has biases. What are yours?",
                    answer: "Sure. We probably lean slightly left on social issues and slightly pro-market on economic ones, but honestly we care more about \"what's actually happening\" than \"what should happen.\" Our bias is toward curiosity over certainty. We'd rather ask good questions than pretend we have all the answers.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "Will you ever take a strong stance on controversial issues?",
                    answer: "Only when it's intellectually honest. If there's a genuine debate with smart people on both sides, we'll lay it out. But if one side is clearly wrong or acting in bad faith, we're not going to \"both sides\" it for balance. We're not activists, but we're also not stenographers. We call it like we see it.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "How do you handle stories where there's no \"both sides\"?",
                    answer: "We don't pretend neutrality exists where it doesn't. Some stories genuinely have one defensible interpretation—climate change is real, vaccines work, election fraud claims in 2020 were baseless. In those cases, we explain the facts and move on. Treating every issue as a debate isn't fair—it's lazy.",
                    deepQuestions: []
                }
            ]
        },
        {
            id: 'faq-5',
            isFAQ: true,
            headline: "How do you make money?",
            teaser: "If you're reading this, you're probably one of our earliest users. We hope the answer at the back of this card changes soon.",
            summary: "✦ Right now? We don't. This is a passion project run by students who should be studying for exams<br>✦ Everyone gets a 30-day free trial to test if FYI actually makes you smarter and more engaged with the world<br>✦ When we do charge, it'll be ₹15/week—less than a cup of coffee, more than a dopamine scroll",
            imageUrl: "images/cat-sleep.jpg",
            questions: [
                {
                    label: "✦",
                    text: "That doesn't seem sustainable. Will you even survive?",
                    answer: "Right now we're just students at IIM Bangalore, so surviving assignments and exams is a bigger worry than surviving as a business. This is an experiment—if people love it, we'll figure out how to make it work. If not, at least we built something we're proud of. Call it freshman idealism.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "Will you ever allow ads?",
                    answer: "No. Call it naive, but we won't. Ads ruin the reading experience—they optimize for clicks and outrage, not understanding. Our whole model is \"you pay us, we serve you.\" No middlemen, no tracking, no algorithmic manipulation. If we can't make that work, we'd rather shut down than compromise.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "What happens after the free trial?",
                    answer: "You decide if it's worth ₹15/week. If you've used FYI for 30 days and feel smarter, more engaged, and more confident in conversations—keep going. If not, cancel with zero guilt. We're not locking you into annual plans or guilt-tripping you with notifications. Pay if it's valuable. That's the deal.",
                    deepQuestions: []
                }
            ]
        }
    ];
}

/**
 * Enter FAQ mode using the state machine
 * This is the main entry point for FAQ mode from anywhere in the app
 * @param {boolean} isNewUserOnboarding - True when this is part of new user welcome flow
 * @param {boolean} forceRefresh - True to bypass cache and fetch fresh FAQ data (used when accessed from menu)
 */
async function enterFAQMode(isNewUserOnboarding = false, forceRefresh = false) {
    console.log('[enterFAQMode] Transitioning to FAQ mode via state machine, isNewUserOnboarding:', isNewUserOnboarding, 'forceRefresh:', forceRefresh);
    await transitionToMode('faqs', { isNewUserOnboarding, forceRefresh });
}

/**
 * Exit FAQ mode and return to stories using state machine
 */
async function exitFAQMode() {
    console.log('[exitFAQMode] Transitioning to stories mode via state machine');
    await transitionToMode('stories');
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

/**
 * Enter archive mode from the no-stories page
 * Similar to regular archive mode but tracks source for proper Prev button behavior
 */
async function enterArchiveModeFromNoStories() {
    console.log('[enterArchiveModeFromNoStories] Starting archive mode from no-stories page');

    showLoading(true);

    // Fetch archive stories
    const archiveStories = await fetchArchiveStories();

    showLoading(false);

    if (archiveStories.length === 0) {
        showToast('⚠', 'No archive stories available');
        return;
    }

    // Enter archive mode
    state.archiveMode = true;
    state.contentMode = 'archives';
    state.enteredArchivesFromNoStories = true;
    state.originalStories = []; // No today's stories to restore
    state.archiveStories = archiveStories;
    state.stories = archiveStories;
    state.totalStories = archiveStories.length;
    state.currentIndex = 0;
    state.viewedStories = [];

    // Hide no-stories state
    elements.noStoriesState.classList.remove('visible');
    elements.noStoriesState.style.display = 'none';

    // Render archive cards
    updateProgress();
    renderProgressDots();
    renderCards();
    updatePrevButtonVisibility();

    showToast('✓', 'Browsing archives');
    trackEvent('Archive Mode Entered', { source: 'no_stories_page' });
}

/**
 * Exit archive mode when entered from no-stories page
 * Returns to no-stories page if today still has no stories, otherwise shows today's stories
 */
async function exitArchiveModeFromNoStories() {
    state.archiveMode = false;
    state.enteredArchivesFromNoStories = false;
    state.contentMode = 'stories';
    state.archiveStories = [];

    // Re-fetch today's stories to check if any have been added
    showLoading(true);
    await fetchStories();
    showLoading(false);

    // Check if we now have stories
    if (state.stories.length > 0) {
        // Stories have been added! Show them
        state.currentIndex = 0;
        elements.cardContainer.innerHTML = '';
        renderCards();
        updateProgress();
        renderProgressDots();
        updatePrevButtonVisibility();
        showToast('✓', 'New stories available!');
    } else {
        // Still no stories - show no-stories page again
        elements.cardContainer.innerHTML = '';
        elements.noStoriesState.style.display = 'flex';
        elements.noStoriesState.classList.add('visible');
        updatePrevButtonVisibility();
    }
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
                        <h4 class="recap-story-headline">${parseFormattedText(story.headline)}</h4>
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

    // Track archive story opened
    trackArchiveStoryOpened(story.headline, story.date);

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

async function saveUserName(name) {
    const formatted = formatUserName(name);
    if (formatted) {
        localStorage.setItem('fyi_user_name', formatted);
        state.userName = formatted;
        state.isFirstTimeUser = false;
        updateUserNameDisplay();
        hideWelcomeModal();
        trackAppOpened();

        // Check if we should show FAQs (new user flow) or stories (returning user flow)
        if (state.showFAQsAfterName) {
            // New user: show FAQs first with custom onboarding loading text
            await enterFAQMode(true);
        } else {
            // Returning user: go straight to stories
            await loadAppContent();
        }
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
// HTML Text Formatting with Sanitization
// ==========================================

/**
 * Sanitize HTML by removing dangerous tags while preserving safe formatting tags
 * Whitelist approach: only allow specific safe tags
 */
function sanitizeHTML(text) {
    if (!text) return text;

    // First, temporarily preserve allowed tags by replacing them with placeholders
    const preservedTags = [];
    const allowedTagPatterns = [
        /<color1>(.*?)<\/color1>/gi,
        /<color2>(.*?)<\/color2>/gi,
        /<color3>(.*?)<\/color3>/gi,
        /<mark>(.*?)<\/mark>/gi,
        /<br\s*\/?>/gi,
        /<strong>(.*?)<\/strong>/gi,
        /<em>(.*?)<\/em>/gi,
        /<b>(.*?)<\/b>/gi,
        /<i>(.*?)<\/i>/gi,
        /<lookup\s+def="[^"]*">(.*?)<\/lookup>/gi
    ];

    let sanitized = text;

    // Preserve allowed tags with placeholders
    allowedTagPatterns.forEach((pattern, index) => {
        sanitized = sanitized.replace(pattern, (match) => {
            preservedTags.push(match);
            return `__PRESERVED_TAG_${preservedTags.length - 1}__`;
        });
    });

    // Remove all remaining HTML tags (potentially dangerous ones like <script>, <iframe>, etc.)
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Restore preserved tags
    preservedTags.forEach((tag, index) => {
        sanitized = sanitized.replace(`__PRESERVED_TAG_${index}__`, tag);
    });

    return sanitized;
}

/**
 * Parse custom HTML-like tags for text formatting
 * Converts safe custom tags to styled spans
 * Includes XSS protection via sanitization
 */
function parseFormattedText(text) {
    if (!text) return text;

    // Sanitize first to remove any dangerous HTML
    let formatted = sanitizeHTML(text);

    // <color1>text</color1> -> orange accent color
    formatted = formatted.replace(/<color1>(.*?)<\/color1>/gi, '<span class="text-color1">$1</span>');

    // <color2>text</color2> -> teal/blue secondary color
    formatted = formatted.replace(/<color2>(.*?)<\/color2>/gi, '<span class="text-color2">$1</span>');

    // <color3>text</color3> -> plum/purple color (#6B5C8A)
    formatted = formatted.replace(/<color3>(.*?)<\/color3>/gi, '<span class="text-color3">$1</span>');

    // <mark>text</mark> -> golden yellow highlight background
    formatted = formatted.replace(/<mark>(.*?)<\/mark>/gi, '<span class="text-mark">$1</span>');

    // <strong>text</strong> or <b>text</b> -> bold text
    formatted = formatted.replace(/<strong>(.*?)<\/strong>/gi, '<strong>$1</strong>');
    formatted = formatted.replace(/<b>(.*?)<\/b>/gi, '<strong>$1</strong>');

    // <em>text</em> or <i>text</i> -> italic text
    formatted = formatted.replace(/<em>(.*?)<\/em>/gi, '<em>$1</em>');
    formatted = formatted.replace(/<i>(.*?)<\/i>/gi, '<em>$1</em>');

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

function showLoading(show, customText = null) {
    state.isLoading = show;
    elements.loadingState.classList.toggle('visible', show);

    // Update loading text if provided, otherwise reset to default
    if (elements.loadingText) {
        if (show && customText) {
            elements.loadingText.textContent = customText;
        } else if (!show) {
            // Reset to default when hiding
            elements.loadingText.textContent = "Loading today's stories...";
        }
    }
}

// ==========================================
// Card Rendering
// ==========================================

function renderCards() {
    elements.cardContainer.innerHTML = '';

    // Check if no stories
    if (state.stories.length === 0) {
        elements.noStoriesState.style.display = 'flex';
        elements.noStoriesState.classList.add('visible');
        if (elements.historyToggle) elements.historyToggle.classList.add('hidden');
        return;
    }

    elements.noStoriesState.style.display = 'none';
    elements.noStoriesState.classList.remove('visible');
    if (elements.historyToggle) elements.historyToggle.classList.remove('hidden');

    // Check if completed
    if (state.currentIndex >= state.totalStories) {
        showCompletion();
        return;
    }

    // RENDER PREVIOUS CARD (off-screen left) for progressive animation
    if (state.currentIndex > 0) {
        const prevStory = state.stories[state.currentIndex - 1];
        const prevCard = createCardElement(prevStory, -1);
        prevCard.dataset.cardType = 'prev';
        elements.cardContainer.appendChild(prevCard);
    }

    // RENDER CURRENT CARD
    const currentStory = state.stories[state.currentIndex];
    const currentCard = createCardElement(currentStory, 0);
    currentCard.dataset.cardType = 'current';
    elements.cardContainer.appendChild(currentCard);
    setupCardInteractions(currentCard, currentStory);

    // RENDER NEXT CARD (off-screen right) for progressive animation
    if (state.currentIndex < state.totalStories - 1) {
        const nextStory = state.stories[state.currentIndex + 1];
        const nextCard = createCardElement(nextStory, 1);
        nextCard.dataset.cardType = 'next';
        elements.cardContainer.appendChild(nextCard);
    }

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

    // Determine visibility of prev/next based on position
    const isFirstStory = state.currentIndex === 0;
    const isLastStory = state.currentIndex >= state.totalStories - 1;

    card.innerHTML = `
        <div class="card-flipper">
            <!-- FRONT FACE (Headline) -->
            <div class="card-face card-front">
                <div class="card-swipe-overlay left"></div>
                <div class="card-swipe-overlay right"></div>
                ${bannerHTML}
                <div class="card-body">
                    <h2 class="card-headline">${parseFormattedText(story.headline)}</h2>
                    <p class="card-teaser">${parseFormattedText(teaserText)}</p>
                </div>
                <!-- Bottom Navigation Hints (visual only, not clickable) -->
                <div class="card-nav-hints">
                    <span class="nav-hint nav-hint-prev ${isFirstStory ? 'hidden' : ''}">← Prev</span>
                    <span class="nav-hint nav-hint-center">Read ahead ↑</span>
                    <span class="nav-hint nav-hint-next ${isLastStory ? 'hidden' : ''}">Next →</span>
                </div>
            </div>

            <!-- BACK FACE (Summary) -->
            <div class="card-face card-back">
                <div class="card-swipe-overlay left"></div>
                <div class="card-swipe-overlay right"></div>
                <div class="card-back-content">
                    <h3 class="card-back-header">Summary</h3>
                    <div class="card-summary-text">${summaryHTML}</div>
                </div>
                <!-- Summary face: subtle hint to swipe up for questions -->
                <div class="card-nav-hints card-nav-hints-summary">
                    <span class="nav-hint nav-hint-center-subtle">↑</span>
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
        trackCardFlip(story.headline, 'to_front');
    } else {
        // Flip to back (summary)
        card.classList.add('flipped');
        card.dataset.flipped = 'true';
        trackCardFlip(story.headline, 'to_summary');

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
    // Touch events for swiping - NEW NAVIGATION SYSTEM
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

    // Setup click handlers for nav hints
    setupNavHintClickHandlers(card, story);
}

// Click handlers for nav hints
function setupNavHintClickHandlers(card, story) {
    const prevHint = card.querySelector('.nav-hint-prev');
    const centerHint = card.querySelector('.nav-hint-center');
    const nextHint = card.querySelector('.nav-hint-next');

    if (prevHint && !prevHint.classList.contains('hidden')) {
        prevHint.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHaptic('light');
            handleSwipeLeft(card, story);
        });
    }

    if (centerHint) {
        centerHint.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHaptic('light');
            handleSwipeUp(card, story);
        });
    }

    if (nextHint && !nextHint.classList.contains('hidden')) {
        nextHint.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHaptic('light');
            handleSwipeRight(card, story);
        });
    }
}

// ==========================================
// NEW SWIPE MECHANICS (Part 1 Implementation)
// ==========================================
// Left swipe = Previous story (navigate to prev story headline)
// Right swipe = Next story (navigate to next story headline)
// Swipe up = Flip card / Reveal next layer (headline->summary->questions)
// Swipe down = Return to previous layer (questions->summary->headline)
// ==========================================

function handleDragStart(e, card, story) {
    state.isDragging = true;
    state.isLongPress = false;
    state.startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    state.startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    state.currentX = 0;
    state.currentY = 0;
    state.swipeStartTime = Date.now();
    card.classList.add('dragging');
    hideSwipeHint();
}

// Legacy function kept for compatibility
function clearLongPressTimer() {
    // No-op: long press timer removed
}

function handleDragMove(e, card) {
    if (!state.isDragging) return;

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - state.startX;
    const deltaY = clientY - state.startY;

    state.currentX = deltaX;
    state.currentY = deltaY;

    // Determine dominant axis
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontal) {
        // Horizontal swipe - apply card transform
        if (e.type === 'touchmove' && Math.abs(deltaX) > 10) {
            e.preventDefault();
        }

        const rotation = deltaX * 0.03; // Reduced rotation for subtler effect
        const scale = Math.max(0.97, 1 - Math.abs(deltaX) * 0.0001);

        card.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg) scale(${scale})`;

        // Show visual indicators for swipe direction
        card.classList.toggle('swiping-left', deltaX < -20);
        card.classList.toggle('swiping-right', deltaX > 20);

        // PROGRESSIVE REVEAL: Animate adjacent card proportionally during drag
        const screenWidth = window.innerWidth;
        const dragProgress = Math.min(Math.abs(deltaX) / (screenWidth * 0.35), 1);

        if (deltaX < 0) {
            // Swiping LEFT (toward NEXT story)
            const nextCard = document.querySelector('.story-card[data-card-type="next"]');
            if (nextCard) {
                const nextOffset = 110 - (dragProgress * 110);
                const nextOpacity = 0.7 + (dragProgress * 0.3);
                nextCard.style.transform = `translateX(${nextOffset}%)`;
                nextCard.style.opacity = nextOpacity;
                nextCard.style.transition = 'none';
            }
        } else {
            // Swiping RIGHT (toward PREV story)
            const prevCard = document.querySelector('.story-card[data-card-type="prev"]');
            if (prevCard) {
                const prevOffset = -110 + (dragProgress * 110);
                const prevOpacity = 0.7 + (dragProgress * 0.3);
                prevCard.style.transform = `translateX(${prevOffset}%)`;
                prevCard.style.opacity = prevOpacity;
                prevCard.style.transition = 'none';
            }
        }
    } else {
        // Vertical swipe - apply vertical transform
        if (e.type === 'touchmove' && Math.abs(deltaY) > 10) {
            e.preventDefault();
        }

        // Limit vertical drag distance
        const constrainedY = Math.max(-100, Math.min(100, deltaY));
        const scale = Math.max(0.97, 1 - Math.abs(constrainedY) * 0.0003);

        card.style.transform = `translateY(${constrainedY * 0.5}px) scale(${scale})`;

        card.classList.toggle('swiping-up', deltaY < -20);
        card.classList.toggle('swiping-down', deltaY > 20);
    }
}

function handleDragEnd(e, card, story) {
    if (!state.isDragging) return;

    state.isDragging = false;
    card.classList.remove('dragging', 'swiping-left', 'swiping-right', 'swiping-up', 'swiping-down');

    const deltaX = state.currentX;
    const deltaY = state.currentY;
    const swipeDuration = Date.now() - state.swipeStartTime;

    // NEW: Detect TAP (minimal movement, quick touch) - Instagram style
    const isTap = Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15 && swipeDuration < 300;

    if (isTap) {
        handleTapZone(e, card, story);
        snapCardBack(card);
        state.currentX = 0;
        state.currentY = 0;
        return;
    }

    // Calculate velocity (px/ms)
    const velocityX = Math.abs(deltaX) / swipeDuration;
    const velocityY = Math.abs(deltaY) / swipeDuration;

    // Determine dominant axis
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    const isVertical = Math.abs(deltaY) > Math.abs(deltaX);

    // Check if swipe meets threshold (distance OR velocity)
    const meetsHorizontalThreshold = Math.abs(deltaX) > state.dragThreshold || velocityX > state.swipeVelocityThreshold;
    const meetsVerticalThreshold = Math.abs(deltaY) > state.dragThreshold || velocityY > state.swipeVelocityThreshold;

    if (isHorizontal && meetsHorizontalThreshold) {
        // HORIZONTAL SWIPE: left/right navigation
        triggerHaptic('light');

        if (deltaX < 0) {
            // LEFT SWIPE = Next story (swipe toward next)
            handleSwipeRight(card, story);
        } else {
            // RIGHT SWIPE = Previous story (swipe toward prev)
            handleSwipeLeft(card, story);
        }
    } else if (isVertical && meetsVerticalThreshold) {
        // VERTICAL SWIPE: layer navigation
        triggerHaptic('light');

        if (deltaY < 0) {
            // SWIPE UP = Reveal next layer
            handleSwipeUp(card, story);
        } else {
            // SWIPE DOWN = Return to previous layer
            handleSwipeDown(card, story);
        }
    } else {
        // Small drag or tap: snap back
        snapCardBack(card);
    }

    state.currentX = 0;
    state.currentY = 0;
}

/**
 * Handle TAP based on screen position - Instagram style
 * Left 1/3 = Previous story
 * Center 1/3 = Flip card / Reveal
 * Right 1/3 = Next story
 */
function handleTapZone(e, card, story) {
    const tapX = e.type.includes('touch')
        ? (e.changedTouches ? e.changedTouches[0].clientX : state.startX)
        : e.clientX;

    const screenWidth = window.innerWidth;
    const leftThird = screenWidth / 3;
    const rightThird = screenWidth * 2 / 3;

    if (tapX < leftThird) {
        // LEFT THIRD = Previous story
        triggerHaptic('light');
        handleSwipeLeft(card, story);
    } else if (tapX > rightThird) {
        // RIGHT THIRD = Next story
        triggerHaptic('light');
        handleSwipeRight(card, story);
    } else {
        // CENTER THIRD = Flip card / Reveal (same as swipe up)
        triggerHaptic('light');
        handleSwipeUp(card, story);
    }
}

/**
 * Handle LEFT swipe = Navigate to PREVIOUS story
 */
function handleSwipeLeft(card, story) {
    if (state.currentIndex <= 0) {
        // Already at first story - bounce back
        showToast('', "You're at the first story");
        snapCardBack(card);
        return;
    }

    // Track the navigation
    trackEvent('Story Swiped', { direction: 'prev', from: state.currentIndex + 1, to: state.currentIndex });

    // Navigate to previous story (always to headline, not summary)
    state.isCardFlipped = false;
    state.cardLayer = 'headline';
    prevCard();
}

/**
 * Handle RIGHT swipe = Navigate to NEXT story
 */
function handleSwipeRight(card, story) {
    if (state.currentIndex >= state.totalStories - 1) {
        // At last story - show completion or bounce
        if (!elements.completionScreen.classList.contains('visible')) {
            showCompletion();
        } else {
            showToast('', "You've seen all stories");
            snapCardBack(card);
        }
        return;
    }

    // Track the navigation
    trackEvent('Story Swiped', { direction: 'next', from: state.currentIndex + 1, to: state.currentIndex + 2 });

    // Navigate to next story (always to headline)
    state.isCardFlipped = false;
    state.cardLayer = 'headline';
    nextCard();
}

/**
 * Handle SWIPE UP = Reveal next layer
 * From headline -> flip to summary
 * From summary -> open questions modal
 */
function handleSwipeUp(card, story) {
    const isFlipped = card.dataset.flipped === 'true';

    if (!isFlipped) {
        // Currently on HEADLINE - flip to SUMMARY
        flipCard(card, story);
        state.isCardFlipped = true;
        state.cardLayer = 'summary';
    } else {
        // Currently on SUMMARY - reveal QUESTIONS modal
        state.cardLayer = 'questions';
        openQuestionsWithPushTransition(story);
    }
}

/**
 * Handle SWIPE DOWN = Return to previous layer
 * From summary -> flip back to headline
 * From headline -> do nothing (already at top)
 */
function handleSwipeDown(card, story) {
    const isFlipped = card.dataset.flipped === 'true';

    if (isFlipped) {
        // Currently on SUMMARY - flip back to HEADLINE
        flipCard(card, story);
        state.isCardFlipped = false;
        state.cardLayer = 'headline';
    } else {
        // Already on HEADLINE - bounce back, nothing to do
        snapCardBack(card);
    }
}

/**
 * Snap card back to original position with spring animation
 */
function snapCardBack(card) {
    card.style.transition = 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)';
    card.style.transform = 'translateX(0) translateY(0) rotate(0) scale(1)';

    // Reset adjacent cards to their off-screen positions
    const prevCard = document.querySelector('.story-card[data-card-type="prev"]');
    const nextCard = document.querySelector('.story-card[data-card-type="next"]');

    if (prevCard) {
        prevCard.style.transition = 'transform 300ms ease, opacity 300ms ease';
        prevCard.style.transform = 'translateX(-110%)';
        prevCard.style.opacity = '0.7';
    }

    if (nextCard) {
        nextCard.style.transition = 'transform 300ms ease, opacity 300ms ease';
        nextCard.style.transform = 'translateX(110%)';
        nextCard.style.opacity = '0.7';
    }

    setTimeout(() => {
        card.style.transition = '';
        if (prevCard) prevCard.style.transition = '';
        if (nextCard) nextCard.style.transition = '';
    }, 300);
}

/**
 * Open Questions card with push-from-bottom transition
 * This is called when user swipes up from Summary card
 * Q&A card pushes up to replace Summary (like PowerPoint slide)
 */
function openQuestionsWithPushTransition(story) {
    // Push current state to modal stack
    state.modalStack.push({ type: 'summary', storyId: story.id });

    // Update state
    state.currentStory = story;
    state.cardLayer = 'questions';

    // Set initial position for Q&A card (below viewport)
    elements.qaModal.style.transform = 'translateX(-50%) translateY(100%)';

    // Open the Q&A card with push transition
    elements.modalBackdrop.classList.add('push-transition');
    openModal(story);

    // Remove transition class after animation
    setTimeout(() => {
        elements.modalBackdrop.classList.remove('push-transition');
    }, 400);
}

function animateCardExit(card, direction, callback) {
    const swipeDuration = Date.now() - state.swipeStartTime;
    const velocity = Math.abs(state.currentX) / swipeDuration;

    // Faster swipe = faster animation (150-350ms range)
    const exitDuration = Math.max(150, Math.min(350, 250 / (velocity + 0.3)));

    const exitX = direction === 'left' ? '-110%' : '110%';

    card.classList.add('exiting');
    card.style.transition = `transform ${exitDuration}ms cubic-bezier(0.32, 0.72, 0, 1), opacity ${exitDuration}ms ease-out`;
    card.style.transform = `translateX(${exitX})`;
    card.style.opacity = '0';

    // Animate incoming card to center position
    const incomingCard = direction === 'left'
        ? document.querySelector('.story-card[data-card-type="next"]')
        : document.querySelector('.story-card[data-card-type="prev"]');

    if (incomingCard) {
        incomingCard.style.transition = `transform ${exitDuration}ms cubic-bezier(0.32, 0.72, 0, 1), opacity ${exitDuration}ms ease-out`;
        incomingCard.style.transform = 'translateX(0)';
        incomingCard.style.opacity = '1';
    }

    setTimeout(() => {
        card.style.transition = '';
        if (callback) callback();
    }, exitDuration);
}

// Legacy function - kept for compatibility but now simplified
function animateCardExitWithModal(card, direction, callback, story) {
    // For new swipe mechanics, modal is opened via swipe up
    // This function now just opens the modal directly
    openModal(story);
    if (callback) callback();
}

// ==========================================
// Card Navigation
// ==========================================

function nextCard() {
    // Reset card layer state for new navigation
    state.isCardFlipped = false;
    state.cardLayer = 'headline';

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
    // Reset card layer state for new navigation
    state.isCardFlipped = false;
    state.cardLayer = 'headline';

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

    // Update completion title and subtitle based on mode
    const subtitle = elements.completionScreen.querySelector('.completion-subtitle');

    if (state.userName && elements.completionTitle) {
        if (state.faqMode) {
            // FAQ completion - welcoming and action-oriented
            elements.completionTitle.textContent = `Ready to jump in, ${state.userName}?`;
            if (subtitle) {
                subtitle.textContent = "We will make it worth your time.";
            }
        } else if (state.archiveMode) {
            // Archive completion
            elements.completionTitle.textContent = `All caught up, ${state.userName}`;
            if (subtitle) {
                subtitle.textContent = "You've reviewed the archives.";
            }
        } else {
            // Regular stories completion
            elements.completionTitle.textContent = `Take a break, ${state.userName}`;
            if (subtitle) {
                subtitle.textContent = "That's your daily dose of critical thinking.";
            }
        }
    }

    // Track completion - count curious swipes from the state
    const curiousCount = state.viewedStories.length;
    trackCompletionViewed(state.totalStories, curiousCount);

    // Update button labels based on mode
    updateCompletionButtons();
}

function updateCompletionButtons() {
    const reviewBtn = elements.reviewStoriesBtn;
    const questionsBtn = elements.yourQuestionsBtn;
    const archiveBtn = elements.recapWeekBtn;

    if (state.faqMode) {
        // FAQ completion buttons: "Review FAQs", "Go to stories", "Go to archives"
        if (reviewBtn) {
            reviewBtn.querySelector('span').textContent = 'Review FAQs';
        }
        if (questionsBtn) {
            questionsBtn.querySelector('span').textContent = 'Go to stories';
            // Change functionality for FAQ mode
            questionsBtn.dataset.faqAction = 'go-to-stories';
        }
        if (archiveBtn) {
            archiveBtn.querySelector('span').textContent = 'Go to archives';
        }
    } else if (state.archiveMode) {
        // Archives completion buttons: "Review stories", "Your questions", "Back to today"
        if (reviewBtn) {
            reviewBtn.querySelector('span').textContent = 'Review stories';
        }
        if (questionsBtn) {
            questionsBtn.querySelector('span').textContent = 'Your questions';
            questionsBtn.dataset.faqAction = '';
        }
        if (archiveBtn) {
            archiveBtn.querySelector('span').textContent = 'Back to today';
        }
    } else {
        // Stories completion buttons: "Review stories", "Your questions", "Go to archives"
        if (reviewBtn) {
            reviewBtn.querySelector('span').textContent = 'Review stories';
        }
        if (questionsBtn) {
            questionsBtn.querySelector('span').textContent = 'Your questions';
            questionsBtn.dataset.faqAction = '';
        }
        if (archiveBtn) {
            archiveBtn.querySelector('span').textContent = 'Go to archives';
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

    elements.modalEmoji.textContent = story.emoji || '✦';
    elements.modalHeadline.innerHTML = parseFormattedText(story.headline);

    elements.questionsContainer.innerHTML = '';

    // For FAQs, only show first 3 questions (Question 4 is "Skip this FAQ")
    const questionsToShow = story.isFAQ ? story.questions.slice(0, 3) : story.questions;

    questionsToShow.forEach((q) => {
        const button = document.createElement('button');
        button.className = 'question-button';
        button.innerHTML = `
            <span class="question-label">✦</span>
            <span class="question-text">${parseFormattedText(q.text)}</span>
        `;
        button.addEventListener('click', () => {
            triggerHaptic('light');
            showAnswer(q);
        });
        elements.questionsContainer.appendChild(button);
    });

    // Add skip button - text differs for FAQs vs stories
    const skipButton = document.createElement('button');
    skipButton.className = 'question-button skip';
    const skipText = story.isFAQ ? 'Skip this FAQ' : 'Skip this story';
    skipButton.innerHTML = `
        <span class="question-label">✦</span>
        <span class="question-text">${skipText}</span>
    `;
    skipButton.addEventListener('click', () => {
        triggerHaptic('light');
        trackQuestionsSkipped(story.headline);
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
            // Q&A card uses centered positioning, so preserve translateX(-50%)
            modal.style.transform = `translateX(-50%) translateY(${deltaY}px)`;
        }
    };

    const handleTouchEnd = () => {
        const deltaY = currentY - startY;

        if (deltaY > 100) {
            // Swipe down threshold met - return to Summary
            triggerHaptic('light');
            closeModal();
        } else {
            // Reset position
            modal.style.transform = 'translateX(-50%) translateY(0)';
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

    // Prepare answer view content before showing
    elements.answerLabel.textContent = '✦';
    elements.answerQuestion.innerHTML = parseFormattedText(question.text);
    elements.answerText.innerHTML = parseFormattedText(question.answer);

    // Show/hide Dig Deeper button based on availability
    const hasDeepQuestions = question.deepQuestions && question.deepQuestions.length > 0;
    if (elements.digDeeperBtn) {
        elements.digDeeperBtn.style.display = hasDeepQuestions ? 'flex' : 'none';
    }

    resetStars();

    // SLIDE TRANSITION: Q&A slides left, Answer slides in from right
    elements.qaView.classList.add('slide-out-left');
    elements.answerView.classList.remove('hidden');

    setTimeout(() => {
        elements.qaView.classList.add('hidden');
        elements.qaView.classList.remove('slide-out-left');
    }, 350);
}

function showQAView() {
    console.log('[showQAView] Starting transition to Q&A view');

    // Find which view is currently visible
    const currentView = [elements.answerView, elements.digDeeperView, elements.deepAnswerView]
        .find(v => v && !v.classList.contains('hidden'));

    if (currentView) {
        // SLIDE TRANSITION: Current view slides out right, Q&A slides in from left
        elements.qaView.style.transform = 'translateX(-100%)';
        elements.qaView.classList.remove('hidden');

        // Force reflow
        void elements.qaView.offsetHeight;

        elements.qaView.style.transform = '';
        currentView.classList.add('slide-out-left');

        setTimeout(() => {
            currentView.classList.add('hidden');
            currentView.classList.remove('slide-out-left');
            // Reset inline styles
            currentView.style.cssText = '';
        }, 350);
    } else {
        // Just show Q&A view directly
        elements.qaView.classList.remove('hidden');
    }

    // Verify modal backdrop is still correctly visible
    if (!elements.modalBackdrop.classList.contains('visible')) {
        elements.modalBackdrop.classList.add('visible');
    }

    console.log('[showQAView] Q&A view should now be visible');
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
    // Animate Q&A card sliding down/out
    elements.modalBackdrop.classList.remove('visible', 'push-transition');
    document.body.classList.remove('no-scroll');
    // Reset transform with centered positioning
    elements.qaModal.style.transform = 'translateX(-50%) translateY(100%)';

    // CRITICAL: Update layer state - return to SUMMARY (not Headline!)
    // Q&A swipe down always goes to Summary, which is one layer back
    state.cardLayer = 'summary';
    if (state.modalStack.length > 0) {
        state.modalStack.pop(); // Remove questions from stack
    }

    // Reset modal state after animation completes
    setTimeout(() => {
        elements.qaView.classList.remove('hidden', 'fade-out', 'fade-in', 'slide-out-left');
        elements.answerView.classList.add('hidden');
        elements.answerView.classList.remove('fade-out', 'fade-in', 'slide-out-left');
        elements.digDeeperView.classList.add('hidden');
        elements.digDeeperView.classList.remove('fade-out', 'fade-in', 'slide-out-left');
        elements.deepAnswerView.classList.add('hidden');
        elements.deepAnswerView.classList.remove('fade-out', 'fade-in', 'slide-out-left');

        // Note: Do NOT clear state.currentStory - we're still on the same story
        state.currentQuestion = null;
        state.currentHistoryEntry = null;

        // Note: Do NOT re-render cards - the story card (showing Summary) is still there
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

    elements.summaryModalHeadline.innerHTML = parseFormattedText(story.headline);

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
            <span class="deep-question-text">${parseFormattedText(dq.text)}</span>
        `;
        button.addEventListener('click', () => {
            triggerHaptic('light');
            trackDigDeeper(state.currentStory.headline, dq.text);
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
    elements.deepAnswerQuestion.innerHTML = parseFormattedText(deepQuestion.text);
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
        v.classList.remove('fade-out', 'fade-in', 'slide-out-left');
        v.style.cssText = '';
    });

    // Force reflow
    void document.body.offsetHeight;
}

/**
 * Verify clean navigation state - call after every major transition
 * Ensures no invisible overlays or broken states
 */
function verifyCleanState() {
    // Check that Q&A modal is either fully visible or fully hidden
    const modalVisible = elements.modalBackdrop.classList.contains('visible');

    if (!modalVisible) {
        // Modal should be completely hidden
        const modalRect = elements.qaModal.getBoundingClientRect();
        if (modalRect.top < window.innerHeight && modalRect.bottom > 0) {
            console.warn('[verifyCleanState] Q&A card visible when modal backdrop hidden - forcing cleanup');
            elements.qaModal.style.transform = 'translateX(-50%) translateY(100%)';
        }
    }

    // Verify no stray backdrop overlays
    const backdrops = document.querySelectorAll('.modal-backdrop, .summary-modal-backdrop, .info-modal-backdrop');
    backdrops.forEach(backdrop => {
        if (!backdrop.classList.contains('visible')) {
            // Ensure truly hidden
            backdrop.style.pointerEvents = 'none';
        }
    });

    // Log current state for debugging
    console.log('[verifyCleanState] cardLayer:', state.cardLayer,
                'modalStack:', state.modalStack.length,
                'modalVisible:', modalVisible);
}

/**
 * Full state reset - returns to Story 1 headline from any state
 * Used by logo click and other "go home" actions
 */
function fullStateReset() {
    console.log('[fullStateReset] Performing complete navigation reset');

    // Close all modals
    if (elements.modalBackdrop.classList.contains('visible')) {
        elements.modalBackdrop.classList.remove('visible', 'push-transition');
        elements.qaModal.style.transform = 'translateX(-50%) translateY(100%)';
    }
    document.body.classList.remove('no-scroll');

    // Reset all modal views
    resetAllModalViews();

    // Clear card layer state
    state.cardLayer = 'headline';
    state.modalStack = [];
    state.isCardFlipped = false;

    // Reset story to first
    state.currentIndex = 0;
    state.currentStory = null;
    state.currentQuestion = null;

    // Re-render cards
    renderCards();
    updateProgress();
    renderProgressDots();

    // Verify clean state
    setTimeout(verifyCleanState, 450);
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
    elements.modalHeadline.innerHTML = parseFormattedText(story.headline);

    elements.qaView.classList.add('hidden');
    elements.answerView.classList.remove('hidden');

    elements.answerLabel.textContent = '✦';
    elements.answerQuestion.innerHTML = parseFormattedText(entry.question);
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

// Pull-to-refresh requires deliberate action:
// - Must pull down 150px+ (much more than swipe navigation 50-80px)
// - Must hold for 300ms after reaching threshold
// This prevents accidental refresh during normal swipe-down navigation

const PULL_REFRESH_THRESHOLD = 150;  // px - must pull this far
const PULL_REFRESH_HOLD_TIME = 300;  // ms - must hold after threshold

function setupPullToRefresh() {
    let pullStartY = 0;
    let isPulling = false;
    let pullHoldTimer = null;
    let refreshReady = false;

    elements.sectionToday.addEventListener('touchstart', (e) => {
        // Only enable pull-to-refresh when at top of content
        if (elements.sectionToday.scrollTop === 0) {
            pullStartY = e.touches[0].clientY;
            isPulling = true;
            refreshReady = false;
            clearTimeout(pullHoldTimer);
            pullHoldTimer = null;
        }
    }, { passive: true });

    elements.sectionToday.addEventListener('touchmove', (e) => {
        if (!isPulling) return;

        const pullDistance = e.touches[0].clientY - pullStartY;

        // Only show indicator when past the high threshold
        if (pullDistance > PULL_REFRESH_THRESHOLD) {
            elements.pullIndicator.classList.add('visible');

            if (refreshReady) {
                elements.pullIndicator.querySelector('.pull-text').textContent = 'Release to refresh';
            } else {
                elements.pullIndicator.querySelector('.pull-text').textContent = 'Keep pulling...';

                // Start hold timer if not already started
                if (!pullHoldTimer) {
                    pullHoldTimer = setTimeout(() => {
                        refreshReady = true;
                        // Haptic feedback when refresh is ready
                        triggerHaptic('medium');
                        elements.pullIndicator.querySelector('.pull-text').textContent = 'Release to refresh';
                    }, PULL_REFRESH_HOLD_TIME);
                }
            }
        } else {
            // Below threshold - hide indicator and reset timer
            elements.pullIndicator.classList.remove('visible');
            clearTimeout(pullHoldTimer);
            pullHoldTimer = null;
            refreshReady = false;
        }
    }, { passive: true });

    elements.sectionToday.addEventListener('touchend', (e) => {
        if (!isPulling) return;

        const pullDistance = e.changedTouches[0].clientY - pullStartY;

        // Only trigger refresh if threshold was met AND hold time completed
        if (pullDistance > PULL_REFRESH_THRESHOLD && refreshReady) {
            triggerHaptic('heavy');
            elements.pullIndicator.classList.add('refreshing');
            elements.pullIndicator.querySelector('.pull-text').textContent = 'Refreshing...';
            refreshStories();
        } else {
            // Not a refresh - just hide indicator
            elements.pullIndicator.classList.remove('visible');
        }

        // Reset state
        isPulling = false;
        refreshReady = false;
        clearTimeout(pullHoldTimer);
        pullHoldTimer = null;
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

    // FAQs menu button - force refresh to get latest FAQ content
    if (elements.faqsBtn) {
        elements.faqsBtn.addEventListener('click', async () => {
            triggerHaptic('light');
            elements.dropdownMenu.classList.remove('visible');
            trackEvent('FAQs Menu Clicked');
            // Force refresh when explicitly accessing FAQs from menu
            await enterFAQMode(false, true);
        });
    }

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

    // Logo click - ALWAYS returns to today's Story 1, from ANY state
    elements.headerLogo.addEventListener('click', async () => {
        console.log('[LOGO CLICKED] Forcing transition to Story 1');
        triggerHaptic('light');

        // Always transition to stories mode with fresh state
        await transitionToMode('stories');
        showToast('✓', "Back to today's stories");
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

    // Your Questions button (on completion screen) - behavior changes in FAQ mode
    if (elements.yourQuestionsBtn) {
        elements.yourQuestionsBtn.addEventListener('click', async () => {
            triggerHaptic('light');

            // In FAQ mode, this button becomes "Go to stories"
            if (elements.yourQuestionsBtn.dataset.faqAction === 'go-to-stories') {
                console.log('[Go to stories] Transitioning from FAQ completion to Story 1');
                // Use state machine to properly transition to stories
                await transitionToMode('stories');
                return;
            }

            // Default behavior: show question history
            state.cameFromCompletion = true; // Track that we came from completion
            switchSection('history');
        });
    }

    // Prev Story button - handles card navigation with mode-aware behavior
    if (elements.prevStoryBtn) {
        elements.prevStoryBtn.addEventListener('click', async () => {
            triggerHaptic('light');

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

            // If in FAQ mode on first card, exit to stories
            if (state.faqMode && state.currentIndex === 0) {
                console.log('[Prev] Exiting FAQ mode on first card');
                await transitionToMode('stories');
                return;
            }

            // If in archive mode on first card from no-stories page
            if (state.archiveMode && state.currentIndex === 0 && state.enteredArchivesFromNoStories) {
                console.log('[Prev] Returning to no-stories from archives');
                await transitionToMode('stories'); // Will show no-stories if still empty
                return;
            }

            // If in archive mode on first card, return to stories completion
            if (state.archiveMode && state.currentIndex === 0) {
                console.log('[Prev] Exiting archive mode on first card');
                // Go back to stories and show completion
                cleanupCurrentState();
                state.archiveMode = false;
                state.appMode = 'stories';
                state.stories = state.originalStories || [];
                state.totalStories = state.stories.length;
                state.currentIndex = state.totalStories; // At end = completion
                state.originalStories = [];

                // Show completion
                elements.completionScreen.classList.add('visible');
                elements.progressFill.style.width = '100%';
                updateCompletionButtons();
                updateDateDisplay();
                updatePrevButtonVisibility();
                return;
            }

            // Default: go to previous card
            prevCard();
        });
    }

    // Recap This Week / Back to Today / Go to Archives button - behavior depends on mode
    if (elements.recapWeekBtn) {
        elements.recapWeekBtn.addEventListener('click', async () => {
            triggerHaptic('light');

            if (state.faqMode) {
                // In FAQ mode: "Go to archives" - use state machine
                console.log('[Go to archives] Transitioning from FAQ to archives');
                trackRecapViewed('faq_completion');
                await transitionToMode('archives', { source: 'faq_completion' });
            } else if (state.archiveMode) {
                // In archive mode: go back to today's stories
                console.log('[Back to today] Transitioning from archives to stories');
                await transitionToMode('stories');
            } else {
                // In today mode: go to archives
                console.log('[Go to archives] Transitioning from stories to archives');
                trackRecapViewed('completion_button');
                await transitionToMode('archives', {
                    source: 'completion_button',
                    originalStories: [...state.stories]
                });
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

    // Welcome Choice - New User button
    if (elements.welcomeNewUserBtn) {
        elements.welcomeNewUserBtn.addEventListener('click', () => {
            triggerHaptic('medium');
            state.showFAQsAfterName = true; // Flag to show FAQs after name entry
            hideWelcomeChoice();
            showWelcomeModal();
        });
    }

    // Welcome Choice - Returning User button
    if (elements.welcomeReturningBtn) {
        elements.welcomeReturningBtn.addEventListener('click', () => {
            triggerHaptic('medium');
            state.showFAQsAfterName = false; // Skip FAQs, go to stories
            hideWelcomeChoice();
            showWelcomeModal();
        });
    }

    // Welcome Back button - returns to welcome choice
    if (elements.welcomeBackBtn) {
        elements.welcomeBackBtn.addEventListener('click', () => {
            triggerHaptic('light');
            hideWelcomeModal();
            showWelcomeChoice();
        });
    }

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

    // No Stories - Go to Archives button
    if (elements.emptyArchivesBtn) {
        elements.emptyArchivesBtn.addEventListener('click', async () => {
            triggerHaptic('light');
            trackRecapViewed('no_stories_page');
            await enterArchiveModeFromNoStories();
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

    // Keyboard shortcuts - NEW NAVIGATION SYSTEM
    document.addEventListener('keydown', (e) => {
        // Escape closes modals (returns to previous layer)
        if (e.key === 'Escape') {
            handleKeyboardBack();
            return;
        }

        // Check modal states
        const qaModalOpen = elements.modalBackdrop && elements.modalBackdrop.classList.contains('visible');
        const summaryModalOpen = elements.summaryModalBackdrop && elements.summaryModalBackdrop.classList.contains('visible');

        // When in Q&A modal - only down arrow works (to go back)
        if (qaModalOpen) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                closeModal();
            }
            return;
        }

        // When in summary modal - only down arrow works (to go back)
        if (summaryModalOpen) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                closeSummaryModal();
            }
            return;
        }

        // Card navigation (when no modal is open)
        if (state.currentSection === 'today') {
            const card = document.querySelector('.story-card[data-position="0"]');
            const story = state.stories[state.currentIndex];

            if (e.key === 'ArrowLeft') {
                // LEFT = Previous story
                e.preventDefault();
                if (card && story) handleSwipeLeft(card, story);
            }
            if (e.key === 'ArrowRight') {
                // RIGHT = Next story
                e.preventDefault();
                if (card && story) handleSwipeRight(card, story);
            }
            if (e.key === 'ArrowUp') {
                // UP = Flip to summary / Reveal questions
                e.preventDefault();
                if (card && story) handleSwipeUp(card, story);
            }
            if (e.key === 'ArrowDown') {
                // DOWN = Flip back to headline
                e.preventDefault();
                if (card && story) handleSwipeDown(card, story);
            }
        }
    });
}

/**
 * Handle keyboard back navigation (Escape key)
 * Pops from modal stack and returns to previous layer
 */
function handleKeyboardBack() {
    // Check what's currently visible and close it
    if (elements.summaryModalBackdrop && elements.summaryModalBackdrop.classList.contains('visible')) {
        closeSummaryModal();
    } else if (elements.modalBackdrop && elements.modalBackdrop.classList.contains('visible')) {
        closeModal();
    }
    // If nothing is open, Escape does nothing
}

// ==========================================
// Start App
// ==========================================

document.addEventListener('DOMContentLoaded', init);
