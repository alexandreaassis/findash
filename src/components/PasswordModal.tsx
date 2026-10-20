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
import { updateClientPassword, updateClientDisplayName } from '@/services/auth'
import { KeyRound, Building2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

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
  const [clientName, setClientName] = useState(currentClientName)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

  // Sincroniza nome quando o modal abre ou prop muda
  React.useEffect(() => {
    if (open) {
      setClientName(currentClientName)
      setFeedback(null)
    }
  }, [open, currentClientName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = clientName.trim()
    const trimmedPass = newPassword.trim()

    if (!trimmedName) {
      setFeedback({ type: 'error', message: 'O nome da empresa cliente não pode ser vazio.' })
      return
    }

    if (trimmedPass && trimmedPass !== confirmPassword.trim()) {
      setFeedback({ type: 'error', message: 'As senhas digitadas não conferem.' })
      return
    }

    setLoading(true)
    setFeedback(null)

    try {
      const tasks: Promise<unknown>[] = []
      let nameChanged = false
      let passChanged = false

      if (trimmedName !== currentClientName) {
        tasks.push(
          updateClientDisplayName(trimmedName).then((saved) => {
            nameChanged = true
            onClientNameUpdated?.(saved)
          }),
        )
      }

      if (trimmedPass) {
        tasks.push(
          updateClientPassword(trimmedPass).then(() => {
            passChanged = true
          }),
        )
      }

      if (tasks.length === 0) {
        setFeedback({ type: 'success', message: 'Nenhuma alteração pendente para salvar.' })
        setTimeout(() => onOpenChange(false), 900)
        return
      }

      await Promise.all(tasks)

      const successParts: string[] = []
      if (nameChanged) successParts.push('Nome da empresa salvo')
      if (passChanged) successParts.push('senha de acesso atualizada')

      setFeedback({
        type: 'success',
        message: `${successParts.join(' e ')} com sucesso no banco de dados!`,
      })

      setTimeout(() => {
        setNewPassword('')
        setConfirmPassword('')
        setFeedback(null)
        onOpenChange(false)
      }, 1500)
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro ao salvar as configurações no banco.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Configurações da Cliente & Acesso
          </DialogTitle>
          <DialogDescription>
            Defina o nome da empresa cliente e altere a senha de visualização privada do DRE.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Campo Nome da Empresa Cliente */}
          <div className="space-y-2 p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="client-name"
                className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                Nome da Empresa Cliente
              </Label>
              <span className="text-[10px] text-muted-foreground">
                Exibido nos cabeçalhos e relatórios
              </span>
            </div>
            <Input
              id="client-name"
              type="text"
              placeholder="Ex.: Cliente - 3MR Catuaí"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="text-sm bg-white dark:bg-slate-900"
              required
            />
            <p className="text-[11px] text-slate-500">
              Valor padrão inicial:{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Cliente - 3MR Catuaí
              </span>
            </p>
          </div>

          {/* Seção de Senha */}
          <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              Alterar Senha de Acesso (Opcional)
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-pass" className="text-xs text-muted-foreground">
                Nova Senha (deixe em branco para manter a atual)
              </Label>
              <Input
                id="new-pass"
                type="text"
                placeholder="Digite a nova senha (opcional)..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="text-sm"
              />
            </div>

            {newPassword.trim() && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="confirm-pass" className="text-xs text-muted-foreground">
                  Confirmar Nova Senha
                </Label>
                <Input
                  id="confirm-pass"
                  type="text"
                  placeholder="Repita a nova senha..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-sm"
                  required={!!newPassword.trim()}
                />
              </div>
            )}
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
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
