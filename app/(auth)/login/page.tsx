import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoginForm } from './_components/login-form';

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Masuk ke Bimbingo</CardTitle>
        <CardDescription>
          Gunakan email & password admin Anda, atau minta tautan masuk lewat email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginFormWrapper searchParams={searchParams} />
      </CardContent>
    </Card>
  );
}

async function LoginFormWrapper({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm initialNext={params.next} initialError={params.error} />;
}
