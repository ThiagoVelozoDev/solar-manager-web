import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { toast } from 'sonner'

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../components/auth/AuthContext'

import backgroundImage from "../../assets/fundo.png"
import logoImage from "../../assets/logo.png"


const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
})

type LoginFormData = z.infer<typeof loginSchema>

export  function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const { setSession } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })



  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await apiFetch<{
        token: string
        user: {
          id: number
          name: string
          email: string
          cpf: string
          phone: string | null
          active: boolean
          roleId: number | null
          roleName: string | null
          permissions: string[]
          createdAt: string
          updatedAt: string
        }
      }>("/auth/login", {
        method: 'POST',
        body: JSON.stringify(data),
      })

      setSession({ token: response.token, user: response.user })
      toast.success(`Bem-vindo, ${response.user.name}!`)

      const redirectTo = typeof location.state === 'object'
        && location.state !== null
        && 'from' in location.state
        && typeof location.state.from === 'object'
        && location.state.from !== null
        && 'pathname' in location.state.from
        && typeof location.state.from.pathname === 'string'
        ? location.state.from.pathname
        : '/dashboard'

      navigate(redirectTo, { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel realizar o login'
      toast.error(message)
    }
  }

  return (
    <div
      className="min-h-screen relative flex items-center justify-center"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-blue-800/20 to-blue-900/30" />

      {/* Login Form */}
      <div className="relative z-20 w-full max-w-md mx-4">
        <div className="bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/10">

          <div className="mb-8 flex flex-col items-center gap-4">
            <img
              src={logoImage}
              alt="SolarManager"
              className="h-20 w-auto object-contain drop-shadow-[0_2px_16px_rgba(0,142,211,0.45)]"
            />
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-white mb-1">
                Bem-vindo
              </h2>
              <p className="text-gray-300 text-sm">
                Faça login para acessar o sistema
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-sm">
                E-mail
              </Label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <Input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10 bg-white/95 border-gray-300 h-12"
                />
              </div>

              {errors.email && (
                <p className="text-red-400 text-xs">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white text-sm">
                Senha
              </Label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <Input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  className="pl-10 pr-10 bg-white/95 border-gray-300 h-12"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="text-red-400 text-xs">
                  {errors.password.message}
                </p>
              )}
            </div>


            {/* LOGIN BUTTON */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-[#008ed3] to-[#0055a3] hover:from-[#0055a3] hover:to-[#0e457f] text-white font-medium text-base"
            >
              {isSubmitting ? 'ENTRANDO...' : 'LOGIN'}
            </Button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
        <p className="text-white text-xs bg-black/30 backdrop-blur-sm inline-block px-4 py-2 rounded">
          Sistema de Gestão de Usinas Solares - SolarManager v1.0
        </p>
      </div>
    </div>
  )
}