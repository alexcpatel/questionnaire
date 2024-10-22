import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Questionnaire, AnswerSet, fetchUserQuestionnairesAndAnswerSets } from "@/lib/supabase";

export function QuestionnaireSelector() {
    const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
    const [answerSets, setAnswerSets] = useState<AnswerSet[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await fetchUserQuestionnairesAndAnswerSets();
                setQuestionnaires(data.questionnaires);
                setAnswerSets(data.answerSets);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }

        fetchData();
    }, []);

    const getQuestionnaireStatus = (questionnaire: Questionnaire) => {
        const answerSet = answerSets.find(
            (answerSet) => answerSet.questionnaire_id === questionnaire.id,
        );
        return answerSet ? (
            <span className="flex items-center text-green-600">
                Completed
                <Check className="ml-1 size-4" />
            </span>
        ) : (
            <span className="flex items-center text-red-600">
                <Link href={`/questionnaire/${questionnaire.id}`}>Not Completed</Link>
                <ChevronRight className="ml-1 size-4" />
            </span>
        );
    };

    return (
        <Table className="w-[500px]">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[150px]">Questionnaire</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {questionnaires.map((questionnaire) => (
                    <TableRow key={questionnaire.id}>
                        <TableCell className="font-medium">{questionnaire.name}</TableCell>
                        <TableCell>{getQuestionnaireStatus(questionnaire)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
