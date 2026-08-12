export async function onRequestGet({ env }) {
    try {
        const { results } = await env.DB.prepare(
            `SELECT id, name, body, likes, created_at, admin_reply
             FROM comments
             ORDER BY likes DESC, created_at DESC`
        ).all();

        return new Response(
            JSON.stringify({ comments: results || [] }),
            {
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                }
            }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: "Could not load comments." }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
}

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
            return new Response(
                JSON.stringify({
                    error: "Name and comment are required."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const result = await env.DB.prepare(
            `INSERT INTO comments (name, body)
             VALUES (?, ?)`
        )
        .bind(name, body)
        .run();

        return new Response(
            JSON.stringify({
                success: true,
                id: result.meta.last_row_id
            }),
            {
                status: 201,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({
                error: "Could not post comment."
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
}