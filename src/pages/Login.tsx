import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, user } = useAuthStore();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isResetPassword) {
        await resetPassword(email);
        toast.success('Email de recuperação enviado!');
        setIsResetPassword(false);
      } else if (isSignUp) {
        if (password !== confirmPassword) {
          toast.error('As senhas não coincidem');
          return;
        }
        await signUp(email, password);
        toast.success('Conta criada com sucesso!');
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00CC73] to-[#22C25F] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm mb-4 shadow-lg transform hover:scale-105 transition-transform">
            <Wallet className="h-8 w-8 text-[#00CC73]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isResetPassword ? 'Recuperar Senha' : isSignUp ? 'Criar Conta' : 'Bem-vindo de volta'}
          </h1>
          <p className="text-white/80">
            {isResetPassword
              ? 'Digite seu email para recuperar sua senha'
              : isSignUp
              ? 'Preencha seus dados para criar sua conta'
              : 'Digite seus dados para acessar sua conta'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-[#00CC73]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-[#00CC73] focus:border-transparent transition-all duration-300 outline-none group-focus-within:shadow-md"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {!isResetPassword && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-[#00CC73]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-12 py-3 w-full border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-[#00CC73] focus:border-transparent transition-all duration-300 outline-none group-focus-within:shadow-md"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Confirmar Senha
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-[#00CC73]" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-12 py-3 w-full border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-[#00CC73] focus:border-transparent transition-all duration-300 outline-none group-focus-within:shadow-md"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00CC73] to-[#22C25F] text-white py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>
                    {isResetPassword
                      ? 'Enviar email de recuperação'
                      : isSignUp
                      ? 'Criar conta'
                      : 'Entrar'}
                  </span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Action Links */}
          <div className="mt-6 space-y-2">
            {!isResetPassword && (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="w-full text-center text-sm text-[#00CC73] hover:text-[#22C25F] transition-colors"
              >
                {isSignUp
                  ? 'Já tem uma conta? Entre aqui'
                  : 'Não tem uma conta? Cadastre-se'}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsResetPassword(!isResetPassword);
                setPassword('');
                setConfirmPassword('');
              }}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isResetPassword
                ? 'Voltar para o login'
                : 'Esqueceu sua senha?'}
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 flex items-center justify-center text-white/80 text-sm">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>Suas informações estão protegidas</span>
        </div>
      </div>
    </div>
  );
}