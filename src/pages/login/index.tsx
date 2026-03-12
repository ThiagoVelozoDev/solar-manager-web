import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Sun, Eye, EyeOff, Mail, Lock } from "lucide-react"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

import backgroundImage from "../../assets/fundo.png"


const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
})

type LoginFormData = z.infer<typeof loginSchema>

export  function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })



  const onSubmit = (data: LoginFormData) => {
    console.log(data)

    // simulação login
    navigate("/dashboard")
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

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex  items-center z-10">
         <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
            <Sun className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white text-2xl font-semibold tracking-wide">SolarManager</span>
        </div>
      </div>

      {/* Login Form */}
      <div className="relative z-20 w-full max-w-md mx-4">
        <div className="bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/10">

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Bem-vindo
            </h2>

            <p className="text-gray-300 text-sm">
              Faça login para acessar o sistema
            </p>
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
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium text-base"
            >
              LOGIN
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