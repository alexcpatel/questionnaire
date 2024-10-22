"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getUserRoles, getRedirectPath } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const formSchema = z.object({
    email: z.string().min(1, {
        message: "Email must not be empty.",
    }),
    password: z.string().min(1, {
        message: "Password must not be empty.",
    }),
});

export function LoginForm() {
    const [loginError, setLoginError] = useState<string | null>(null);
    const router = useRouter();

    const checkRedirect = useCallback(async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (session) {
            try {
                const roles = await getUserRoles(session.user.id);
                const redirectPath = getRedirectPath(roles);

                if (redirectPath) {
                    router.push(redirectPath);
                } else {
                    console.error("User has no valid role assigned");
                    setLoginError("User has no valid role assigned");
                }
            } catch (error) {
                console.error("Error fetching user roles:", error);
                setLoginError(`Error fetching user roles ${error}`);
            }
        }
    }, [router]);

    useEffect(() => {
        checkRedirect();
    }, [checkRedirect]);

    const handleLogin = async ({ email, password }: z.infer<typeof formSchema>) => {
        setLoginError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;

            await checkRedirect();
        } catch (error) {
            console.error("Error logging in:", error);
            setLoginError("Invalid email or password. Please try again.");
        }
    };

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>Login</CardTitle>
            </CardHeader>
            <CardContent>
                {loginError && <p className="mb-4 text-red-500">{loginError}</p>}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="user@example.com"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">Submit</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
