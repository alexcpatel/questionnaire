"use client";

import { QuestionnaireSelector } from "@/components/questionnaire-selector";

export default function Home() {
    return (
        <div>
            <main>
                <h1>Questionnaires</h1>
                <QuestionnaireSelector />
            </main>
        </div>
    );
}
