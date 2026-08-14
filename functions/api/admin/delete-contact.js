export async function onRequestPost({ request, env }) {
    try {
        const auth = request.headers.get("Authorization");

        if (!auth || !auth.startsWith("Basic ")) {
            return new Response(
                JSON.stringify({
                    error: "Unauthorized"
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type": "application/json",
                        "WWW-Authenticate": 'Basic realm="STOOT Admin"'
                    }
                }
            );
        }

        const encoded = auth.slice(6);

        let decoded;

        try {
            decoded = atob(encoded);
        } catch {
            return new Response(
                JSON.stringify({
                    error: "Invalid credentials."
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const separator = decoded.indexOf(":");

        if (separator === -1) {
            return new Response(
                JSON.stringify({
                    error: "Invalid credentials."
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const username = decoded.slice(0, separator);
        const password = decoded.slice(separator + 1);

        if (
            username !== env.ADMIN_USERNAME ||
            password !== env.ADMIN_PASSWORD
        ) {
            return new Response(
                JSON.stringify({
                    error: "Invalid admin credentials."
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const data = await request.json();

        const contactId = Number(data.contact_id);

        if (!Number.isInteger(contactId) || contactId <= 0) {
            return new Response(
                JSON.stringify({
                    error: "Invalid contact message ID."
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
            `
            DELETE FROM contact_messages
            WHERE id = ?
            `
        )
        .bind(contactId)
        .run();

        if (!result.meta || result.meta.changes === 0) {
            return new Response(
                JSON.stringify({
                    error: "Contact message not found."
                }),
                {
                    status: 404,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                message:
                    "Contact message deleted successfully."
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (error) {

        console.error(
            "Delete contact error:",
            error
        );

        return new Response(
            JSON.stringify({
                error:
                    "Unable to delete contact message."
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