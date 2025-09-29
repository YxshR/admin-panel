'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession()

  const value: AuthContextType = {
    user: session?.user as User | null,
    loading: status === 'loading',
    isAuthenticated: !!session?.user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}