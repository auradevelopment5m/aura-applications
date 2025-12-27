'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from "next-auth/react"
import type { Session } from "next-auth"
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import ProfileCard from '@/app/components/profile-card'
import { motion, AnimatePresence } from 'framer-motion'
import { isAdmin } from '@/lib/auth'

type DiscordUser = {
  id: string
  username: string
  discriminator: string
  avatar: string
  banner: string
  accentColor: number | null
  verified: boolean
  email: string
  createdAt: string
}

interface ExtendedSession extends Session {
  discord: DiscordUser
}

type Application = {
  id: string
  timestamp: string
  username: string
  age: number
  steamId: string
  cfxAccount: string
  experience: string
  character: string
  discord: DiscordUser
  status?: 'pending' | 'approved' | 'denied'
}

export default function AdminApplications() {
  const { data: session, status } = useSession()
  const [applications, setApplications] = useState<Application[]>([])
  const [reason, setReason] = useState('')
  const { toast } = useToast()
  const router = useRouter()

  const fetchApplications = useCallback(async () => {
    try {
      const response = await fetch('/api/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      } else {
        throw new Error('Failed to fetch applications')
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch applications. Please try again.',
        variant: 'destructive',
      })
    }
  }, [toast])

  useEffect(() => {
    if (status === 'unauthenticated' || ((session as ExtendedSession)?.discord && !isAdmin((session as ExtendedSession).discord.id))) {
      router.push('/')
    } else if (status === 'authenticated' && isAdmin((session as ExtendedSession)?.discord?.id)) {
      fetchApplications()
    }
  }, [status, session, router, fetchApplications])

  const handleStatusUpdate = async (applicationId: string, newStatus: 'approved' | 'denied') => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, reason }),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update application status')
      }

      const data = await response.json()
      toast({
        title: newStatus === 'approved' ? 'Application Approved' : 'Application Denied',
        description: data.discordMessageSent
          ? `The application has been ${newStatus} and moved to the archive. The applicant has been notified via Discord.`
          : `The application has been ${newStatus} and moved to the archive. Discord notification has been queued for delivery.`,
      })
      fetchApplications()
      setReason('')

      if (newStatus === 'approved') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#ffffff', '#e5e5e5', '#d4d4d4'],
          ticks: 200,
          gravity: 0.8,
          scalar: 0.8
        })
      } else {
        const pulseEffect = document.createElement('div')
        pulseEffect.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%);
          pointer-events: none;
          z-index: 9999;
          animation: pulse-fade 1s ease-out;
        `
        const style = document.createElement('style')
        style.textContent = `
          @keyframes pulse-fade {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
          }
        `
        document.head.appendChild(style)
        document.body.appendChild(pulseEffect)
        setTimeout(() => {
          document.body.removeChild(pulseEffect)
          document.head.removeChild(style)
        }, 1000)
      }
    } catch (error) {
      console.error('Error updating application status:', error)
      toast({
        title: 'Update Error',
        description: error instanceof Error ? error.message : 'There was an error updating the application status.',
        variant: 'destructive',
      })
    }
  }

  if (status === 'loading' || !(session as ExtendedSession)?.discord || !isAdmin((session as ExtendedSession).discord.id)) {
    return null
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Applications</h1>
          <p className="text-muted-foreground">Review and manage whitelist applications</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/archive">
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Archive
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Button>
          </Link>
        </div>
      </div>
      
      {applications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <svg className="w-16 h-16 text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold mb-2">No pending applications</h3>
            <p className="text-sm text-muted-foreground">New applications will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {applications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border-border/50 hover:border-border transition-colors">
                  <CardHeader className="border-b border-border/50 bg-muted/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-1">{app.username}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Submitted {new Date(app.timestamp).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1">
                        <ProfileCard profile={app.discord} />
                      </div>
                      <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Age</p>
                            <p className="text-base font-medium">{app.age} years old</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Steam ID</p>
                            <p className="text-base font-mono text-sm">{app.steamId}</p>
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CFX Account</p>
                            <a href={app.cfxAccount} target="_blank" rel="noopener noreferrer" className="text-base text-primary hover:underline break-all">
                              {app.cfxAccount}
                            </a>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Roleplay Experience</p>
                            <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{app.experience}</p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Character Backstory</p>
                            <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{app.character}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-4 space-y-3 border-t border-border/50">
                          <Input
                            placeholder="Optional reason for approval/denial..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="bg-background"
                          />
                          <div className="flex gap-3">
                            <Button 
                              onClick={() => handleStatusUpdate(app.id, 'approved')} 
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              size="lg"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </Button>
                            <Button 
                              onClick={() => handleStatusUpdate(app.id, 'denied')} 
                              variant="destructive"
                              className="flex-1"
                              size="lg"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Deny
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

