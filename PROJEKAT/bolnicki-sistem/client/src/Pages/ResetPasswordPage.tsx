import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Lozinka mora imati najmanje 8 karaktera.'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Lozinke se ne podudaraju.",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setStatus('error');
      setMessage('Neispravan ili nedostajući token za resetovanje lozinke.');
      return;
    }

    setStatus('loading');
    setMessage('');
    
    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
        token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      setStatus('success');
      setMessage(response.data.poruka || 'Lozinka je uspješno resetovana.');
    } catch (error: any) {
      setStatus('error');
      setMessage(
        error.response?.data?.poruka || 
        'Došlo je do greške. Pokušajte ponovo kasnije.'
      );
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-slate-100 text-center">
            <h3 className="text-lg font-medium text-red-600 mb-2">Nedostaje token</h3>
            <p className="text-sm text-slate-600 mb-6">Link za resetovanje lozinke je neispravan.</p>
            <Link
              to="/forgot-password"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Zatraži novi link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Postavite novu lozinku
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Molimo unesite Vašu novu lozinku ispod.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-slate-100">
          {status === 'success' ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Uspješno!</h3>
              <p className="text-sm text-slate-600 mb-6">{message}</p>
              <Link
                to="/prijava"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Prijavite se
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {status === 'error' && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{message}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">
                  Nova lozinka
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="newPassword"
                    type="password"
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.newPassword ? 'border-red-300 ring-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 sm:text-sm transition-colors`}
                    placeholder="••••••••"
                    {...register('newPassword')}
                  />
                </div>
                {errors.newPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                  Potvrdite lozinku
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.confirmPassword ? 'border-red-300 ring-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 sm:text-sm transition-colors`}
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Spašavanje...
                    </>
                  ) : (
                    'Resetuj lozinku'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
