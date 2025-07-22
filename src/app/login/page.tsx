"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Eye, EyeOff, Brain } from "lucide-react";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    
    // Simulate API call for demo
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, accept any valid email/password
      if (data.email && data.password.length >= 6) {
        localStorage.setItem("user", JSON.stringify({
          email: data.email,
          name: "Demo User",
          role: "Admin"
        }));
        router.push("/dashboard");
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      form.setError("password", { message: "Invalid email or password" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Smooth Orange Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 dark:from-orange-600 dark:via-orange-700 dark:to-amber-700"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-orange-300/40 via-transparent to-amber-400/30 dark:from-orange-500/30 dark:via-transparent dark:to-amber-600/20 animate-gradient-drift"></div>
      <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-orange-400/20 to-yellow-400/25 dark:from-transparent dark:via-orange-600/15 dark:to-yellow-600/15 animate-gradient-drift-slow"></div>
      {/* Floating Orange Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-300/15 rounded-full blur-3xl animate-float-reverse"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl animate-float-diagonal"></div>
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-orange-400/12 rounded-full blur-3xl animate-float-up"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="mr-3">
              <Image 
                src="/tgl.png" 
                alt="The Graine Ledger" 
                width={48} 
                height={48} 
                className="h-12 w-12 rounded-full"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">The Graine Ledger</h1>
              <p className="text-white/80 text-sm drop-shadow">Powered by Varuni AI</p>
            </div>
          </div>
          <div className="flex items-center justify-center text-sm text-white/70 mb-2 drop-shadow">
            <Brain className="h-4 w-4 mr-1" />
            <span>AI-Powered Restaurant Management</span>
          </div>
        </div>

        {/* Login Card */}
        <Card className="backdrop-blur-xl bg-white/20 dark:bg-slate-900/40 border-white/30 dark:border-slate-700/50 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <h2 className="text-2xl font-bold text-center text-white drop-shadow">Welcome Back</h2>
            <p className="text-white/70 text-center text-sm drop-shadow-sm">
              Sign in to your backoffice dashboard
            </p>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="admin@thegraineledger.com"
                          type="email"
                          disabled={isLoading}
                          {...field}
                          className="h-11 bg-white/20 border-white/30 text-white placeholder:text-white/60 backdrop-blur-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter your password"
                            type={showPassword ? "text" : "password"}
                            disabled={isLoading}
                            {...field}
                            className="h-11 pr-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 backdrop-blur-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-white/60 hover:text-white" />
                            ) : (
                              <Eye className="h-4 w-4 text-white/60 hover:text-white" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-lg backdrop-blur-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2 text-center text-sm text-white/60">
            <p className="drop-shadow-sm">Forgot your password? Contact your system administrator</p>
            <div className="pt-2 border-t border-white/20">
              <p className="text-xs text-white/50 drop-shadow-sm">
                Demo Login: Use any valid email and password (6+ characters)
              </p>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-white/50 drop-shadow">
          <p>© 2025 The Graine Ledger. All rights reserved.</p>
          <p className="mt-1">Built with Varuni AI Technology</p>
        </div>
      </div>
    </div>
  );
} 