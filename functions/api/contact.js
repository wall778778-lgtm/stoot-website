export async function onRequestGet({ request, env }) {
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

        const { results } = await env.DB.prepare(
            `
            SELECT
                id,
                name,
                email,
                subject,
                message,
                created_at
            FROM contact_messages
            ORDER BY created_at DESC
            `
        ).all();

        return new Response(
            JSON.stringify({
                messages: results || []
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (error) {

        console.error("Contact GET error:", error);

        return new Response(
            JSON.stringify({
                error: "Unable to load contact messages."
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


export async function onRequestPost({ request, env }) {
    try {
        const data = await request.json();

        const name = String(data.name || "").trim();
        const email = String(data.email || "").trim();
        const subject = String(data.subject || "").trim();
        const message = String(data.message || "").trim();

        if (!name || !email || !subject || !message) {
            return new Response(
                JSON.stringify({
                    error: "Please fill in all fields."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        if (
            name.length > 100 ||
            email.length > 200 ||
            subject.length > 200 ||
            message.length > 5000
        ) {
            return new Response(
                JSON.stringify({
                    error: "One or more fields are too long."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return new Response(
                JSON.stringify({
                    error: "Please enter a valid email address."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        await env.DB.prepare(
            `
            INSERT INTO contact_messages
            (name, email, subject, message)
            VALUES (?, ?, ?, ?)
            `
        )
        .bind(
            name,
            email,
            subject,
            message
        )
        .run();

        return new Response(
            JSON.stringify({
                success: true,
                message:
                    "Your message has been sent successfully."
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (error) {

        console.error("Contact POST error:", error);

        return new Response(
            JSON.stringify({
                error:
                    "Unable to send your message right now."
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
