export async function onRequestPost(context) {

    try {

        const env =
            context.env;


        const auth =
            context.request.headers.get(
                "Authorization"
            );


        if (
            !auth ||
            !auth.startsWith("Basic ")
        ) {

            return new Response(
                JSON.stringify({
                    error: "Unauthorized"
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type":
                            "application/json",

                        "WWW-Authenticate":
                            'Basic realm="STOOT Admin"'
                    }
                }
            );

        }


        const encoded =
            auth.substring(6);


        let decoded;


        try {

            decoded =
                atob(encoded);

        } catch {

            return new Response(
                JSON.stringify({
                    error:
                        "Invalid authorization"
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        }


        const separator =
            decoded.indexOf(":");


        if (separator === -1) {

            return new Response(
                JSON.stringify({
                    error:
                        "Invalid authorization"
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        }


        const username =
            decoded.substring(
                0,
                separator
            );


        const password =
            decoded.substring(
                separator + 1
            );


        if (
            username !==
                env.ADMIN_USERNAME ||
            password !==
                env.ADMIN_PASSWORD
        ) {

            return new Response(
                JSON.stringify({
                    error:
                        "Invalid admin credentials"
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        }


        const data =
            await context.request.json();


        const commentId =
            Number(data.comment_id);


        if (
            !Number.isInteger(commentId) ||
            commentId <= 0
        ) {

            return new Response(
                JSON.stringify({
                    error:
                        "Invalid comment ID"
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        }


        const result =
            await env.DB.prepare(`
                DELETE FROM comments
                WHERE id = ?
            `)
            .bind(commentId)
            .run();


        if (!result.success) {

            throw new Error(
                "Database delete failed"
            );

        }


        return new Response(
            JSON.stringify({
                success: true
            }),
            {
                status: 200,
                headers: {
                    "Content-Type":
                        "application/json"
                }
            }
        );


    } catch (error) {

        console.error(
            "STOOT delete comment error:",
            error
        );


        return new Response(
            JSON.stringify({
                error:
                    "Server error"
            }),
            {
                status: 500,
                headers: {
                    "Content-Type":
                        "application/json"
                }
            }
        );

    }

}