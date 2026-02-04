/**
 * Toggles the mobile menu open/closed state
 * Adds or removes the 'open' class to menu and hamburger icon
 */
function toggleMenu() {
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");
    
    menu.classList.toggle("open");
    icon.classList.toggle("open");
}

/**
 * Toggles dark mode on/off
 * Saves preference to localStorage
 */
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Update theme icons
    updateThemeIcons(newTheme);
}
 
/**
 * Updates theme toggle icons based on current theme
 */
function updateThemeIcons(theme) {
    const icons = document.querySelectorAll(".theme-icon");
    icons.forEach(icon => {
        icon.textContent = theme === "dark" ? "☀️" : "🌙";
    });
}

/**
 * Initializes theme on page load
 * Checks localStorage for saved preference or uses system preference
 */
function initTheme() {
    const theme = "dark";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    updateThemeIcons(theme);
}

/**
 * Updates scroll progress indicator
 */
function updateScrollProgress() {
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (window.scrollY / windowHeight) * 100;
    const progressBar = document.getElementById("scroll-progress");
    if (progressBar) {
        progressBar.style.width = scrolled + "%";
    }
}

/**
 * Observes sections for fade-in animation on scroll
 */
function initScrollAnimations() {
    const sections = document.querySelectorAll("section");
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });
}

/**
 * Typing animation for the name
 */
function initTypingAnimation() {
    const nameElement = document.querySelector("#profile .title");
    if (!nameElement) return;
    
    const text = nameElement.textContent;
    nameElement.textContent = "";
    nameElement.style.borderRight = "2px solid";
    nameElement.style.animation = "blink 1s infinite";
    
    let i = 0;
    function type() {
        if (i < text.length) {
            nameElement.textContent += text.charAt(i);
            i++;
            setTimeout(type, 100);
        } else {
            setTimeout(() => {
                nameElement.style.borderRight = "none";
                nameElement.style.animation = "none";
            }, 500);
        }
    }
    
    setTimeout(type, 500);
}

// Initialize theme on page load
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initScrollAnimations();
    initTypingAnimation();
    
    // Add event listeners to theme toggle buttons
    const themeToggle = document.getElementById("theme-toggle");
    const themeToggleMobile = document.getElementById("theme-toggle-mobile");
    
    if (themeToggle) {
        themeToggle.addEventListener("click", toggleTheme);
    }
    
    if (themeToggleMobile) {
        themeToggleMobile.addEventListener("click", toggleTheme);
    }
    
    // Update scroll progress on scroll
    window.addEventListener("scroll", updateScrollProgress);
    updateScrollProgress(); // Initial call
});
