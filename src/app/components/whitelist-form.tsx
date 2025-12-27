'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import AuthButton from './auth-button'
import AdminButton from './admin-button'
import ProfileCard from './profile-card'
import { motion, AnimatePresence } from 'framer-motion'
import { applicationConfig, getMinimumAge } from '@/lib/config'

interface DiscordUser {
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

interface ExtendedSession {
  discord?: DiscordUser
}

const generateFormSchema = () => {
  const schema: Record<string, z.ZodType> = {}

  applicationConfig.sections.forEach(section => {
    section.fields.forEach(field => {
      let fieldSchema: z.ZodType

      switch (field.type) {
        case 'text':
          fieldSchema = z.string()
          if (field.minLength) {
            fieldSchema = (fieldSchema as z.ZodString).min(field.minLength, field.validationMessage)
          }
          if (field.pattern) {
            fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(field.pattern), field.validationMessage)
          }
          break
        case 'number':
          fieldSchema = z.number().min(getMinimumAge(), applicationConfig.messages.ageRequirement)
          break
        case 'url':
          fieldSchema = z.string().url(field.validationMessage)
          break
        case 'textarea':
          fieldSchema = z.string()
          if (field.minLength) {
            fieldSchema = (fieldSchema as z.ZodString).min(field.minLength, field.validationMessage)
          }
          break
        default:
          fieldSchema = z.string()
      }

      schema[field.name] = field.required ? fieldSchema : fieldSchema.optional()
    })
  })

  return z.object(schema)
}

const formSchema = generateFormSchema()

const generateDefaultValues = () => {
  const defaults: Record<string, string | number> = {}
  applicationConfig.sections.forEach(section => {
    section.fields.forEach(field => {
      defaults[field.name] = field.type === 'number' ? getMinimumAge() : ''
    })
  })
  return defaults
}

const CharacterCount = ({ current, required }: { current: number; required: number }) => (
  <span className={current >= required ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
    {current}/{required}
  </span>
)

const FormSection = ({
  section,
  form,
  delay
}: {
  section: typeof applicationConfig.sections[0]
  form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>
  delay: number
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay, duration: 0.3 }}
    className="space-y-6"
  >
    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
      <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
      </svg>
      <h3 className="text-lg font-semibold">{section.title}</h3>
    </div>

    {section.id === 'personal' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {section.fields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">{field.label}</FormLabel>
                <FormControl>
                  <Input
                    type={field.type === 'number' ? 'number' : 'text'}
                    placeholder={field.placeholder}
                    className="bg-background"
                    {...formField}
                    onChange={(e) => field.type === 'number'
                      ? formField.onChange(e.target.value ? parseInt(e.target.value, 10) : '')
                      : formField.onChange(e)
                    }
                  />
                </FormControl>
                <FormDescription className="text-xs">{field.description}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    )}

    {section.id === 'auth' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {section.fields.map((field, index) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">{field.label}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={field.placeholder}
                    className={index === 0 ? "bg-background font-mono text-sm" : "bg-background text-sm"}
                    {...formField}
                  />
                </FormControl>
                <FormDescription className="text-xs">{field.description}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    )}

    {section.id === 'roleplay' && (
      <div className="space-y-6">
        {section.fields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">{field.label}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={field.placeholder}
                    className="min-h-[120px] bg-background resize-none"
                    {...formField}
                  />
                </FormControl>
                <FormDescription className="text-xs flex justify-between">
                  <span>{field.description}</span>
                  <CharacterCount current={formField.value.length} required={field.minLength || 0} />
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    )}
  </motion.div>
)

export default function WhitelistForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: session } = useSession()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: generateDefaultValues(),
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!(session as ExtendedSession)?.discord) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in with Discord before submitting.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    const applicationData = {
      ...values,
      discord: (session as ExtendedSession).discord,
    }

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      })

      if (response.ok) {
        toast({
          title: applicationConfig.ui.successTitle,
          description: applicationConfig.ui.successDescription,
        })
        form.reset()
      } else {
        throw new Error('Failed to submit application')
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      toast({
        title: applicationConfig.ui.errorTitle,
        description: applicationConfig.ui.errorDescription,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      <div className={`mb-8 ${session ? 'flex justify-end gap-4' : 'flex justify-center'}`}>
        <AuthButton />
        {session && <AdminButton />}
      </div>
      <AnimatePresence>
        {(session as ExtendedSession)?.discord ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <ProfileCard profile={(session as ExtendedSession).discord} />
              </div>
            </div>
            <div className="lg:col-span-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <Card className="border-border/50">
                    <CardHeader className="border-b border-border/50 bg-muted/20">
                      <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight">{applicationConfig.ui.formTitle}</h2>
                        <p className="text-sm text-muted-foreground">{applicationConfig.ui.formDescription}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                      {applicationConfig.sections.map((section, index) => (
                        <FormSection
                          key={section.id}
                          section={section}
                          form={form}
                          delay={0.1 + index * 0.1}
                        />
                      ))}
                    </CardContent>
                  </Card>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 text-base font-semibold"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {applicationConfig.ui.submittingButtonText}
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {applicationConfig.ui.submitButtonText}
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <svg className="w-20 h-20 text-muted-foreground/30 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-2xl font-bold mb-2">Authentication Required</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Please sign in with Discord to access the whitelist application form and verify your identity.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

