// Mobile menu
let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

menuIcon.onclick = () => {
    navbar.classList.toggle('active');
};

// Typing animation
const roles = [
    "Front-End Developer",
    "Software Engineer",
    "Full-Stack Developer",
    "UI Designer"
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