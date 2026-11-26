// Mobile menu
let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

menuIcon.onclick = () => {
    navbar.classList.toggle('active');
};

// Typing animation
// web dev roles first, since that's the main goal
const roles = [
    "Front-End Developer",
    "Full-Stack Developer",
    "Business Analyst",
    "Data Analyst"
];

let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;

const typingTarget = document.querySelector('#typing-text');

function type() {
    const currentRole = roles[roleIndex];

    if (isDeleting) {
        typingTarget.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingTarget.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
    }

    let speed = isDeleting ? 60 : 90;

    if (!isDeleting && charIndex === currentRole.length) {
        speed = 1500;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        speed = 400;
    }

    setTimeout(type, speed);
}

if (typingTarget) {
    type();
}

// Scroll animations
// each item fades in when it scrolls into view
// cards that come in together get a small delay each, so they appear one by one
const observer = new IntersectionObserver((entries) => {
    let count = 0;

    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const item = entry.target;

            if (item.parentElement.classList.contains('stagger')) {
                item.style.setProperty('--delay', count * 0.15 + 's');
                count++;
            }

            item.classList.add('show');
            observer.unobserve(item);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

// watch each card on its own, not the whole grid
document.querySelectorAll('.reveal, .stagger > *').forEach(item => observer.observe(item));

// Navbar gets a background once you scroll
const header = document.querySelector('.header');
function updateHeader() {
    header.classList.toggle('scrolled', window.scrollY > 20);
}
window.addEventListener('scroll', updateHeader);
updateHeader();

// ===== Background aurora (WebGL) =====
// slow flowing northern lights drawn on the graphics card
(function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'bg-canvas';
    document.body.prepend(canvas);

    // no antialias or depth buffer needed for a flat background, saves memory and power
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
    if (!gl) return; // no WebGL, the plain dark background shows instead

    // if the graphics card resets (driver crash, too many tabs), fall back to the plain background
    canvas.addEventListener('webglcontextlost', () => canvas.remove());

    const vertexSrc = `
        attribute vec2 pos;
        void main() { gl_Position = vec4(pos, 0.0, 1.0); }
    `;

    const fragmentSrc = `
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif
        uniform vec2 uRes;
        uniform float uTime;
        uniform float uScroll;
        uniform float uFade;
        uniform float uScale;
        uniform vec2 uMouse;
        uniform vec3 uBg;
        uniform vec3 uBeam;
        uniform vec3 uTop;

        float hash(vec2 p) {
            vec3 p3 = fract(vec3(p.xyx) * 0.1031);
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.x + p3.y) * p3.z);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                       mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }

        // layered noise, each layer rotated so you don't see grid lines
        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
            for (int i = 0; i < 4; i++) {
                v += a * noise(p);
                p = rot * p * 2.0;
                a *= 0.5;
            }
            return v;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / uRes;
            vec2 p = uv;
            p.x *= uRes.x / uRes.y;
            float t = uTime * 0.04;

            // the aurora drifts a little toward the mouse
            p += uMouse * 0.06;

            // stretch sideways so the flow makes long curtains, not blobs
            vec2 s = vec2(p.x * 0.75, p.y * 2.0);

            // domain warping: noise pushes noise around, which gives the silky flowing shapes
            vec2 q = vec2(fbm(s + vec2(0.0, t)), fbm(s + vec2(5.2, 1.3) - t));
            vec2 r = vec2(fbm(s + 2.5 * q + vec2(1.7, 9.2) + t * 1.5),
                          fbm(s + 2.5 * q + vec2(8.3, 2.8) - t * 1.2));
            float f = fbm(s + 2.8 * r);

            // light lives in the upper part of the screen and moves up as you scroll
            float mask = smoothstep(0.2 + uScroll * 0.3, 0.95, uv.y);

            // thin bright ribbons along the flow lines
            float band = 1.0 - abs(sin(f * 7.0));
            float ribbon = pow(band, 8.0) * smoothstep(0.35, 0.7, f);

            // fine vertical streaks inside the light, like the rays in a real aurora
            float rays = 0.6 + 0.25 * noise(vec2(p.x * 45.0 + r.y * 6.0, p.y * 1.5 + t * 3.0))
                             + 0.15 * noise(vec2(p.x * 14.0 - r.x * 4.0, p.y * 0.8 - t * 2.0));

            // colour ramp: dark green in the soft parts, the beam colour in the middle, pale mint on the brightest ribbons
            float glow = smoothstep(0.22, 0.75, f) * mask;
            vec3 deep = uBeam * 0.3;

            // the tops of the light shift to a second colour, like the purple fringe on real aurora
            float topMix = smoothstep(0.5, 0.95, uv.y) * (0.4 + 0.6 * clamp(r.x * 1.5 - 0.3, 0.0, 1.0));
            vec3 body = mix(deep, mix(uBeam, uTop, topMix), glow);
            vec3 mint = mix(mix(uBeam, uTop, topMix), vec3(1.0), 0.45); // pale version of the colour underneath

            vec3 col = uBg;
            col += body * glow * rays * 1.5;
            col += mint * ribbon * 0.45 * mask * rays;

            // dark edges pull your eye to the middle
            vec2 v = uv - 0.5;
            col *= 1.0 - dot(v, v) * 0.6;

            col = col * uFade + uBg * (1.0 - uFade);

            // tiny random noise per pixel, stops the dark gradients from showing visible colour steps (banding)
            col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;

            gl_FragColor = vec4(col, 1.0);
        }
    `;

    function makeShader(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
    }

    const program = gl.createProgram();
    gl.attachShader(program, makeShader(gl.VERTEX_SHADER, vertexSrc));
    gl.attachShader(program, makeShader(gl.FRAGMENT_SHADER, fragmentSrc));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        canvas.remove();
        return;
    }
    gl.useProgram(program);

    // one rectangle that covers the whole screen
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'uRes');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uScroll = gl.getUniformLocation(program, 'uScroll');
    const uFade = gl.getUniformLocation(program, 'uFade');
    const uMouse = gl.getUniformLocation(program, 'uMouse');

    // read the colours from the CSS variables, so changing them in style.css changes the aurora too
    function hexToRgb(hex) {
        const n = parseInt(hex.trim().replace('#', ''), 16);
        return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
    }
    const styles = getComputedStyle(document.documentElement);
    gl.uniform3fv(gl.getUniformLocation(program, 'uBg'), hexToRgb(styles.getPropertyValue('--bg-color')));
    const beam = hexToRgb(styles.getPropertyValue('--beam-color'));
    gl.uniform3fv(gl.getUniformLocation(program, 'uBeam'), beam);

    // colour for the tops of the aurora, if style.css doesn't set one, use a teal made from the beam colour
    const topHex = styles.getPropertyValue('--aurora-top-color').trim();
    const top = topHex ? hexToRgb(topHex) : [beam[0] * 0.3, beam[1] * 0.85, beam[2] * 0.95 + 0.15];
    gl.uniform3fv(gl.getUniformLocation(program, 'uTop'), top);

    // draw at half size (or less on big screens) and let CSS stretch it
    // the aurora is soft so you can't tell, and it's at least 4 times less work for the graphics card
    const uScale = gl.getUniformLocation(program, 'uScale');
    let lastFrame = 0; // time of the last draw, 0 means draw straight away

    function resize() {
        const scale = Math.min(0.5, 960 / window.innerWidth);
        gl.uniform1f(uScale, scale);
        canvas.width = Math.round(window.innerWidth * scale);
        canvas.height = Math.round(window.innerHeight * scale);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        lastFrame = 0; // resizing clears the canvas, so redraw on the next frame
    }
    resize();
    window.addEventListener('resize', resize);

    // scroll position, smoothed so the aurora eases up as you scroll
    let scroll = 0, smoothScroll = 0;

    function updateScroll() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scroll = max > 0 ? window.scrollY / max : 0;
    }
    window.addEventListener('scroll', updateScroll);
    updateScroll();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();

    // mouse position from -0.5 to 0.5, smoothed so the aurora follows slowly
    // only on devices with a real mouse
    let mouseX = 0, mouseY = 0, smoothX = 0, smoothY = 0;
    if (window.matchMedia('(hover: hover)').matches && !reduceMotion) {
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX / window.innerWidth - 0.5;
            mouseY = 0.5 - e.clientY / window.innerHeight; // flipped, WebGL counts y from the bottom
        });
    }

    function draw() {
        if (!reduceMotion) requestAnimationFrame(draw);

        // the aurora moves slowly, so 30 frames a second looks the same and halves the work
        const now = performance.now();
        if (!reduceMotion && now - lastFrame < 32) return;

        // frames since last draw (1 on a 60Hz screen), so the easing is the same speed on any screen
        const frames = (now - lastFrame) / 16.7;
        lastFrame = now;

        smoothScroll += (scroll - smoothScroll) * (1 - Math.pow(0.95, frames));
        smoothX += (mouseX - smoothX) * (1 - Math.pow(0.97, frames));
        smoothY += (mouseY - smoothY) * (1 - Math.pow(0.97, frames));
        gl.uniform2f(uMouse, smoothX, smoothY);

        // time loops so the numbers never get too big
        const seconds = ((performance.now() - start) / 1000) % 10000;

        // starts a bit into the animation so the first frame already looks good
        gl.uniform1f(uTime, reduceMotion ? 80 : 80 + seconds);
        gl.uniform1f(uScroll, smoothScroll);

        // fades in over 2 seconds the first time the page opens
        const fade = Math.min(seconds / 2, 1);
        gl.uniform1f(uFade, reduceMotion ? 1 : fade * fade * (3 - 2 * fade));

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    draw();

    // with reduce motion on, only redraw when scrolling, no constant animation
    if (reduceMotion) window.addEventListener('scroll', () => requestAnimationFrame(draw));
})();

