# Questionnaire Application

This is a Next.js-based web application for managing and answering questionnaires. It includes features for user authentication, questionnaire selection, and an admin panel for viewing user responses.

## Demo

[![Questionnaire Demo](https://img.youtube.com/vi/uLdKaj_ffao/0.jpg)](https://www.youtube.com/watch?v=uLdKaj_ffao)

## Features

-   User authentication (login/logout)
-   Questionnaire selection and submission
-   Admin panel for viewing user responses
-   Dark mode support
-   Responsive design with mobile sidebar

## Technologies Used

-   Next.js 15.0.0
-   React 18.2.0
-   TypeScript
-   Tailwind CSS
-   Shadcn UI components
-   Supabase for backend and authentication
-   Radix UI components
-   React Hook Form for form handling
-   Zod for schema validation

## Getting Started

1. Clone the repository
2. Install dependencies:
    ```
    npm install
    ```
3. Set up environment variables:
   Create a `.env.local` file in the root directory and add the following:
    ```
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
4. Run the development server:
    ```
    npm run dev
    ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

-   `src/app`: Next.js app router pages
-   `src/components`: React components
-   `src/lib`: Utility functions and Supabase client
-   `src/hooks`: Custom React hooks

## Data

The data is stored in Supabase. Foreign keys are used for querying data across tables. Policies are used for authorization, such as only allowing users to see their own data, or admins to see all data. Row level security is used to protect sensitive data.

## Database Structure and Functions

The application uses Supabase as its backend, leveraging PostgreSQL for data storage and management. The database design incorporates the following security and relational features:

-   **Foreign Keys**: Used to establish relationships between tables, ensuring data integrity and enabling efficient cross-table queries.
-   **Row-Level Security (RLS)**: Implemented to protect sensitive data by controlling access at the row level.
-   **Authorization Policies**: Configured to manage user permissions, such as restricting users to view only their own data while allowing admins full access.

### Key Database Functions

#### 1. Get Questionnaire Count

This function retrieves the count of distinct questionnaires answered by each user.

```sql
CREATE FUNCTION public.get_questionnaire_count()
RETURNS TABLE(user_id uuid, email text, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.user_id,
    u.email,
    COUNT(DISTINCT a.questionnaire_id) AS count
  FROM
    public.user_roles u
  LEFT JOIN
    public.answer_sets a ON a.user_id = u.user_id
  WHERE
    'user' = ANY(u.roles)
  GROUP BY
    u.user_id, u.email
  ORDER BY
    u.email ASC;
END;
$$;
```

#### 2. Submit Questionnaire Answers

This function handles the submission of questionnaire answers, inserting both the answer set and individual answers in a single transaction.

```sql
CREATE FUNCTION public.submit_questionnaire_answers(p_answer_set json, p_answers json[])
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_answer_set_id bigint;
  v_questionnaire_id bigint;
  v_user_id UUID;
  v_answer JSON;
  v_question_id bigint;
  v_answer_data JSON;
BEGIN
  -- Extract values from JSON
  v_questionnaire_id := (p_answer_set->>'questionnaire_id')::bigint;
  v_user_id := (p_answer_set->>'user_id')::UUID;

  -- Insert the answer set
  INSERT INTO public.answer_sets (questionnaire_id, user_id)
  VALUES (v_questionnaire_id, v_user_id)
  RETURNING id INTO v_answer_set_id;

  -- Insert all answers
  FOREACH v_answer IN ARRAY p_answers
  LOOP
    v_question_id := (v_answer->>'question_id')::bigint;
    v_answer_data := (v_answer->>'answer')::JSON;
    INSERT INTO public.answers (user_id, answer_set_id, question_id, answer)
    VALUES (v_user_id, v_answer_set_id, v_question_id, v_answer_data);
  END LOOP;

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
