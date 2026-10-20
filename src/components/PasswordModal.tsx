import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  updateClientPassword,
  updateClientDisplayName,
  verifyAdminPassword,
  updateAdminPassword,
} from '@/services/auth'
import {
  KeyRound,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react'

interface PasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentClientName?: string
  onClientNameUpdated?: (newName: string) => void
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  open,
  onOpenChange,
  currentClientName = 'Cliente - 3MR Catuaí',
  onClientNameUpdated,
}) => {
  // Senha de administração A3ONE (obrigatória para desbloquear e salvar qualquer configuração)
  const [adminPassword, setAdminPassword] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false)
  const [unlockLoading, setUnlockLoading] = useState(false)

  // Campos de configuração protegidos
  const [clientName, setClientName] = useState(currentClientName)
  const [newClientPassword, setNewClientPassword] = useState('')
  const [confirmClientPassword, setConfirmClientPassword] = useState('')
  const [showNewClientPass, setShowNewClientPass] = useState(false)

  // Alteração da própria senha A3ONE (opcional, requer admin desbloqueado)
  const [changeAdminPassExpanded, setChangeAdminPassExpanded] = useState(false)
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('')
  const [showNewAdminPass, setShowNewAdminPass] = useState(false)

  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

  // Reset do estado quando o modal abre ou o nome muda
  React.useEffect(() => {
    if (open) {
      setClientName(currentClientName)
      setAdminPassword('')
      setIsAdminUnlocked(false)
      setNewClientPassword('')
      setConfirmClientPassword('')
      setChangeAdminPassExpanded(false)
      setNewAdminPassword('')
      setConfirmAdminPassword('')
      setFeedback(null)
    }
  }, [open, currentClientName])

  // Desbloqueio do painel de administração via senha da A3ONE
  const handleUnlockAdmin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = adminPassword.trim()
    if (!trimmed) {
      setFeedback({
        type: 'error',
        message: 'Informe a senha de administração da A3ONE para continuar.',
      })
      return
    }

    setUnlockLoading(true)
    setFeedback(null)

    try {
      const ok = await verifyAdminPassword(trimmed)
      if (ok) {
        setIsAdminUnlocked(true)
        setFeedback({
          type: 'success',
          message: 'Autenticação da A3ONE confirmada. Edição de configurações liberada.',
        })
      } else {
        setFeedback({
          type: 'error',
          message: 'Senha de administração da A3ONE incorreta. Apenas a A3ONE pode editar.',
        })
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Erro ao validar a senha da A3ONE. Tente novamente.',
      })
    } finally {
      setUnlockLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Barreira rígida: sem senha da A3ONE validada, não salva
    if (!isAdminUnlocked) {
      await handleUnlockAdmin()
      return
    }

    const trimmedName = clientName.trim()
    const trimmedClientPass = newClientPassword.trim()
    const trimmedNewAdminPass = newAdminPassword.trim()

    if (!trimmedName) {
      setFeedback({ type: 'error', message: 'O nome da empresa cliente não pode ser vazio.' })
      return
    }

    if (trimmedClientPass && trimmedClientPass !== confirmClientPassword.trim()) {
      setFeedback({ type: 'error', message: 'A confirmação da nova senha da cliente não confere.' })
      return
    }

    if (trimmedNewAdminPass) {
      if (trimmedNewAdminPass.length < 6) {
        setFeedback({
          type: 'error',
          message: 'A nova senha de administração da A3ONE deve ter no mínimo 6 caracteres.',
        })
        return
      }
      if (trimmedNewAdminPass !== confirmAdminPassword.trim()) {
        setFeedback({
          type: 'error',
          message: 'A confirmação da nova senha da A3ONE não confere.',
        })
        return
      }
    }

    setLoading(true)
    setFeedback(null)

    try {
      // Revalida a senha da A3ONE antes de persistir
      const stillValid = await verifyAdminPassword(adminPassword.trim())
      if (!stillValid) {
        setIsAdminUnlocked(false)
        setFeedback({
          type: 'error',
          message: 'Sessão administrativa expirada ou senha da A3ONE inválida. Digite novamente.',
        })
        setLoading(false)
        return
      }

      let nameChanged = false
      let clientPassChanged = false
      let adminPassChanged = false

      if (trimmedName !== currentClientName) {
        const saved = await updateClientDisplayName(trimmedName)
        nameChanged = true
        onClientNameUpdated?.(saved)
      }

      if (trimmedClientPass) {
        await updateClientPassword(trimmedClientPass)
        clientPassChanged = true
      }

      if (trimmedNewAdminPass) {
        await updateAdminPassword(adminPassword.trim(), trimmedNewAdminPass)
        adminPassChanged = true
        // Atualiza a senha administrativa atual para a nova no estado
        setAdminPassword(trimmedNewAdminPass)
      }

      if (!nameChanged && !clientPassChanged && !adminPassChanged) {
        setFeedback({ type: 'success', message: 'Nenhuma alteração pendente para salvar.' })
        setTimeout(() => onOpenChange(false), 900)
        return
      }

      const parts: string[] = []
      if (nameChanged) parts.push('Nome da cliente atualizado')
      if (clientPassChanged) parts.push('senha de acesso da cliente alterada')
      if (adminPassChanged) parts.push('senha de administração da A3ONE alterada')

      setFeedback({
        type: 'success',
        message: `${parts.join(', ')} com sucesso!`,
      })

      setTimeout(() => {
        setNewClientPassword('')
        setConfirmClientPassword('')
        setNewAdminPassword('')
        setConfirmAdminPassword('')
        setFeedback(null)
        onOpenChange(false)
      }, 1600)
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Erro ao salvar as configurações no banco.'
      setFeedback({ type: 'error', message: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg border border-indigo-100 dark:border-indigo-900">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                Administração & Configurações da Cliente
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Controle exclusivo da{' '}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">A3ONE</span>. A
                cliente possui apenas acesso de leitura à página.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Seção 1: Barreira de Autenticação da A3ONE */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              isAdminUnlocked
                ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/60'
                : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/60'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {isAdminUnlocked ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                <div>
                  <Label
                    htmlFor="admin-password"
                    className={`text-xs font-bold ${
                      isAdminUnlocked
                        ? 'text-emerald-900 dark:text-emerald-200'
                        : 'text-amber-950 dark:text-amber-200'
                    }`}
                  >
                    Senha de Administração da A3ONE
                  </Label>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    {isAdminUnlocked
                      ? 'Administração autenticada: você pode salvar alterações abaixo.'
                      : 'Obrigatória para alterar o nome da cliente e as senhas.'}
                  </p>
                </div>
              </div>
              {isAdminUnlocked && (
                <span className="text-[10px] font-semibold bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                  Liberado
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  id="admin-password"
                  type={showAdminPassword ? 'text' : 'password'}
                  placeholder="Digite a senha da A3ONE..."
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value)
                    if (isAdminUnlocked) setIsAdminUnlocked(false)
                  }}
                  className="text-xs bg-white dark:bg-slate-900 pr-9 h-9"
                  autoFocus={!isAdminUnlocked}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showAdminPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {!isAdminUnlocked && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleUnlockAdmin()}
                  disabled={unlockLoading || !adminPassword.trim()}
                  className="h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                >
                  {unlockLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 mr-1.5" />
                      Validar
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Seção 2: Configurações da Cliente (Desabilitadas até validação A3ONE) */}
          <div
            className={`space-y-4 transition-opacity ${
              isAdminUnlocked ? 'opacity-100' : 'opacity-60 pointer-events-none'
            }`}
          >
            {/* Campo Nome da Empresa Cliente */}
            <div className="space-y-2 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="client-name"
                  className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  Nome da Empresa Cliente
                </Label>
                <span className="text-[10px] text-muted-foreground">Exibido em todo o DRE</span>
              </div>
              <Input
                id="client-name"
                type="text"
                placeholder="Ex.: Cliente - 3MR Catuaí"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="text-xs bg-white dark:bg-slate-900 h-9"
                disabled={!isAdminUnlocked}
                required
              />
              <p className="text-[11px] text-slate-500">
                Nome atual salvo:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {currentClientName}
                </span>
              </p>
            </div>

            {/* Alterar Senha de Acesso da Cliente (Leitura da Página) */}
            <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Senha de Acesso da Cliente (Leitura)
                </div>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  Visualização da Página
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Esta é a senha que a cliente usa na tela inicial para entrar e ver os
                demonstrativos. Deixe em branco para manter a senha atual.
              </p>

              <div className="space-y-2">
                <Label htmlFor="client-new-pass" className="text-[11px] text-muted-foreground">
                  Nova Senha de Acesso da Cliente (opcional)
                </Label>
                <div className="relative">
                  <Input
                    id="client-new-pass"
                    type={showNewClientPass ? 'text' : 'password'}
                    placeholder="Digite nova senha da cliente..."
                    value={newClientPassword}
                    onChange={(e) => setNewClientPassword(e.target.value)}
                    disabled={!isAdminUnlocked}
                    className="text-xs bg-white dark:bg-slate-900 pr-9 h-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewClientPass(!showNewClientPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showNewClientPass ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {newClientPassword.trim() && (
                <div className="space-y-1.5 animate-fade-in">
                  <Label
                    htmlFor="client-confirm-pass"
                    className="text-[11px] text-muted-foreground"
                  >
                    Confirmar Nova Senha da Cliente
                  </Label>
                  <Input
                    id="client-confirm-pass"
                    type="password"
                    placeholder="Repita a nova senha da cliente..."
                    value={confirmClientPassword}
                    onChange={(e) => setConfirmClientPassword(e.target.value)}
                    disabled={!isAdminUnlocked}
                    className="text-xs bg-white dark:bg-slate-900 h-9"
                    required={!!newClientPassword.trim()}
                  />
                </div>
              )}
            </div>

            {/* Troca da própria senha de administração da A3ONE */}
            <div className="p-3 bg-indigo-950/5 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
              <button
                type="button"
                onClick={() => setChangeAdminPassExpanded(!changeAdminPassExpanded)}
                disabled={!isAdminUnlocked}
                className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Trocar Senha de Administração da A3ONE
                </span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-normal">
                  {changeAdminPassExpanded ? 'Ocultar' : 'Alterar'}
                </span>
              </button>

              {changeAdminPassExpanded && (
                <div className="mt-3 space-y-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/60 animate-fade-in">
                  <p className="text-[11px] text-slate-500">
                    Altera a senha de configuração da própria A3ONE (exige no mínimo 6 caracteres).
                  </p>

                  <div className="space-y-1.5">
                    <Label htmlFor="admin-new-pass" className="text-[11px] text-muted-foreground">
                      Nova Senha da A3ONE
                    </Label>
                    <div className="relative">
                      <Input
                        id="admin-new-pass"
                        type={showNewAdminPass ? 'text' : 'password'}
                        placeholder="Digite a nova senha de administração..."
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        className="text-xs bg-white dark:bg-slate-900 pr-9 h-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewAdminPass(!showNewAdminPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        tabIndex={-1}
                      >
                        {showNewAdminPass ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {newAdminPassword.trim() && (
                    <div className="space-y-1.5 animate-fade-in">
                      <Label
                        htmlFor="admin-confirm-pass"
                        className="text-[11px] text-muted-foreground"
                      >
                        Confirmar Nova Senha da A3ONE
                      </Label>
                      <Input
                        id="admin-confirm-pass"
                        type="password"
                        placeholder="Repita a nova senha da A3ONE..."
                        value={confirmAdminPassword}
                        onChange={(e) => setConfirmAdminPassword(e.target.value)}
                        className="text-xs bg-white dark:bg-slate-900 h-9"
                        required={!!newAdminPassword.trim()}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || unlockLoading}
              className="text-xs h-9"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || unlockLoading || (!isAdminUnlocked && !adminPassword.trim())}
              className={`text-xs h-9 text-white ${
                isAdminUnlocked
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Salvando alterações...
                </>
              ) : isAdminUnlocked ? (
                'Salvar Configurações (A3ONE)'
              ) : (
                'Validar Senha A3ONE'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
