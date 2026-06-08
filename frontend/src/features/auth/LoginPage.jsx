import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { authApi } from '../../api/authApi.js';
import { setupApi } from '../../api/setupApi.js';
import { loginSuccess, selectAuth } from './authSlice.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { FormField } from '../../components/forms/FormField.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { isAuthenticated } = useSelector(selectAuth);
  const setupStatus = useQuery({ queryKey: ['setup', 'status'], queryFn: setupApi.status, retry: false });

  useEffect(() => {
    if (setupStatus.data?.setup_available) navigate('/setup', { replace: true });
  }, [setupStatus.data, navigate]);

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      dispatch(loginSuccess({ token: response.token, user: response.user }));
      showToast('Connexion reussie');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate(Object.fromEntries(form.entries()));
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-sky-600 text-white">
            <KeyRound size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Connexion</h1>
          <p className="text-sm text-slate-500">Accedez a votre espace de gestion.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Email">
            <Input name="email" type="email" required placeholder="manager@client.local" />
          </FormField>
          <FormField label="Mot de passe">
            <Input name="password" type="password" required />
          </FormField>
          <Button type="submit" className="w-full" isLoading={mutation.isPending}>Se connecter</Button>
        </form>
      </Card>
    </main>
  );
}
