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
    id: number;
    questionnaire_id: number;
    user_id: string;
    created_at: string | null;
};

export type Answer = {
    id: number;
    user_id: string;
    question_id: number;
    answer: {
        text: string | null;
        options: Array<string> | null;
    };
};

export type InsertAnswerSet = Omit<AnswerSet, "id" | "created_at">;
export type InsertAnswer = Omit<Answer, "id" | "user_id">;

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

    return await fetchQuestionnaireDataByIdAndUser(id, user.id);
}

export async function fetchQuestionnaireDataByIdAndUser(
    id: number,
    user_id: string,
    skip_answered: boolean = true,
) {
    if (skip_answered) {
        const { data: answerSets, error: answerSetsError } = await supabase
            .from("answer_sets")
            .select("*")
            .eq("user_id", user_id)
            .eq("questionnaire_id", id);

        if (answerSetsError) {
            throw new Error(`Error fetching answer sets: ${answerSetsError.message}`);
        }
        if (answerSets.length > 0) {
            throw new Error("Questionnaire already answered");
        }
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
    const answers: Answer[] = [];

    for (const item of typedQuestionData) {
        questions.push({
            id: item.question_id,
            question: item.questions.question,
        });

        const { data: answerData, error: answerError } = await supabase
            .from("answers")
            .select(
                `
                *,
                answer_sets:answer_sets (created_at)
            `,
            )
            .eq("user_id", user_id)
            .eq("question_id", item.question_id)
            .order("answer_sets(created_at)", { ascending: false })
            .limit(1)
            .single();

        if (answerError && answerError.code !== "PGRST116") {
            // PGRST116 is the error code for "no rows returned", which is fine (unanswered question)
            throw new Error(`Error fetching answer: ${answerError.message}`);
        }

        answers.push(answerData || null);
    }

    return { questionnaire, questions, answers };
}

export async function submitQuestionnaireAnswers(
    questionnaireId: number,
    insertAnswers: InsertAnswer[],
) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("No authenticated user found");
    }

    const insertAnswerSet: InsertAnswerSet = {
        questionnaire_id: questionnaireId,
        user_id: user.id,
    };

    const { data, error } = await supabase.rpc("submit_questionnaire_answers", {
        p_answer_set: insertAnswerSet,
        p_answers: insertAnswers,
    });

    if (error) {
        throw new Error(`Error submitting answers: ${error.message}`);
    }

    return data;
}

export type QuestionnaireCount = {
    user_id: string;
    email: string;
    count: number;
};

export async function fetchAdminQuestionnaireCounts() {
    const { data, error } = await supabase.rpc("get_questionnaire_count");

    if (error && error.code !== "PGRST116") {
        throw new Error(`Error fetching user data: ${error.message}`);
    }

    return data;
}

export type UserData = {
    answerSet: AnswerSet;
    questionnaire: Questionnaire;
    questions: Question[];
    answers: Answer[];
};

export async function fetchAdminUserData(user_id: string) {
    const { data: userAnswerSets, error: answerSetsError } = await supabase
        .from("answer_sets")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });

    if (answerSetsError) {
        throw new Error(`Error fetching answer sets: ${answerSetsError.message}`);
    }

    const userQuestionnaireData = [];
    for (const answerSet of userAnswerSets) {
        const questionnaireData = await fetchQuestionnaireDataByIdAndUser(
            answerSet.questionnaire_id,
            user_id,
            false, // skip_answered
        );
        userQuestionnaireData.push({
            answerSet,
            ...questionnaireData,
        });
    }

    return userQuestionnaireData;
}
