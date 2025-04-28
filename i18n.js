/**
 * i18n.js - Internationalization utilities for Drone Sentinel
 * This file handles loading, managing and applying translations
 */

// Import the translations
const i18n = {
    /**
     * Current active language code
     */
    currentLanguage: 'en',
    
    /**
     * Initialize the i18n system
     */
    init() {
        // Load saved language preference from storage
        const savedLang = this.getStoredLanguage();
        if (savedLang && translations[savedLang]) {
            this.currentLanguage = savedLang;
        } else {
            // Try to detect browser language as fallback
            this.detectBrowserLanguage();
        }
        
        // Create language selector UI
        this.createLanguageSelector();
        
        // Update the lang attribute on the html element
        document.documentElement.setAttribute('lang', this.currentLanguage);
        document.documentElement.setAttribute('data-language', this.currentLanguage);
        
        // Apply initial translations 
        this.updateUI();
        
        // Set up DOM mutation observer to automatically translate 
        // new elements added to the page
        this.setupMutationObserver();
        
        console.log(`i18n initialized with language: ${this.currentLanguage}`);
        return this.currentLanguage;
    },
    
    /**
     * Attempt to detect the user's browser language
     */
    detectBrowserLanguage() {
        try {
            // Get browser language (e.g. 'en-US' -> 'en')
            const browserLang = navigator.language.split('-')[0];
            
            // Check if we support this language
            if (translations[browserLang]) {
                this.currentLanguage = browserLang;
                console.log(`Browser language detected: ${browserLang}`);
            }
        } catch (e) {
            console.error('Error detecting browser language:', e);
        }
        
        return this.currentLanguage;
    },
    
    /**
     * Get a translation string by key
     * @param {string} key - The translation key
     * @param {object} params - Optional parameters for string interpolation
     * @returns {string} The translated string or the key if not found
     */
    t(key, params = {}) {
        // Get the current language translations
        const lang = translations[this.currentLanguage] || translations.en;
        
        // Get the translation string
        let translation = lang[key];
        
        // Fall back to English if the key doesn't exist in the current language
        if (!translation && this.currentLanguage !== 'en') {
            translation = translations.en[key];
        }
        
        // If still no translation, return the key
        if (!translation) {
            console.warn(`Missing translation for key: ${key}`);
            return key;
        }
        
        // Interpolate parameters if any
        if (params && Object.keys(params).length > 0) {
            return this.interpolate(translation, params);
        }
        
        return translation;
    },
    
    /**
     * Interpolate parameters into a translation string
     * @param {string} text - The text to interpolate
     * @param {object} params - Parameters as key-value pairs
     * @returns {string} The interpolated string
     */
    interpolate(text, params) {
        return text.replace(/{{\s*([^}]+)\s*}}/g, (match, key) => {
            const value = params[key.trim()];
            return value !== undefined ? value : match;
        });
    },
    
    /**
     * Change the application language
     * @param {string} lang - The language code to change to
     * @returns {boolean} Success status
     */
    changeLanguage(lang) {
        if (!translations[lang]) {
            console.error(`Language ${lang} not supported`);
            return false;
        }
        
        // Update current language
        this.currentLanguage = lang;
        
        // Update lang attribute
        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('data-language', lang);
        
        // Update the UI with new translations
        this.updateUI();
        
        // Save the language preference
        this.storeLanguage(lang);
        
        // Create and dispatch a custom event
        const event = new CustomEvent('languageChanged', { 
            detail: { language: lang } 
        });
        document.dispatchEvent(event);
        
        console.log(`Language changed to: ${lang}`);
        return true;
    },
    
    /**
     * Save language preference to storage
     * @param {string} lang - The language code to save
     */
    storeLanguage(lang) {
        try {
            localStorage.setItem('preferredLanguage', lang);
        } catch (e) {
            // Fallback to cookies if localStorage is not available
            this.setCookie('preferredLanguage', lang, 365); // 1 year
        }
    },
    
    /**
     * Get stored language preference
     * @returns {string|null} The stored language preference or null
     */
    getStoredLanguage() {
        try {
            // Try localStorage first
            const localLang = localStorage.getItem('preferredLanguage');
            if (localLang) return localLang;
        } catch (e) {
            // Fallback to cookies
            return this.getCookie('preferredLanguage');
        }
        return null;
    },
    
    /**
     * Set a cookie
     * @param {string} name - Cookie name
     * @param {string} value - Cookie value
     * @param {number} days - Days until expiration
     */
    setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + value + expires + "; path=/";
    },
    
    /**
     * Get a cookie value
     * @param {string} name - Cookie name 
     * @returns {string|null} Cookie value or null
     */
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },
    
    /**
     * Create the language selector UI
     */
    createLanguageSelector() {
        // Language display names in their own language
        const languageOptions = {
            'en': 'English',
            'uk': 'Українська',
            'lv': 'Latviešu'
        };
        
        // Create selector element if it doesn't exist
        let langSelector = document.getElementById('language-selector-container');
        
        if (!langSelector) {
            langSelector = document.createElement('div');
            langSelector.id = 'language-selector-container';
            langSelector.className = 'language-selector';
            langSelector.innerHTML = `
                <label for="language-select">
                    <span class="material-icons">language</span>
                </label>
                <select id="language-select">
                    ${Object.entries(languageOptions).map(([code, name]) => 
                        `<option value="${code}" ${code === this.currentLanguage ? 'selected' : ''}>${name}</option>`
                    ).join('')}
                </select>
            `;
            
            // Add event listener to language selector
            const selectElement = langSelector.querySelector('select');
            selectElement.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
            
            // Insert the language selector into the title area
            this.insertLanguageSelector(langSelector);
        } else {
            // Update the selector if it already exists
            const select = langSelector.querySelector('select');
            if (select) {
                select.value = this.currentLanguage;
            }
        }
    },
    
    /**
     * Insert the language selector into the appropriate location in the DOM
     * @param {HTMLElement} langSelector - The language selector element
     */
    insertLanguageSelector(langSelector) {
        // Try to find the title container first
        const titleContainer = document.querySelector('header h1');
        
        if (titleContainer) {
            // Create a wrapper for the title and language selector if not exists
            let container = document.querySelector('.title-lang-container');
            
            if (!container) {
                container = document.createElement('div');
                container.className = 'title-lang-container';
                
                // Get the original title
                const titleText = titleContainer.textContent;
                
                // Clear the original title element
                titleContainer.innerHTML = '';
                
                // Create a new title span
                const titleSpan = document.createElement('span');
                titleSpan.textContent = titleText;
                titleSpan.setAttribute('data-translate', 'appTitle');
                
                // Add the elements to the container
                container.appendChild(titleSpan);
                container.appendChild(langSelector);
                
                // Add the container to the title element
                titleContainer.appendChild(container);
            } else {
                // If container exists, just update the language selector
                const existingSelector = container.querySelector('.language-selector');
                if (existingSelector) {
                    container.replaceChild(langSelector, existingSelector);
                } else {
                    container.appendChild(langSelector);
                }
            }
        } else {
            // Fallback: add to header if title not found
            const header = document.querySelector('header');
            if (header) {
                header.appendChild(langSelector);
            } else {
                // Last resort: add to body
                document.body.appendChild(langSelector);
            }
        }
    },
    
    /**
     * Update all UI elements with translated text
     */
    updateUI() {
        // Update all elements with data-translate attribute
        const elementsToTranslate = document.querySelectorAll('[data-translate]');
        elementsToTranslate.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translated = this.t(key);
            if (translated) {
                element.textContent = translated;
            }
        });
        
        // Update placeholders
        const inputsWithPlaceholders = document.querySelectorAll('[data-translate-placeholder]');
        inputsWithPlaceholders.forEach(input => {
            const key = input.getAttribute('data-translate-placeholder');
            const translated = this.t(key);
            if (translated) {
                input.placeholder = translated;
            }
        });
        
        // Update document title
        document.title = this.t('appTitle');
    },
    
    /**
     * Set up a mutation observer to translate dynamically added elements
     */
    setupMutationObserver() {
        // Create a MutationObserver to watch for new elements
        const observer = new MutationObserver(mutations => {
            let needsTranslation = false;
            
            // Check if any of the mutations added nodes with data-translate
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if this node or any of its children have data-translate
                            if (node.hasAttribute && node.hasAttribute('data-translate') || 
                                node.querySelector && node.querySelector('[data-translate]')) {
                                needsTranslation = true;
                            }
                        }
                    });
                }
            });
            
            // If we found new translatable elements, update the UI
            if (needsTranslation) {
                this.updateUI();
            }
        });
        
        // Start observing the document body for changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
};

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    i18n.init();
});

// Make the i18n object globally available
window.i18n = i18n;

// Shorthand function for translations
window.__ = (key, params) => i18n.t(key, params);
