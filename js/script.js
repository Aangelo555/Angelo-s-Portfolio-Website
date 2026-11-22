// Mobile menu
let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

menuIcon.onclick = () => {
    navbar.classList.toggle('active');
};

// Typing animation
const roles = [
    "Front-End Developer",
    "Business Analyst",
    "Full-Stack Developer",
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
const hiddenItems = document.querySelectorAll('.reveal, .stagger');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

hiddenItems.forEach(item => observer.observe(item));

// Beams follow the mouse slightly (only on devices with a mouse)
if (window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('mousemove', (e) => {
        // mouse position from -1 to 1
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        document.body.style.setProperty('--move-x', x * 20 + 'px');
        document.body.style.setProperty('--move-y', y * 12 + 'px');
    });
}