import { QuestionnaireForm } from "@/components/questionnaire-form";

interface QuestionnairePageProps {
    params: {
        id: string;
    };
}

export default async function QuestionnairePage({ params }: QuestionnairePageProps) {
    const { id } = await params;
    const questionnaireId = parseInt(id, 10);

    if (isNaN(questionnaireId)) {
        return <div>Invalid questionnaire ID</div>;
    }

    return (
        <div className="min-h-screen w-full p-4">
            <QuestionnaireForm id={questionnaireId} />
        </div>
    );
}
