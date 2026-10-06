/**
 * Seasonal layer: accent colour, footer mascot, and background particles.
 * Follows the calendar (see seasonForDate in <head>) unless a season is picked
 * manually. A manual pick only lasts for the current visit.
 */
(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const seasonForDate = window.seasonForDate;

    let mode = "auto";

    /* ---------- Icons ---------- */

    const icon = paths =>
        `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" ` +
        `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

    const ICONS = {
        auto: icon('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
        spring: icon('<circle cx="12" cy="7.2" r="3"/><circle cx="16.6" cy="10.5" r="3"/><circle cx="14.8" cy="15.9" r="3"/>' +
            '<circle cx="9.2" cy="15.9" r="3"/><circle cx="7.4" cy="10.5" r="3"/><circle cx="12" cy="12" r="1.6"/>'),
        summer: icon('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8' +
            'M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>'),
        fall: icon('<path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14z"/><path d="M5 19l8.5-8.5"/>'),
        winter: icon('<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 6.5l2.5-2M9.5 19.5L12 17.5l2.5 2"/>')
    };

    /* ---------- Particles ---------- */

    const canvas = document.getElementById("season-canvas");
    const ctx = canvas.getContext("2d");
    const PALETTES = {
        fall: ["#d9622b", "#e8a33d", "#b5432a", "#c97a2b", "#a4502a"],
        spring: ["#efbfd0", "#f4d4df", "#b4d8a8", "#c9e3bc"]
    };
    const DENSITY = { spring: 14, summer: 14, fall: 12, winter: 30 };

    let width = 0;
    let height = 0;
    let particles = [];
    let season = null;
    let running = false;
    let lastTime = 0;

    const rand = (min, max) => min + Math.random() * (max - min);
    const pick = list => list[Math.floor(Math.random() * list.length)];

    function isDark() {
        const theme = root.getAttribute("data-theme");
        return theme ? theme === "dark" : darkQuery.matches;
    }

    function targetCount() {
        const base = DENSITY[season] || 0;
        return width < 700 ? Math.round(base / 2) : base;
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createParticle(type, x, y) {
        const p = { type, x, y, alpha: 0, phase: rand(0, Math.PI * 2), rot: rand(0, Math.PI * 2), spin: 0 };
        switch (type) {
            case "fall":
                return Object.assign(p, {
                    size: rand(6, 11), vx: rand(-8, 8), vy: rand(22, 45), sway: rand(12, 28),
                    spin: rand(-1.2, 1.2), flip: rand(1, 2.4), color: pick(PALETTES.fall), maxAlpha: rand(0.45, 0.75)
                });
            case "winter":
                return Object.assign(p, {
                    size: rand(1.2, 3), vx: rand(-6, 6), vy: rand(14, 34), sway: rand(4, 12), maxAlpha: rand(0.45, 0.9)
                });
            case "spring":
                return Object.assign(p, {
                    size: rand(4.5, 7.5), vx: rand(10, 26), vy: rand(14, 28), sway: rand(10, 20),
                    spin: rand(-1.5, 1.5), flip: rand(1.5, 3), color: pick(PALETTES.spring), maxAlpha: rand(0.5, 0.8)
                });
            default: // summer — soap bubbles drifting up off the beach
                return Object.assign(p, {
                    size: rand(3.5, 8), vx: rand(-6, 6), vy: rand(-22, -10), sway: rand(6, 14),
                    wobble: rand(2, 4), maxAlpha: rand(0.5, 0.8)
                });
        }
    }

    /** Adds one ambient particle; scattered across the screen or entering from the edge */
    function spawnAmbient(scatter) {
        const x = season === "spring" ? rand(-width * 0.3, width) : rand(-20, width + 20);
        const edgeY = season === "summer" ? height + 10 : -10;
        particles.push(createParticle(season, x, scatter ? rand(0, height) : edgeY));
    }

    /** Fades out the current particles and fades in a full set for the new season */
    function setParticleSeason(next) {
        particles.forEach(p => { if (!p.burst) p.dying = true; });
        season = next;
        if (!reduceMotion.matches) {
            for (let i = 0; i < targetCount(); i++) spawnAmbient(true);
        }
        start();
    }

    /** A few slow particles left behind while the pointer is held and dragged */
    function trail(x, y) {
        if (reduceMotion.matches || !season) return;
        const count = Math.random() < 0.5 ? 1 : 2;
        for (let i = 0; i < count; i++) {
            const p = createParticle(season, x + rand(-4, 4), y + rand(-4, 4));
            Object.assign(p, {
                burst: true,
                vx: rand(-30, 30),
                vy: season === "summer" ? rand(-40, -15) : rand(-50, -10),
                gravity: season === "summer" ? -20 : 160,
                life: rand(0.8, 1.3),
                alpha: p.maxAlpha,
                sway: p.sway * 0.4
            });
            particles.push(p);
        }
        start();
    }

    /** A small puff of the season's particle, e.g. on click */
    function burst(x, y, count = 7, downward = false) {
        if (reduceMotion.matches || !season) return;
        for (let i = 0; i < count; i++) {
            const p = createParticle(season, x, y);
            const angle = downward ? rand(0.15 * Math.PI, 0.85 * Math.PI) : rand(-0.95 * Math.PI, -0.05 * Math.PI);
            const speed = rand(60, 170);
            Object.assign(p, {
                burst: true,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: season === "summer" ? -30 : 260,
                life: rand(0.9, 1.5),
                alpha: p.maxAlpha,
                sway: p.sway * 0.3
            });
            particles.push(p);
        }
        start();
    }

    function update(dt) {
        for (const p of particles) {
            p.phase += dt;
            p.rot += p.spin * dt;
            const swayX = Math.sin(p.phase * 1.3) * p.sway;

            if (p.burst) {
                p.vy = Math.min(p.vy + p.gravity * dt, 120);
                p.vx *= Math.max(0, 1 - 2 * dt);
                p.life -= dt;
                p.alpha = p.maxAlpha * Math.max(0, Math.min(1, p.life / 0.6));
            } else if (p.dying) {
                p.alpha = Math.max(0, p.alpha - dt * 1.6);
            } else {
                p.alpha = Math.min(p.maxAlpha, p.alpha + dt * 1.2 * p.maxAlpha);
            }

            p.x += (p.vx + swayX) * dt;
            p.y += p.vy * dt;
        }

        particles = particles.filter(p => {
            if (p.burst) return p.life > 0;
            if (p.dying && p.alpha <= 0) return false;
            return p.y < height + 30 && p.y > -30 && p.x < width + 60 && p.x > -width * 0.4;
        });

        // Top up ambient particles gradually so they enter from the edge
        if (!reduceMotion.matches) {
            const live = particles.filter(p => !p.dying && !p.burst).length;
            if (live < targetCount() && Math.random() < dt * 3) spawnAmbient(false);
        }
    }

    function drawParticle(p, dark) {
        ctx.globalAlpha = p.alpha;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        if (p.type === "fall" || p.type === "spring") {
            // Squash horizontally to fake a 3D tumble
            const f = Math.cos(p.phase * p.flip);
            ctx.scale(Math.sign(f || 1) * Math.max(0.2, Math.abs(f)), 1);
        }

        const s = p.size;
        if (p.type === "fall") {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.quadraticCurveTo(s * 0.75, -s * 0.15, 0, s);
            ctx.quadraticCurveTo(-s * 0.75, -s * 0.15, 0, -s);
            ctx.fill();
            ctx.strokeStyle = "rgba(60, 25, 10, 0.35)";
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.7);
            ctx.lineTo(0, s * 1.3);
            ctx.stroke();
        } else if (p.type === "winter") {
            ctx.fillStyle = dark ? "#ffffff" : "#9db8d3";
            ctx.beginPath();
            ctx.arc(0, 0, s, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === "spring") {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, s * 0.6, s, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Bubble: faint fill, thin rim, and a small highlight; wobbles as it rises
            const w = 1 + Math.sin(p.phase * p.wobble) * 0.06;
            ctx.rotate(-p.rot);
            ctx.scale(w, 2 - w);
            ctx.fillStyle = dark ? "rgba(242, 212, 126, 0.08)" : "rgba(214, 170, 60, 0.07)";
            ctx.strokeStyle = dark ? "rgba(246, 222, 150, 0.7)" : "rgba(170, 120, 10, 0.45)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, s, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = dark ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.95)";
            ctx.beginPath();
            ctx.ellipse(-s * 0.38, -s * 0.38, s * 0.22, s * 0.13, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            if (!dark) {
                ctx.strokeStyle = "rgba(170, 120, 10, 0.35)";
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    function frame(time) {
        if (!running) return;
        const dt = Math.min(0.05, (time - lastTime) / 1000 || 0);
        lastTime = time;

        update(dt);
        ctx.clearRect(0, 0, width, height);
        const dark = isDark();
        particles.forEach(p => drawParticle(p, dark));
        ctx.globalAlpha = 1;

        if (particles.length === 0 && reduceMotion.matches) {
            running = false;
            return;
        }
        requestAnimationFrame(frame);
    }

    function start() {
        if (running || document.hidden) return;
        running = true;
        lastTime = performance.now();
        requestAnimationFrame(frame);
    }

    /* ---------- Picker ---------- */

    const picker = document.getElementById("season-picker");
    const button = document.getElementById("season-btn");
    const menu = document.getElementById("season-menu");
    const options = [...menu.querySelectorAll('[role="option"]')];
    const autoHint = menu.querySelector(".season-option__hint");

    options.forEach(option => {
        option.querySelector(".season-option__icon").innerHTML = ICONS[option.dataset.value];
    });

    function currentSeason() {
        return mode === "auto" ? seasonForDate() : mode;
    }

    function applySeason() {
        const next = currentSeason();
        root.setAttribute("data-season", next);

        if (button.dataset.season !== next) {
            button.dataset.season = next;
            button.querySelector(".season-btn__icon").innerHTML = ICONS[next];
            button.querySelector(".season-btn__label").textContent = next;
        }
        button.setAttribute("aria-label", `Season: ${next}${mode === "auto" ? " (auto)" : ""}. Change season`);
        options.forEach(o => o.setAttribute("aria-selected", String(o.dataset.value === mode)));
        autoHint.textContent = ` (${seasonForDate()})`;

        if (next !== season) setParticleSeason(next);
    }

    function openMenu() {
        menu.classList.add("open");
        button.setAttribute("aria-expanded", "true");
        const selected = options.find(o => o.dataset.value === mode) || options[0];
        selected.focus();
    }

    function closeMenu(returnFocus) {
        if (!menu.classList.contains("open")) return;
        menu.classList.remove("open");
        button.setAttribute("aria-expanded", "false");
        if (returnFocus) button.focus();
    }

    function choose(value) {
        const previous = currentSeason();
        mode = value;
        applySeason();
        closeMenu(true);
        if (currentSeason() !== previous) {
            const rect = button.getBoundingClientRect();
            const header = document.querySelector(".site-header").getBoundingClientRect();
            burst(rect.left + rect.width / 2, header.bottom + 4, 10, true);
        }
    }

    button.addEventListener("click", () => {
        menu.classList.contains("open") ? closeMenu(false) : openMenu();
    });

    button.addEventListener("keydown", e => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openMenu();
        } else if (e.key === "Escape") {
            closeMenu(false);
        }
    });

    menu.addEventListener("click", e => {
        const option = e.target.closest('[role="option"]');
        if (option) choose(option.dataset.value);
    });

    menu.addEventListener("keydown", e => {
        const index = options.indexOf(document.activeElement);
        const focusAt = i => options[(i + options.length) % options.length].focus();

        switch (e.key) {
            case "ArrowDown": e.preventDefault(); focusAt(index + 1); break;
            case "ArrowUp": e.preventDefault(); focusAt(index - 1); break;
            case "Home": e.preventDefault(); focusAt(0); break;
            case "End": e.preventDefault(); focusAt(options.length - 1); break;
            case "Enter":
            case " ":
                e.preventDefault();
                if (index >= 0) choose(options[index].dataset.value);
                break;
            case "Escape": e.preventDefault(); closeMenu(true); break;
            case "Tab": closeMenu(false); break;
        }
    });

    // Hold and drag to leave a trail; a plain click gives a small puff.
    // Text selection is switched off while held so dragging doesn't highlight anything.
    let drag = null;

    function endDrag() {
        if (drag) drag.held = false;
        root.classList.remove("season-dragging");
    }

    document.addEventListener("pointerdown", e => {
        if (e.button !== 0 || picker.contains(e.target)) return;
        drag = { x: e.clientX, y: e.clientY, distance: 0, held: true };
        if (e.pointerType !== "touch") root.classList.add("season-dragging");
    });

    document.addEventListener("pointermove", e => {
        if (!drag || !drag.held) return;
        const step = Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
        if (step < 14) return;
        drag.distance += step;
        drag.x = e.clientX;
        drag.y = e.clientY;
        trail(e.clientX, e.clientY);
    });

    document.addEventListener("pointerup", endDrag);
    document.addEventListener("pointercancel", () => {
        endDrag();
        drag = null;
    });

    // Stop images and links from being picked up as a native drag mid-trail
    document.addEventListener("dragstart", e => {
        if (drag && drag.held) e.preventDefault();
    });

    document.addEventListener("click", e => {
        const dragged = drag && drag.distance > 10;
        drag = null;
        if (picker.contains(e.target)) return;
        closeMenu(false);
        // Ignore keyboard-triggered clicks (detail is 0) and the end of a drag
        if (e.detail > 0 && !dragged) burst(e.clientX, e.clientY);
    });

    /* ---------- Init ---------- */

    resize();
    window.addEventListener("resize", resize);

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) running = false;
        else start();
    });

    reduceMotion.addEventListener("change", () => {
        if (reduceMotion.matches) particles.forEach(p => { p.dying = true; });
        else setParticleSeason(season);
    });

    // Catch a season change in tabs left open for a long time
    setInterval(() => { if (mode === "auto") applySeason(); }, 30 * 60 * 1000);

    applySeason();
})();
