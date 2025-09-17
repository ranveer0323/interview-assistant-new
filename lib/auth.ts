import { auth } from "@clerk/nextjs/server";

export const getUserId = async (): Promise<string | null> => {

    try {
        const { userId } = await auth();
         
        // TODO: Redirect unauthenticated users to sign in
        if (!userId) {
            throw new Error("User is not authenticated");
        }

        return userId || null;
    } catch (error) {
        console.error("Error getting user ID:", error);
        return null;
    }

}