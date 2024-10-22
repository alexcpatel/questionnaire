import { Fragment, useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { UserData, fetchAdminUserData } from "@/lib/supabase";

export function AdminUserData({ user_id }: { user_id: string }) {
    const [userData, setUserData] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await fetchAdminUserData(user_id);
                setUserData(data);
            } catch (error) {
                console.error("Error fetching data:", error);
                setError(`Error fetching data: ${error}`);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user_id]);

    const renderTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Questionnaire</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Answer</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {userData.map((data, data_idx) => (
                    <Fragment key={data_idx}>
                        {data.questions.map((question, question_idx) => (
                            <TableRow key={question_idx}>
                                <TableCell>{data.questionnaire.name}</TableCell>
                                <TableCell>{question.question.question}</TableCell>
                                <TableCell>
                                    {question.question.type === "mcq"
                                        ? data.answers[question_idx].answer.options?.join(", ")
                                        : data.answers[question_idx].answer.text}
                                </TableCell>
                            </TableRow>
                        ))}
                    </Fragment>
                ))}
            </TableBody>
        </Table>
    );

    return loading ? (
        <div className="space-y-3">
            <Skeleton key={0} className="h-[60px] w-full" />
            <Skeleton key={1} className="h-[60px] w-full" />
            <Skeleton key={2} className="h-[60px] w-full" />
            <Skeleton key={3} className="h-[60px] w-full" />
        </div>
    ) : error ? (
        <span className="text-red-500">{error}</span>
    ) : (
        renderTable()
    );
}
