const root = document.documentElement;
root.classList.add("js");

/**
 * Toggles the mobile menu open/closed state
 */
function toggleMenu(force) {
    const menu = document.getElementById("nav-links");
    const button = document.getElementById("menu-toggle");
    const open = typeof force === "boolean" ? force : !menu.classList.contains("open");

    menu.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

/**
 * Returns the theme currently in effect (explicit choice or system preference)
 */
function currentTheme() {
    const explicit = root.getAttribute("data-theme");
    if (explicit) return explicit;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Toggles dark mode on/off and remembers the choice
 */
function toggleTheme() {
    const newTheme = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", newTheme);
    try {
        localStorage.setItem("theme", newTheme);
    } catch (e) {}
}

/**
 * Updates scroll progress indicator
 */
function updateScrollProgress() {
    const max = root.scrollHeight - root.clientHeight;
    const progress = max > 0 ? window.scrollY / max : 0;
    const progressBar = document.getElementById("scroll-progress");
    if (progressBar) {
        progressBar.style.transform = `scaleX(${progress})`;
    }
}

/**
 * Reveals elements as they scroll into view
 */
function initScrollAnimations() {
    const items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
        items.forEach(item => item.classList.add("visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        // Stagger items that enter together, top to bottom
        entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
            .forEach((entry, i) => {
                const item = entry.target;
                item.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
                item.classList.add("visible");
                observer.unobserve(item);
                // Clear the delay so hover transitions aren't held back afterwards
                setTimeout(() => { item.style.transitionDelay = ""; }, 1200 + i * 70);
            });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

    items.forEach(item => observer.observe(item));
}

document.addEventListener("DOMContentLoaded", () => {
    initScrollAnimations();

    document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
    document.getElementById("menu-toggle").addEventListener("click", () => toggleMenu());
    document.querySelectorAll("#nav-links a").forEach(link => {
        link.addEventListener("click", () => toggleMenu(false));
    });

    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    updateScrollProgress();
});
