import { supabase } from "./supabase";

export async function getUserRoles(userId: string) {
    const { data, error } = await supabase
        .from("user_roles")
        .select("roles")
        .eq("user_id", userId)
        .single();

    if (error) throw error;

    return data.roles || [];
}

export function getRedirectPath(roles: Array<string>) {
    if (roles.includes("admin")) {
        return "/admin";
    } else if (roles.includes("user")) {
        return "/questionnaire";
    } else {
        return null;
    }
}
