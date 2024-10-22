# Questionnaire Application

This is a Next.js-based web application for managing and answering questionnaires. It includes features for user authentication, questionnaire selection, and an admin panel for viewing user responses.

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
