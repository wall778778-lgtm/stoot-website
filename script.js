// ================================
// STOOT WEBSITE JAVASCRIPT
// ================================


// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(link => {

    link.addEventListener("click", function(event) {

        const target = document.querySelector(
            this.getAttribute("href")
        );

        if (target) {

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth"
            });

        }

    });

});


// Header changes when scrolling
const header = document.querySelector("header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 50) {

        header.style.background =
            "rgba(2, 3, 8, 0.95)";

    } else {

        header.style.background =
            "rgba(3, 4, 10, 0.75)";

    }

});


// Small mouse movement effect for the ship
const ship = document.querySelector(".hero-ship img");

document.addEventListener("mousemove", (event) => {

    if (!ship) return;

    const x =
        (window.innerWidth / 2 - event.clientX) / 50;

    const y =
        (window.innerHeight / 2 - event.clientY) / 50;

    ship.style.transform =
        `translate(${x}px, ${y}px)`;

});