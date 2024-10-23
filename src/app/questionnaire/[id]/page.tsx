import { QuestionnaireForm } from "@/components/questionnaire-form";

type PageProps = {
    params?: Promise<{ id: string }>;
    searchParams?: Promise<unknown>;
};

export default async function QuestionnairePage({ params }: PageProps) {
    const receivedParams = await params;
    const { id } = receivedParams ?? {};
    if (typeof id !== "string") {
        return <div>Invalid questionnaire ID</div>;
    }
    const questionnaireId = parseInt(id, 10);

    if (isNaN(questionnaireId)) {
        return <div>Invalid questionnaire ID</div>;
    }

    return (
        <div className="min-h-screen w-full p-4 pt-16">
            <QuestionnaireForm id={questionnaireId} />
        </div>
    );
}
