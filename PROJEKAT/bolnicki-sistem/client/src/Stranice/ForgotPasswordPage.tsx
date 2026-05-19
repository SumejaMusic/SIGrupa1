import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Unesite validnu email adresu.'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setStatus('loading');
    setMessage('');
    
    try {
      const response = await axios.post(apiUrl('/api/auth/forgot-password'), {
        email: data.email,
      });
      setStatus('success');
      setMessage(response.data.poruka);
    } catch (error: any) {
      setStatus('error');
      setMessage(
        error.response?.data?.poruka || 
        error.response?.data?.errors?.[0]?.msg || 
        'Došlo je do greške. Pokušajte ponovo kasnije.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Resetovanje lozinke
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Unesite svoju email adresu i poslat ćemo vam link za resetovanje lozinke.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-slate-100">
          {status === 'success' ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Email poslan</h3>
              <p className="text-sm text-slate-600 mb-6">{message}</p>
              <Link
                to="/"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Nazad na prijavu
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
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email adresa
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.email ? 'border-red-300 ring-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 sm:text-sm transition-colors`}
                    placeholder="vas@email.com"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600" id="email-error">
                    {errors.email.message}
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
                      Slanje...
                    </>
                  ) : (
                    'Pošalji link za resetovanje'
                  )}
                </button>
              </div>
              
              <div className="text-center mt-4">
                <Link to="/" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Nazad na prijavu
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
