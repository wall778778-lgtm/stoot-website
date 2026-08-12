// ================================
// STOOT WEBSITE JAVASCRIPT
// ================================


// ================================
// SMOOTH SCROLLING
// ================================

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


// ================================
// HEADER CHANGES WHEN SCROLLING
// ================================

const header = document.querySelector("header");

window.addEventListener("scroll", () => {

    if (!header) return;

    if (window.scrollY > 50) {

        header.style.background =
            "rgba(2, 3, 8, 0.95)";

    } else {

        header.style.background =
            "rgba(3, 4, 10, 0.75)";

    }

});


// ================================
// MOUSE MOVEMENT EFFECT FOR SHIP
// ================================

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


// ==================================================
// STOOT COMMUNITY COMMENTS
// ==================================================


// ================================
// COMMENT ELEMENTS
// ================================

const commentsList =
    document.getElementById("comments-list");

const commentName =
    document.getElementById("comment-name");

const commentBody =
    document.getElementById("comment-body");

const postCommentButton =
    document.getElementById("post-comment");

const commentMessage =
    document.getElementById("comment-message");


// ================================
// VISITOR FINGERPRINT
// ================================

function getFingerprint() {

    let fingerprint =
        localStorage.getItem("stoot_fingerprint");


    if (!fingerprint) {

        if (
            typeof crypto !== "undefined" &&
            crypto.randomUUID
        ) {

            fingerprint =
                "stoot-" +
                crypto.randomUUID();

        } else {

            fingerprint =
                "stoot-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .substring(2);

        }


        localStorage.setItem(
            "stoot_fingerprint",
            fingerprint
        );

    }


    return fingerprint;

}


// ================================
// LOAD COMMENTS
// ================================

async function loadComments() {

    if (!commentsList) return;


    commentsList.innerHTML = `
        <p class="comments-loading">
            LOADING TRANSMISSIONS...
        </p>
    `;


    try {

        const response =
            await fetch("/api/comments");


        if (!response.ok) {

            throw new Error(
                "Failed to load comments."
            );

        }


        const data =
            await response.json();


        displayComments(
            data.comments || []
        );


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


// ================================
// DISPLAY COMMENTS
// ================================

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


        // ----------------------------
        // COMMENT CARD
        // ----------------------------

        const card =
            document.createElement("div");

        card.className =
            "comment-card";


        // ----------------------------
        // TOP
        // ----------------------------

        const top =
            document.createElement("div");

        top.className =
            "comment-top";


        // ----------------------------
        // NAME
        // ----------------------------

        const name =
            document.createElement("div");

        name.className =
            "comment-name";

        name.textContent =
            comment.name;


        // ----------------------------
        // DATE
        // ----------------------------

        const date =
            document.createElement("div");

        date.className =
            "comment-date";

        date.textContent =
            formatCommentDate(
                comment.created_at
            );


        top.appendChild(name);

        top.appendChild(date);


        // ----------------------------
        // COMMENT BODY
        // ----------------------------

        const body =
            document.createElement("div");

        body.className =
            "comment-body";

        body.textContent =
            comment.body;


        // ----------------------------
        // ACTIONS
        // ----------------------------

        const actions =
            document.createElement("div");

        actions.className =
            "comment-actions";


        // ----------------------------
        // LIKE BUTTON
        // ----------------------------

        const likeButton =
            document.createElement("button");

        likeButton.className =
            "like-button";

        likeButton.textContent =
            `👍 ${comment.likes}`;


        likeButton.addEventListener(
            "click",
            () => {

                likeComment(
                    comment.id,
                    likeButton
                );

            }
        );


        actions.appendChild(
            likeButton
        );


        // ----------------------------
        // BUILD CARD
        // ----------------------------

        card.appendChild(top);

        card.appendChild(body);

        card.appendChild(actions);


        // ----------------------------
        // ADMIN REPLY
        // ----------------------------

        if (comment.admin_reply) {


            const reply =
                document.createElement("div");

            reply.className =
                "admin-reply";


            const replyTitle =
                document.createElement("div");

            replyTitle.className =
                "admin-reply-title";

            replyTitle.textContent =
                "STOOT ADMIN";


            const replyText =
                document.createElement("div");

            replyText.className =
                "admin-reply-text";

            replyText.textContent =
                comment.admin_reply;


            reply.appendChild(
                replyTitle
            );

            reply.appendChild(
                replyText
            );


            card.appendChild(
                reply
            );

        }


        commentsList.appendChild(
            card
        );

    });

}


// ================================
// POST COMMENT
// ================================

async function postComment() {

    if (!commentName || !commentBody) {
        return;
    }


    const name =
        commentName.value.trim();


    const body =
        commentBody.value.trim();


    // ----------------------------
    // VALIDATION
    // ----------------------------

    if (!name || !body) {

        if (commentMessage) {

            commentMessage.textContent =
                "PLEASE ENTER YOUR NAME AND COMMENT.";

        }

        return;

    }


    if (name.length < 2) {

        commentMessage.textContent =
            "NAME IS TOO SHORT.";

        return;

    }


    if (body.length < 2) {

        commentMessage.textContent =
            "COMMENT IS TOO SHORT.";

        return;

    }


    // ----------------------------
    // DISABLE BUTTON
    // ----------------------------

    if (postCommentButton) {

        postCommentButton.disabled =
            true;

    }


    if (commentMessage) {

        commentMessage.textContent =
            "TRANSMITTING...";

    }


    try {


        // ----------------------------
        // SEND COMMENT
        // ----------------------------

        const response =
            await fetch(
                "/api/comments",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        name: name,

                        body: body

                    })

                }
            );


        const data =
            await response.json();


        // ----------------------------
        // CHECK RESPONSE
        // ----------------------------

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Could not post comment."
            );

        }


        // ----------------------------
        // CLEAR FORM
        // ----------------------------

        commentName.value = "";

        commentBody.value = "";


        if (commentMessage) {

            commentMessage.textContent =
                "TRANSMISSION RECEIVED!";

        }


        // ----------------------------
        // RELOAD COMMENTS
        // ----------------------------

        await loadComments();


    } catch (error) {

        console.error(error);


        if (commentMessage) {

            commentMessage.textContent =
                error.message ||
                "TRANSMISSION FAILED.";

        }

    }


    // ----------------------------
    // ENABLE BUTTON
    // ----------------------------

    if (postCommentButton) {

        postCommentButton.disabled =
            false;

    }

}


// ================================
// LIKE COMMENT
// ================================

async function likeComment(
    commentId,
    button
) {

    if (!button) return;


    button.disabled = true;


    try {


        // ----------------------------
        // GET VISITOR ID
        // ----------------------------

        const fingerprint =
            getFingerprint();


        // ----------------------------
        // SEND LIKE
        // ----------------------------

        const response =
            await fetch(
                "/api/comments/like",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        comment_id:
                            commentId,

                        fingerprint:
                            fingerprint

                    })

                }
            );


        const data =
            await response.json();


        // ----------------------------
        // ALREADY LIKED
        // ----------------------------

        if (
            !response.ok &&
            data.alreadyLiked
        ) {

            button.textContent =
                `👍 ${data.likes}`;

            button.classList.add(
                "liked"
            );

            return;

        }


        // ----------------------------
        // OTHER ERROR
        // ----------------------------

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Could not like comment."
            );

        }


        // ----------------
