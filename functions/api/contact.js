export async function onRequestPost({ request, env }) {
    try {
        const data = await request.json();

        const name = String(data.name || "").trim();
        const email = String(data.email || "").trim();
        const subject = String(data.subject || "").trim();
        const message = String(data.message || "").trim();

        // Validate required fields
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

        // Basic length limits
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

        // Basic email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

        // Save message to the D1 database
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
                message: "Your message has been sent successfully."
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (error) {

        console.error("Contact form error:", error);

        return new Response(
            JSON.stringify({
                error: "Unable to send your message right now."
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