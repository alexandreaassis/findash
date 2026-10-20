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
import { updateClientPassword } from '@/services/auth'
import { KeyRound, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface PasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ open, onOpenChange }) => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword.trim()) {
      setFeedback({ type: 'error', message: 'A nova senha não pode ser vazia.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'As senhas digitadas não conferem.' })
      return
    }

    setLoading(true)
    setFeedback(null)

    try {
      await updateClientPassword(newPassword)
      setFeedback({
        type: 'success',
        message: 'Senha de acesso da cliente atualizada com sucesso no banco de dados!',
      })
      setTimeout(() => {
        setNewPassword('')
        setConfirmPassword('')
        setFeedback(null)
        onOpenChange(false)
      }, 1500)
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro ao salvar a nova senha no banco.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            Alterar Senha Única da Cliente
          </DialogTitle>
          <DialogDescription>
            Defina uma nova senha de visualização para a dona da empresa ou cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="new-pass" className="text-xs">
              Nova Senha
            </Label>
            <Input
              id="new-pass"
              type="text"
              placeholder="Digite a nova senha..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-pass" className="text-xs">
              Confirmar Nova Senha
            </Label>
            <Input
              id="confirm-pass"
              type="text"
              placeholder="Repita a nova senha..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="text-sm"
              required
            />
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
                'Salvar Senha'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
