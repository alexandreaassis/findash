import React, { useState } from 'react'
import a3oneLogo from '@/assets/a3one-solucoes-integradas-2-48667.png'
import {
  verifyClientPassword,
  setClientAuthenticated,
  getClientDisplayName,
  DEFAULT_CLIENT_NAME,
} from '@/services/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Lock, Eye, EyeOff, ArrowRight, Loader2, FileSpreadsheet } from 'lucide-react'

interface AuthGateProps {
  onSuccess: () => void
}

export const AuthGate: React.FC<AuthGateProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientName, setClientName] = useState<string>(DEFAULT_CLIENT_NAME)

  React.useEffect(() => {
    getClientDisplayName()
      .then(setClientName)
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Por favor, informe a senha de acesso.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const isValid = await verifyClientPassword(password)
      if (isValid) {
        setClientAuthenticated(true)
        onSuccess()
      } else {
        setError('Senha incorreta. Verifique com a administração da empresa.')
      }
    } catch (err) {
      console.error(err)
      setError('Ocorreu um erro ao verificar a senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          {/* Logomarca A3ONE com fundo branco contido */}
          <div className="bg-white rounded-2xl px-6 py-3 shadow-2xl inline-flex items-center justify-center mb-5 border border-white/20">
            <img
              src={a3oneLogo}
              alt="A3ONE — Soluções Integradas"
              className="w-48 sm:w-52 h-auto max-h-16 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Página Financeira Privada
          </h1>
          <p className="text-sm text-indigo-300 font-medium mt-1">
            Demonstrativo financeiro — {clientName}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Demonstrativo de Resultados do Exercício (2025 – 2026)
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl text-slate-100">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
                <Lock className="w-4 h-4 text-indigo-400" />
                Acesso Exclusivo da Cliente
              </CardTitle>
              <span
                className="text-[11px] font-medium text-indigo-300 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded-full truncate max-w-[170px]"
                title={clientName}
              >
                {clientName}
              </span>
            </div>
            <CardDescription className="text-slate-400 text-xs">
              Digite a senha única fornecida para visualizar os demonstrativos, indicadores e
              gráficos comparativos de {clientName}.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite a senha de acesso..."
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (error) setError(null)
                    }}
                    className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 pr-10 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <p className="text-xs text-rose-400 font-medium animate-fade-in flex items-center gap-1.5 pt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                    {error}
                  </p>
                )}
              </div>

              <div className="bg-slate-950/40 rounded-lg p-3 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-300 font-medium">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Dados Seguros & Confidenciais
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Relatório executivo Jan–Set 2025 x 2026 com receitas, deduções detalhadas, margem
                  de contribuição e despesas operacionais.
                </p>
              </div>
            </CardContent>

            <CardFooter className="pt-2 pb-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md transition-all h-10"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validando acesso...
                  </>
                ) : (
                  <>
                    Acessar DRE da Empresa
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center mt-6 text-xs text-slate-500">
          Acesso restrito e confidencial para a diretoria e cliente.
        </div>
      </div>
    </div>
  )
}
