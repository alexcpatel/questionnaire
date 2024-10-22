"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Question,
    Questionnaire,
    Answer,
    fetchQuestionnaireDataById,
    submitQuestionnaireAnswers,
} from "@/lib/supabase";

const QUESTION_TYPES = {
    input: {
        formSchema: () =>
            z.string().min(1, {
                message: "Answer must not be empty.",
            }),
        fromAnswer: (answer: Answer) => answer?.answer?.text ?? "",
        defaultValue: "",
    },
    mcq: {
        formSchema: () =>
            z.array(z.string()).refine((value) => value.some((item) => item), {
                message: "At least one answer is required.",
            }),
        fromAnswer: (answer: Answer) => answer?.answer?.options ?? [],
        defaultValue: [],
    },
};

export function QuestionnaireForm({ id }: { id: number }) {
    const router = useRouter();

    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formSchema, setFormSchema] = useState<z.ZodObject<z.ZodRawShape>>(z.object({}));

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {},
    });

    useEffect(() => {
        async function loadQuestionnaireData() {
            try {
                const data = await fetchQuestionnaireDataById(id);
                console.log(data);
                setQuestionnaire(data.questionnaire);
                setQuestions(data.questions);

                const newFormSchema = z.object(
                    data.questions.reduce(
                        (acc, question) => {
                            const type = question?.question?.type;
                            if (type in QUESTION_TYPES) {
                                acc[question?.id?.toString() ?? ""] =
                                    QUESTION_TYPES[
                                        type as keyof typeof QUESTION_TYPES
                                    ].formSchema();
                            }
                            return acc;
                        },
                        {} as Record<string, z.ZodTypeAny>,
                    ),
                );

                const defaultValues = data.questions.reduce(
                    (acc, question, index) => {
                        const type = question?.question?.type;
                        if (type in QUESTION_TYPES) {
                            const typeInfo = QUESTION_TYPES[type as keyof typeof QUESTION_TYPES];
                            acc[question?.id?.toString() ?? ""] = data.lastAnswers[index]
                                ? typeInfo.fromAnswer(data.lastAnswers[index])
                                : typeInfo.defaultValue;
                        }
                        return acc;
                    },
                    {} as Record<string, string | string[]>,
                );

                setFormSchema(newFormSchema);
                form.reset(defaultValues);
                setLoading(false);
            } catch (error) {
                setError(`Failed to load questionnaire data: ${error}`);
                console.error("Failed to load questionnaire data:", error);
                setLoading(false);
            }
        }

        loadQuestionnaireData();
    }, [id, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!questionnaire) return;
        console.log({ values });
        const answers = questions.map((question) => {
            const type = question?.question?.type;
            if (type == "mcq") {
                return {
                    question_id: question.id,
                    answer: {
                        options: values[question.id],
                    },
                };
            } else {
                return {
                    question_id: question.id,
                    answer: {
                        text: values[question.id],
                    },
                };
            }
        });
        await submitQuestionnaireAnswers(questionnaire.id, answers);
        router.push("/questionnaire");
    };

    const renderQuestion = (question: Question) => {
        const type = question?.question?.type;
        if (type == "mcq") {
            const options = question?.question?.options ?? [];
            return (
                <div key={question?.id} className="space-y-1.5">
                    <FormLabel className="mb-4 block">
                        {question?.question?.question ?? ""}
                    </FormLabel>
                    {options.map((option, index) => (
                        <FormField
                            key={index}
                            control={form.control}
                            name={question?.id?.toString() ?? ""}
                            render={({ field }) => {
                                return (
                                    <FormItem
                                        key={index}
                                        className="flex flex-row items-center space-x-2"
                                    >
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(option)}
                                                onCheckedChange={(checked) => {
                                                    return checked
                                                        ? field.onChange([...field.value, option])
                                                        : field.onChange(
                                                              field.value?.filter(
                                                                  (value: string) =>
                                                                      value !== option,
                                                              ),
                                                          );
                                                }}
                                            />
                                        </FormControl>
                                        <FormLabel
                                            className="text-sm font-normal leading-none"
                                            style={{ marginTop: 0 }}
                                        >
                                            {option}
                                        </FormLabel>
                                    </FormItem>
                                );
                            }}
                        />
                    ))}
                </div>
            );
        }

        return (
            <FormField
                key={question?.id}
                control={form.control}
                name={question?.id?.toString() ?? ""}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="mb-4 block">
                            {question?.question?.question ?? ""}
                        </FormLabel>
                        <FormControl>
                            <Input placeholder="answer" {...field} />
                        </FormControl>
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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
