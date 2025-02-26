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
