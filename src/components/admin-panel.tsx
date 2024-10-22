import { ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminUserData } from "@/components/admin-user-data";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { QuestionnaireCount, fetchAdminQuestionnaireCounts } from "@/lib/supabase";

export function AdminPanel() {
    const [questionnaireCounts, setQuestionnaireCounts] = useState<QuestionnaireCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await fetchAdminQuestionnaireCounts();
                setQuestionnaireCounts(data);
            } catch (error) {
                console.error("Error fetching data:", error);
                setError(`Error fetching data: ${error}`);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const renderTable = () => (
        <Table className="w-[700px]">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[200px]">User</TableHead>
                    <TableHead>Questionnaires Completed</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {questionnaireCounts.map((questionnaireCount, index) => (
                    <Collapsible asChild key={index}>
                        <>
                            <CollapsibleTrigger asChild>
                                <TableRow>
                                    <TableCell className="font-medium">
                                        {questionnaireCount.email}
                                    </TableCell>
                                    <TableCell>{questionnaireCount.count}</TableCell>
                                    <TableCell id="arrow">
                                        {questionnaireCount.count > 0 && (
                                            <ChevronDownIcon className="size-4 shrink-0 transition-transform duration-200" />
                                        )}
                                    </TableCell>
                                </TableRow>
                            </CollapsibleTrigger>
                            {questionnaireCount.count > 0 && (
                                <CollapsibleContent asChild>
                                    <TableRow>
                                        <TableCell colSpan={3}>
                                            <AdminUserData user_id={questionnaireCount.user_id} />
                                        </TableCell>
                                    </TableRow>
                                </CollapsibleContent>
                            )}
                        </>
                    </Collapsible>
                ))}
            </TableBody>
        </Table>
    );

    return loading ? (
        <Skeleton className="h-[500px] w-full" />
    ) : error ? (
        <span className="text-red-500">{error}</span>
    ) : (
        renderTable()
    );
}
