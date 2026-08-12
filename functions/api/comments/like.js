// ========================================
// STOOT COMMENT LIKE API
// ========================================

export async function onRequestPost({ request, env }) {

    try {

        const data = await request.json();

        const commentId = Number(data.comment_id);

        const fingerprint = String(data.fingerprint || "")
            .trim()
            .slice(0, 200);


        // -----------------------------
        // VALIDATE COMMENT ID
        // -----------------------------

        if (!Number.isInteger(commentId) || commentId <= 0) {

            return json({
                success: false,
                error: "Invalid comment."
            }, 400);

        }


        // -----------------------------
        // VALIDATE FINGERPRINT
        // -----------------------------

        if (!fingerprint) {

            return json({
                success: false,
                error: "Visitor identification is required."
            }, 400);

        }


        // -----------------------------
        // CHECK COMMENT EXISTS
        // -----------------------------

        const comment = await env.DB.prepare(`
            SELECT id, likes
            FROM comments
            WHERE id = ?
        `)
        .bind(commentId)
        .first();


        if (!comment) {

            return json({
                success: false,
                error: "Comment not found."
            }, 404);

        }


        // -----------------------------
        // CHECK IF ALREADY LIKED
        // -----------------------------

        const existing = await env.DB.prepare(`
            SELECT comment_id
            FROM comment_likes
            WHERE comment_id = ?
            AND fingerprint = ?
        `)
        .bind(commentId, fingerprint)
        .first();


        if (existing) {

            return json({
                success: false,
                alreadyLiked: true,
                likes: comment.likes,
                error: "You already liked this comment."
            }, 409);

        }


        // -----------------------------
        // SAVE LIKE
        // -----------------------------

        await env.DB.prepare(`
            INSERT INTO comment_likes
            (comment_id, fingerprint)
            VALUES (?, ?)
        `)
        .bind(commentId, fingerprint)
        .run();


        // -----------------------------
        // INCREASE LIKE COUNT
        // -----------------------------

        await env.DB.prepare(`
            UPDATE comments
            SET likes = likes + 1
            WHERE id = ?
        `)
        .bind(commentId)
        .run();


        // -----------------------------
        // GET NEW LIKE COUNT
        // -----------------------------

        const updated = await env.DB.prepare(`
            SELECT likes
            FROM comments
            WHERE id = ?
        `)
        .bind(commentId)
        .first();


        return json({
            success: true,
            likes: updated ? updated.likes : 0
        });


    } catch (error) {

        console.error(error);

        return json({
            success: false,
            error: "Could not like comment."
        }, 500);

    }

}


// ========================================
// JSON RESPONSE
// ========================================

function json(data, status = 200) {

    return new Response(
        JSON.stringify(data),
        {
            status,
            headers: {
                "Content-Type":
                    "application/json; charset=utf-8",

                "Cache-Control":
                    "no-store"
            }
        }
    );

}