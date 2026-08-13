// ================================
// STOOT WEBSITE JAVASCRIPT
// ================================


// ================================
// SMOOTH SCROLLING
// ================================

document.querySelectorAll('a[href^="#"]').forEach(link => {

    link.addEventListener("click", function (event) {

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
// HEADER
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
// SHIP MOUSE EFFECT
// ================================

const ship = document.querySelector(".hero-ship img");

document.addEventListener("mousemove", event => {

    if (!ship) return;

    const x =
        (window.innerWidth / 2 - event.clientX) / 50;

    const y =
        (window.innerHeight / 2 - event.clientY) / 50;

    ship.style.transform =
        `translate(${x}px, ${y}px)`;

});


// ==================================================
// STOOT COMMUNITY
// ==================================================

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
// CREATE VISITOR ID
// ================================

function getVisitorId() {

    let id =
        localStorage.getItem("stoot_visitor_id");

    if (!id) {

        id =
            "visitor-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 15);

        localStorage.setItem(
            "stoot_visitor_id",
            id
        );

    }

    return id;

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

        const response = await fetch(
            "/api/comments",
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!response.ok) {

            throw new Error(
                "Server returned " +
                response.status
            );

        }

        const data =
            await response.json();

        console.log(
            "STOOT comments:",
            data
        );

        if (
            !data ||
            !Array.isArray(data.comments)
        ) {

            throw new Error(
                "Invalid comments response."
            );

        }

        displayComments(
            data.comments
        );

    } catch (error) {

        console.error(
            "STOOT comment loading error:",
            error
        );

        commentsList.innerHTML = `
            <p class="no-comments">
                COMMUNICATION ERROR.
                <br>
                ${escapeHTML(error.message)}
            </p>
        `;

    }

}


// ================================
// DISPLAY COMMENTS
// ================================

function displayComments(comments) {

    if (!commentsList) return;


    // Sort most liked first
    comments.sort((a, b) => {

        const likesA =
            Number(a.likes) || 0;

        const likesB =
            Number(b.likes) || 0;

        if (likesB !== likesA) {

            return likesB - likesA;

        }

        return new Date(
            b.created_at
        ) - new Date(
            a.created_at
        );

    });


    // No comments
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
            comment.name || "UNKNOWN";


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
        // BODY
        // ----------------------------

        const body =
            document.createElement("div");

        body.className =
            "comment-body";

        body.textContent =
            comment.body || "";


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

        likeButton.type =
            "button";

        likeButton.textContent =
            `👍 ${Number(comment.likes) || 0}`;


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
        // CARD
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


        commentsList.appendChild(card);

    });

}


// ================================
// POST COMMENT
// ================================

async function postComment() {

    if (!commentName || !commentBody) {

        console.error(
            "STOOT: comment form not found."
        );

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


    if (name.length > 40) {

        commentMessage.textContent =
            "NAME IS TOO LONG.";

        return;

    }


    if (body.length > 1000) {

        commentMessage.textContent =
            "COMMENT IS TOO LONG.";

        return;

    }


    // ----------------------------
    // BUTTON
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

        const response = await fetch(
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


        console.log(
            "STOOT post response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Could not post comment."
            );

        }


        // ----------------------------
        // SUCCESS
        // ----------------------------

        commentName.value = "";

        commentBody.value = "";


        if (commentMessage) {

            commentMessage.textContent =
                "TRANSMISSION RECEIVED!";

        }


        await loadComments();


    } catch (error) {

        console.error(
            "STOOT posting error:",
            error
        );


        if (commentMessage) {

            commentMessage.textContent =
                error.message ||
                "TRANSMISSION FAILED.";

        }

    } finally {

        if (postCommentButton) {

            postCommentButton.disabled =
                false;

        }

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

        const visitorId =
            getVisitorId();


        const response = await fetch(
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
                        visitorId

                })

            }
        );


        const data =
            await response.json();


        console.log(
            "STOOT like response:",
            data
        );


        if (!response.ok) {

            if (data.alreadyLiked) {

                button.textContent =
                    `👍 ${data.likes}`;

                button.classList.add(
                    "liked"
                );

                return;

            }


            throw new Error(
                data.error ||
                "Could not like comment."
            );

        }


        button.textContent =
            `👍 ${data.likes}`;

        button.classList.add(
            "liked"
        );


        // Reload so most-liked comments
        // move to the top.

        await loadComments();


    } catch (error) {

        console.error(
            "STOOT like error:",
            error
        );


        alert(
            error.message ||
            "Could not like comment."
        );

    } finally {

        button.disabled =
            false;

    }

}


// ================================
// FORMAT DATE
// ================================

function formatCommentDate(
    dateString
) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(dateString);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

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


// ================================
// ESCAPE ERROR TEXT
// ================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        String(text);

    return div.innerHTML;

}


// ================================
// EVENTS
// ================================

if (postCommentButton) {

    postCommentButton.addEventListener(
        "click",
        postComment
    );

} else {

    console.error(
        "STOOT: POST COMMENT button not found."
    );

}


// ================================
// START
// ================================

if (commentsList) {

    loadComments();

}
