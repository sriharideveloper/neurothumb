import LoginForm from './LoginForm';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to Croissant to save analyses, recover processing runs, and keep thumbnail intelligence tied to your account.',
  alternates: {
    canonical: '/login',
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
