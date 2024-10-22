"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FieldValues, Form, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { fetchQuestionnaireDataById, Question, Questionnaire, Answer } from "@/lib/supabase";

export function QuestionnaireForm({ id }: { id: number }) {
    const router = useRouter();

    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [lastAnswers, setLastAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadQuestionnaireData() {
            try {
                const data = await fetchQuestionnaireDataById(id);
                console.log(data);
                setQuestionnaire(data.questionnaire);
                setQuestions(data.questions);
                setLastAnswers(data.lastAnswers);
                setLoading(false);
            } catch (error) {
                setError(`Failed to load questionnaire data: ${error}`);
                console.error("Failed to load questionnaire data:", error);
                setLoading(false);
            }
        }

        loadQuestionnaireData();
    }, [id]);

    const QUESTION_TYPES = {
        text: {
            formSchema: () =>
                z.string().min(1, {
                    message: "Answer must not be empty.",
                }),
            fromAnswer: (answer: Answer) => answer?.answer?.text ?? "",
            defaultValue: "",
            renderInput: (question: Question, field: FieldValues) => (
                <Input placeholder="answer" {...field} />
            ),
        },
        mcq: {
            formSchema: () =>
                z.array(z.string()).refine((value) => value.some((item) => item), {
                    message: "At least one answer is required.",
                }),
            fromAnswer: (answer: Answer) => answer?.answer?.options ?? [],
            defaultValue: [],
            renderInput: (question: Question, field: FieldValues) => (
                <>
                    {(question.question?.options ?? []).map((option, index) => (
                        <Checkbox
                            key={index}
                            checked={field.value?.includes(option)}
                            onCheckedChange={(checked) => {
                                return checked
                                    ? field.onChange([...field.value, option])
                                    : field.onChange(
                                          field.value?.filter((value: string) => value !== option),
                                      );
                            }}
                        />
                    ))}
                </>
            ),
        },
    };

    const formSchema = z.object(
        questions.reduce(
            (acc, question) => {
                const type = question.question.type;
                if (type in QUESTION_TYPES) {
                    acc[question.id.toString()] =
                        QUESTION_TYPES[type as keyof typeof QUESTION_TYPES].formSchema();
                }
                return acc;
            },
            {} as Record<string, z.ZodTypeAny>,
        ),
    );

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: questions.reduce(
            (acc, question, index) => {
                const type = question.question.type;
                if (type in QUESTION_TYPES) {
                    const typeInfo = QUESTION_TYPES[type as keyof typeof QUESTION_TYPES];
                    acc[question.id.toString()] = lastAnswers[index]
                        ? typeInfo.fromAnswer(lastAnswers[index])
                        : typeInfo.defaultValue;
                }
                return acc;
            },
            {} as Record<string, string | string[]>,
        ),
    });

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        // await submitAnswers(questionnaire.id, answers);
        router.push("/questionnaire");
    };

    const renderInput = (question: Question, field: FieldValues) => {
        const type = question.question.type;
        if (type in QUESTION_TYPES) {
            return QUESTION_TYPES[type as keyof typeof QUESTION_TYPES].renderInput(question, field);
        }
        return <Input placeholder="answer" {...field} />;
    };

    const renderQuestion = (question: Question) => {
        return (
            <FormField
                control={form.control}
                name={question.id.toString()}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{question.question.question ?? ""}</FormLabel>
                        <FormControl>{renderInput(question, field)}</FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    };

    const renderForm = () => {
        return (
            <>
                <h1 className="mb-6 text-2xl font-bold">{questionnaire?.name}</h1>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                        {questions.map((question) => renderQuestion(question))}
                        <Button type="submit">Submit</Button>
                    </form>
                </Form>
            </>
        );
    };

    return (
        <>
            {loading ? (
                <div className="flex items-center justify-center">
                    <Loader2 className="size-4 animate-spin" />
                </div>
            ) : error ? (
                <div className="text-red-500">{error}</div>
            ) : (
                renderForm()
            )}
        </>
    );
}
