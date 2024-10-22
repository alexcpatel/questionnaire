import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);

export type Questionnaire = {
    id: number;
    name: string;
};

export type Question = {
    id: number;
    question: {
        type: string;
        options: Array<string> | null;
        question: string;
    };
};

export type QuestionnaireJunction = {
    id: number;
    questionnaire_id: number;
    question_id: number;
    priority: number;
};

export type AnswerSet = {
    id: number | null;
    questionnaire_id: number;
    user_id: string;
    created_at: string | null;
};

export type Answer = {
    id: number | null;
    user_id: string | null;
    question_id: number;
    answer: {
        text: string | null;
        options: Array<string> | null;
    };
};

export async function fetchUserQuestionnairesAndAnswerSets() {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("No authenticated user found");
    }

    const { data: questionnaires, error: questionnairesError } = await supabase
        .from("questionnaires")
        .select("*");

    if (questionnairesError) {
        throw new Error(`Error fetching questionnaires: ${questionnairesError.message}`);
    }

    const { data: answerSets, error: answerSetsError } = await supabase
        .from("answer_sets")
        .select("*")
        .eq("user_id", user.id);

    if (answerSetsError) {
        throw new Error(`Error fetching answer sets: ${answerSetsError.message}`);
    }

    return { questionnaires, answerSets };
}

export async function fetchQuestionnaireDataById(id: number) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("No authenticated user found");
    }

    const { data: questionnaire, error: questionnaireError } = await supabase
        .from("questionnaires")
        .select("*")
        .eq("id", id)
        .single();

    if (questionnaireError) {
        throw new Error(`Error fetching questionnaire: ${questionnaireError.message}`);
    }

    type QuestionDataItem = {
        question_id: number;
        priority: number;
        questions: {
            question: {
                type: string;
                options: Array<string> | null;
                question: string;
            };
        };
    };

    const { data: questionData, error: questionError } = await supabase
        .from("questionnaire_junctions")
        .select(
            `
            question_id,
            priority,
            questions (question)
        `,
        )
        .eq("questionnaire_id", id)
        .order("priority", { ascending: true });

    if (questionError) {
        throw new Error(`Error fetching questions: ${questionError.message}`);
    }

    const typedQuestionData = questionData as unknown as QuestionDataItem[];
    const questions: Question[] = [];
    const lastAnswers: Answer[] = [];

    for (const item of typedQuestionData) {
        questions.push({
            id: item.question_id,
            question: item.questions.question,
        });

        const { data: answerData, error: answerError } = await supabase
            .from("answers")
            .select("*")
            .eq("user_id", user.id)
            .eq("question_id", item.question_id)
            .single();

        if (answerError && answerError.code !== "PGRST116") {
            // PGRST116 is the error code for "no rows returned", which is fine (unanswered question)
            throw new Error(`Error fetching answer: ${answerError.message}`);
        }

        lastAnswers.push(answerData || null);
    }

    return { questionnaire, questions, lastAnswers };
}

export async function submitQuestionnaireAnswers(questionnaireId: number, answers: Answer[]) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("No authenticated user found");
    }

    const answerSet = {
        questionnaire_id: questionnaireId,
        user_id: user.id,
    };

    const { data, error } = await supabase.rpc("submit_questionnaire_answers", {
        p_answer_set: answerSet,
        p_answers: answers,
    });

    if (error) {
        throw new Error(`Error submitting answers: ${error.message}`);
    }

    return data;
}