// ===== Stars =====
// drawn once on a normal 2D canvas at full sharpness, sits on top of the aurora
// (in the shader they were drawn at half size, so the tiny dots got lost)
(function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'star-canvas';
    canvas.style.cssText = 'position: fixed; inset: 0; width: 100%; height: 100%; z-index: -2; pointer-events: none; opacity: 0; transition: opacity 2s ease;';

    const bg = document.getElementById('bg-canvas');
    if (bg) bg.after(canvas);
    else document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');

    // same random numbers every time, so the stars stay in the same spots after a resize
    let seed = 7;
    function random() {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    }

    // each star: x and y as a fraction of the screen, size and brightness
    const stars = [];
    for (let i = 0; i < 160; i++) {
        stars.push({
            x: random(),
            y: Math.pow(random(), 1.8),        // more stars near the top, like a real night sky
            size: 0.4 + Math.pow(random(), 3) * 1.1,
            alpha: 0.2 + random() * 0.55
        });
    }

    function drawStars() {
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.round(window.innerWidth * ratio);
        canvas.height = Math.round(window.innerHeight * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

        // fewer stars on small screens so phones don't look crowded
        const count = Math.round(stars.length * Math.min(1, window.innerWidth / 1400));

        for (let i = 0; i < count; i++) {
            const star = stars[i];
            const x = star.x * window.innerWidth;
            const y = star.y * window.innerHeight;

            ctx.fillStyle = `rgba(225, 235, 255, ${star.alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, star.size, 0, Math.PI * 2);
            ctx.fill();

            // the biggest ones get a faint glow
            if (star.size > 1.1) {
                ctx.fillStyle = `rgba(225, 235, 255, ${star.alpha * 0.12})`;
                ctx.beginPath();
                ctx.arc(x, y, star.size * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawStars();
    requestAnimationFrame(() => canvas.style.opacity = '1'); // fades in with the aurora

    // redraw after resizing, waits until you stop dragging the window
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(drawStars, 150);
    });
})();