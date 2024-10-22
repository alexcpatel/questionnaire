import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase, Questionnaire } from "@/lib/supabase";

export function QuestionnaireSelector() {
    const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);

    useEffect(() => {
        async function fetchQuestionnaires() {
            const { data, error } = await supabase.from("questionnaires").select("*");

            if (error) {
                console.error("Error fetching questionnaires:", error);
            } else {
                setQuestionnaires(data || []);
            }
        }

        fetchQuestionnaires();
    }, []);

    return (
        <div>
            {questionnaires.map((questionnaire) => (
                <Link href={`/questionnaire/${questionnaire.id}`} key={questionnaire.id}>
                    {questionnaire.name}
                </Link>
            ))}
        </div>
    );
}
