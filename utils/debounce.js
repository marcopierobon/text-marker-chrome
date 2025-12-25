// Debounce utility function

/**
 * Debounces a function to limit how often it can be called
 * @param {Function} func - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Throttles a function to execute at most once per interval
 * @param {Function} func - The function to throttle
 * @param {number} interval - Minimum interval in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, interval) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall >= interval) {
            lastCall = now;
            return func.apply(this, args);
        }
    };
}
