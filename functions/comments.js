// ========================================
// STOOT COMMENTS API
// Cloudflare Pages Functions + D1
// ========================================


// ========================================
// GET COMMENTS
// ========================================

export async function onRequestGet({ env }) {

    try {

        const { results } = await env.DB.prepare(`
            SELECT
                id,
                name,
                body,
                likes,
                created_at,
                admin_reply
            FROM comments
            ORDER BY likes DESC, created_at DESC
        `).all();

        return json({
            success: true,
            comments: results || []
        });

    } catch (error) {

        console.error(error);

        return json({
            success: false,
            error: "Could not load comments."
        }, 500);

    }
}


// ========================================
// POST COMMENT
// ========================================

export async function onRequestPost({ request, env }) {

    try {

        const data = await request.json();

        const name = String(data.name || "")
            .trim()
            .slice(0, 40);

        const body = String(data.body || "")
            .trim()
            .slice(0, 1000);


        if (!name || !body) {

            return json({
                success: false,
                error: "Name and comment are required."
            }, 400);

        }


        if (name.length < 2) {

            return json({
                success: false,
                error: "Name is too short."
            }, 400);

        }


        if (body.length < 2) {

            return json({
                success: false,
                error: "Comment is too short."
            }, 400);

        }


        const result = await env.DB.prepare(`
            INSERT INTO comments
            (name, body)
            VALUES (?, ?)
        `)
        .bind(name, body)
        .run();


        return json({
            success: true,
            id: result.meta.last_row_id
        }, 201);

    } catch (error) {

        console.error(error);

        return json({
            success: false,
            error: "Could not post comment."
        }, 500);

    }
}


// ========================================
// LIKE COMMENT
// ========================================

export async function onRequestPostLike({ request, env }) {

    try {

        const data = await request.json();

        const commentId = Number(data.comment_id);
        const fingerprint = String(data.fingerprint || "")
            .trim()
            .slice(0, 200);


        if (!Number.isInteger(commentId) || commentId <= 0) {

            return json({
                success: false,
                error: "Invalid comment."
            }, 400);

        }


        if (!fingerprint) {

            return json({
                success: false,
                error: "Visitor identification is required."
            }, 400);

        }


        const existing = await env.DB.prepare(`
            SELECT comment_id
            FROM comment_likes
            WHERE comment_id = ?
            AND fingerprint = ?
        `)
        .bind(commentId, fingerprint)
        .first();


        if (existing) {

            const comment = await env.DB.prepare(`
                SELECT likes
                FROM comments
                WHERE id = ?
            `)
            .bind(commentId)
            .first();


            return json({
                success: false,
                alreadyLiked: true,
                likes: comment ? comment.likes : 0,
                error: "You already liked this comment."
            }, 409);

        }


        const comment = await env.DB.prepare(`
            SELECT id
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


        await env.DB.prepare(`
            INSERT INTO comment_likes
            (comment_id, fingerprint)
            VALUES (?, ?)
        `)
        .bind(commentId, fingerprint)
        .run();


        await env.DB.prepare(`
            UPDATE comments
            SET likes = likes + 1
            WHERE id = ?
        `)
        .bind(commentId)
        .run();


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
// ADMIN ACTIONS
// ========================================

export async function onRequestPut({ request, env }) {

    try {

        const data = await request.json();

        const password = String(data.password || "");

        const action = String(data.action || "");

        const commentId = Number(data.comment_id);


        // -----------------------------
        // CHECK ADMIN PASSWORD
        // -----------------------------

        if (!env.ADMIN_PASSWORD) {

            return json({
                success: false,
                error: "Admin password is not configured."
            }, 500);

        }


        if (password !== env.ADMIN_PASSWORD) {

            return json({
                success: false,
                error: "Incorrect admin password."
            }, 401);

        }


        if (!Number.isInteger(commentId) || commentId <= 0) {

            return json({
                success: false,
                error: "Invalid comment."
            }, 400);

        }


        // -----------------------------
        // ADMIN REPLY
        // -----------------------------

        if (action === "reply") {

            const reply = String(data.reply || "")
                .trim()
                .slice(0, 2000);


            if (!reply) {

                return json({
                    success: false,
                    error: "Reply cannot be empty."
                }, 400);

            }


            const result = await env.DB.prepare(`
                UPDATE comments
                SET admin_reply = ?
                WHERE id = ?
            `)
            .bind(reply, commentId)
            .run();


            if (!result.meta.changes) {

                return json({
                    success: false,
                    error: "Comment not found."
                }, 404);

            }


            return json({
                success: true,
                message: "Admin reply saved."
            });

        }


        // -----------------------------
        // DELETE COMMENT
        // -----------------------------

        if (action === "delete") {

            const result = await env.DB.prepare(`
                DELETE FROM comments
                WHERE id = ?
            `)
            .bind(commentId)
            .run();


            if (!result.meta.changes) {

                return json({
                    success: false,
                    error: "Comment not found."
                }, 404);

            }


            return json({
                success: true,
                message: "Comment deleted."
            });

        }


        // -----------------------------
        // INVALID ACTION
        // -----------------------------

        return json({
            success: false,
            error: "Unknown admin action."
        }, 400);


    } catch (error) {

        console.error(error);

        return json({
            success: false,
            error: "Admin action failed."
        }, 500);

    }
}


// ========================================
// JSON RESPONSE HELPER
// ========================================

function json(data, status = 200) {

    return new Response(
        JSON.stringify(data),
        {
            status,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "no-store"
            }
        }
    );

}
