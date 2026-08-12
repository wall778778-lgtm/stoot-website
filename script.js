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
/* =========================
   STOOT COMMUNITY COMMENTS
========================= */

const commentsList = document.getElementById("comments-list");
const commentName = document.getElementById("comment-name");
const commentBody = document.getElementById("comment-body");
const postCommentButton = document.getElementById("post-comment");
const commentMessage = document.getElementById("comment-message");


/* =========================
   LOAD COMMENTS
========================= */

async function loadComments() {

    if (!commentsList) return;

    commentsList.innerHTML = `
        <p class="comments-loading">
            LOADING TRANSMISSIONS...
        </p>
    `;

    try {

        const response = await fetch("/api/comments");

        if (!response.ok) {
            throw new Error("Failed to load comments");
        }

        const data = await response.json();

        displayComments(data.comments || []);

    } catch (error) {

        console.error(error);

        commentsList.innerHTML = `
            <p class="no-comments">
                COMMUNICATION ERROR.
                <br>
                TRY AGAIN LATER.
            </p>
        `;
    }
}


/* =========================
   DISPLAY COMMENTS
========================= */

function displayComments(comments) {

    if (!commentsList) return;

    if (comments.length === 0) {

        commentsList.innerHTML = `
            <p class="no-comments">
                NO TRANSMISSIONS YET.
                <br>
                BE THE FIRST TO COMMENT.
            </p>
        `;

        return;
    }


    commentsList.innerHTML = "";


    comments.forEach(comment => {

        const card = document.createElement("div");

        card.className = "comment-card";


        const top = document.createElement("div");

        top.className = "comment-top";


        const name = document.createElement("div");

        name.className = "comment-name";

        name.textContent = comment.name;


        const date = document.createElement("div");

        date.className = "comment-date";

        date.textContent = formatCommentDate(comment.created_at);


        top.appendChild(name);

        top.appendChild(date);


        const body = document.createElement("div");

        body.className = "comment-body";

        body.textContent = comment.body;


        const actions = document.createElement("div");

        actions.className = "comment-actions";


        const likeButton = document.createElement("button");

        likeButton.className = "like-button";

        likeButton.textContent = `👍 ${comment.likes}`;


        likeButton.addEventListener("click", () => {

            likeComment(comment.id, likeButton);

        });


        actions.appendChild(likeButton);


        card.appendChild(top);

        card.appendChild(body);

        card.appendChild(actions);


        if (comment.admin_reply) {

            const reply = document.createElement("div");

            reply.className = "admin-reply";


            const replyTitle = document.createElement("div");

            replyTitle.className = "admin-reply-title";

            replyTitle.textContent = "STOOT ADMIN";


            const replyText = document.createElement("div");

            replyText.className = "admin-reply-text";

            replyText.textContent = comment.admin_reply;


            reply.appendChild(replyTitle);

            reply.appendChild(replyText);


            card.appendChild(reply);

        }


        commentsList.appendChild(card);

    });

}


/* =========================
   POST COMMENT
========================= */

async function postComment() {

    const name = commentName.value.trim();

    const body = commentBody.value.trim();


    if (!name || !body) {

        commentMessage.textContent =
            "PLEASE ENTER YOUR NAME AND COMMENT.";

        return;
    }


    postCommentButton.disabled = true;

    commentMessage.textContent =
        "TRANSMITTING...";


    try {

        const response = await fetch("/api/comments", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                body: body
            })

        });


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error || "Could not post comment."
            );

        }


        commentName.value = "";

        commentBody.value = "";


        commentMessage.textContent =
            "TRANSMISSION RECEIVED!";


        await loadComments();


    } catch (error) {

        console.error(error);

        commentMessage.textContent =
            error.message || "TRANSMISSION FAILED.";

    }


    postCommentButton.disabled = false;

}


/* =========================
   LIKE COMMENT
========================= */

async function likeComment(commentId, button) {

    button.disabled = true;


    try {

        const response = await fetch(
            "/api/comments/like",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    comment_id: commentId
                })

            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error || "Could not like comment."
            );

        }


        button.textContent =
            `👍 ${data.likes}`;


        button.classList.add("liked");


    } catch (error) {

        console.error(error);

    }


    button.disabled = false;

}


/* =========================
   DATE
========================= */

function formatCommentDate(dateString) {

    const date = new Date(dateString);


    if (Number.isNaN(date.getTime())) {

        return "";

    }


    return date.toLocaleString(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


/* =========================
   EVENTS
========================= */

if (postCommentButton) {

    postCommentButton.addEventListener(
        "click",
        postComment
    );

}


if (commentsList) {

    loadComments();

}
